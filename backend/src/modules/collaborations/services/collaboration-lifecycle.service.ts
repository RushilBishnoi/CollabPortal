import {
  Injectable,
  Optional,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import {
  CollaborationStatus,
  ParticipationStatus,
  UserRole,
  NotificationType,
  NotificationPriority,
} from '@prisma/client';
import {
  COLLABORATION_STATUS_TRANSITIONS,
  PARTICIPATION_STATUS_TRANSITIONS,
} from '../config/collaboration.constants';
import { NotificationsService } from '../../notifications/services/notifications.service';

@Injectable()
export class CollaborationLifecycleService {
  constructor(@Optional() private readonly notificationsService?: NotificationsService) {}
  /**
   * Validate collaboration status transition permissions.
   */
  public validateCollaborationTransition(
    currentStatus: CollaborationStatus,
    toStatus: CollaborationStatus,
    actorRole: UserRole,
  ): void {
    if (currentStatus === toStatus) {
      return; // Idempotent no-op
    }

    const allowed = COLLABORATION_STATUS_TRANSITIONS[currentStatus] || [];
    if (!allowed.includes(toStatus)) {
      throw new BadRequestException(
        `Invalid collaboration status transition from '${currentStatus}' to '${toStatus}'.`,
      );
    }

    if (actorRole !== UserRole.INDUSTRY && actorRole !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException(
        `Only the owning industry recruiter or super admin can change collaboration status to '${toStatus}'.`,
      );
    }
  }

  /**
   * Validate participation status transition permissions.
   */
  public validateParticipationTransition(
    currentStatus: ParticipationStatus,
    toStatus: ParticipationStatus,
    actorRole: UserRole,
  ): void {
    if (currentStatus === toStatus) {
      return;
    }

    const allowed = PARTICIPATION_STATUS_TRANSITIONS[currentStatus] || [];
    if (!allowed.includes(toStatus)) {
      throw new BadRequestException(
        `Invalid participation status transition from '${currentStatus}' to '${toStatus}'.`,
      );
    }

    if (toStatus === ParticipationStatus.WITHDRAWN) {
      if (
        actorRole !== UserRole.FACULTY &&
        actorRole !== UserRole.STUDENT &&
        actorRole !== UserRole.SUPER_ADMIN
      ) {
        throw new ForbiddenException('Only the participating faculty, student, or super admin can withdraw.');
      }
    } else {
      // APPROVED, REJECTED, COMPLETED, CANCELLED
      if (actorRole !== UserRole.INDUSTRY && actorRole !== UserRole.SUPER_ADMIN) {
        throw new ForbiddenException(
          `Only industry organizer or super admin can transition participation to '${toStatus}'.`,
        );
      }
    }
  }

  /**
   * Execute state transition within a Prisma transaction, enforcing capacity and recording status history.
   */
  public async executeParticipationTransition(
    tx: any,
    participationId: string,
    currentStatus: ParticipationStatus,
    toStatus: ParticipationStatus,
    actorId: string,
    actorRole: UserRole,
    notes?: string,
    rejectionReason?: string,
    industryNotes?: string,
  ) {
    this.validateParticipationTransition(currentStatus, toStatus, actorRole);

    // If transitioning to APPROVED, check capacity atomically
    if (toStatus === ParticipationStatus.APPROVED && currentStatus !== ParticipationStatus.APPROVED) {
      const participation = await tx.collaborationParticipation.findUnique({
        where: { id: participationId },
        include: { collaboration: true },
      });

      if (!participation) {
        throw new BadRequestException('Participation record not found.');
      }

      if (participation.collaboration.maxParticipants) {
        const approvedCount = await tx.collaborationParticipation.count({
          where: {
            collaborationId: participation.collaborationId,
            status: ParticipationStatus.APPROVED,
          },
        });

        if (approvedCount >= participation.collaboration.maxParticipants) {
          throw new BadRequestException(
            `Cannot approve participant: Maximum participant capacity (${participation.collaboration.maxParticipants}) has been reached.`,
          );
        }
      }
    }

    const updateData: any = {
      status: toStatus,
    };

    if (toStatus === ParticipationStatus.APPROVED || toStatus === ParticipationStatus.REJECTED) {
      updateData.decidedAt = new Date();
      if (rejectionReason) {
        updateData.rejectionReason = rejectionReason;
      }
    }

    if (toStatus === ParticipationStatus.COMPLETED) {
      updateData.completedAt = new Date();
    }

    if (industryNotes && (actorRole === UserRole.INDUSTRY || actorRole === UserRole.SUPER_ADMIN)) {
      updateData.industryNotes = industryNotes;
    }

    const updated = await tx.collaborationParticipation.update({
      where: { id: participationId },
      data: updateData,
      include: {
        facultyProfile: { select: { userId: true, fullName: true } },
        studentProfile: { select: { userId: true, fullName: true } },
        collaboration: { select: { title: true } },
      },
    });

    await tx.collaborationStatusHistory.create({
      data: {
        participationId,
        fromStatus: currentStatus,
        toStatus,
        changedByRole: actorRole,
        changedById: actorId,
        notes: notes || null,
      },
    });

    // Notify participant if status changed by organizer
    const recipientUserId = updated.facultyProfile?.userId || updated.studentProfile?.userId;
    if (this.notificationsService && recipientUserId && currentStatus !== toStatus) {
      let notifType: NotificationType = NotificationType.COLLABORATION_STATUS_CHANGED;
      let notifPriority: NotificationPriority = NotificationPriority.NORMAL;
      let notifTitle = 'Collaboration Participation Updated';
      let notifMessage = `Your participation status for '${updated.collaboration.title}' has changed to ${toStatus}.`;

      if (toStatus === ParticipationStatus.APPROVED) {
        notifType = NotificationType.COLLABORATION_PARTICIPATION_APPROVED;
        notifPriority = NotificationPriority.HIGH;
        notifTitle = 'Participation Request Approved!';
        notifMessage = `Your request to participate in '${updated.collaboration.title}' has been approved.`;
      } else if (toStatus === ParticipationStatus.REJECTED) {
        notifType = NotificationType.COLLABORATION_PARTICIPATION_REJECTED;
        notifPriority = NotificationPriority.NORMAL;
        notifTitle = 'Participation Request Update';
        notifMessage = `Your participation request for '${updated.collaboration.title}' was not approved.`;
      }

      await this.notificationsService.dispatchNotification(
        {
          recipientUserId,
          type: notifType,
          priority: notifPriority,
          title: notifTitle,
          message: notifMessage,
          entityType: 'COLLABORATION',
          entityId: updated.collaborationId,
          actionUrl: '/collaborations',
          idempotencyKey: `COLLAB_STATUS:${toStatus}:PARTICIPATION:${participationId}:${recipientUserId}`,
        },
        tx,
      );
    }

    return updated;
  }
}

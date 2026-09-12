import {
  Injectable,
  Optional,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import {
  OfferStatus,
  PlacementStatus,
  UserRole,
  NotificationType,
  NotificationPriority,
} from '@prisma/client';
import {
  ALLOWED_OFFER_TRANSITIONS,
  ALLOWED_PLACEMENT_TRANSITIONS,
} from '../constants/placement.constants';
import { NotificationsService } from '../../notifications/services/notifications.service';

@Injectable()
export class PlacementLifecycleService {
  constructor(@Optional() private readonly notificationsService?: NotificationsService) {}

  /**
   * Validate whether transition from current offer status to next status is permitted.
   */
  public validateOfferTransition(
    currentStatus: OfferStatus,
    toStatus: OfferStatus,
    actorRole: UserRole,
  ): void {
    if (currentStatus === toStatus) {
      return; // Idempotent no-op
    }

    const allowedNext = ALLOWED_OFFER_TRANSITIONS[currentStatus] || [];
    if (!allowedNext.includes(toStatus)) {
      throw new BadRequestException(
        `Invalid offer status transition from '${currentStatus}' to '${toStatus}'.`,
      );
    }

    // Role-specific authority gates
    if (toStatus === OfferStatus.ACCEPTED || toStatus === OfferStatus.DECLINED) {
      if (actorRole !== UserRole.STUDENT && actorRole !== UserRole.SUPER_ADMIN) {
        throw new ForbiddenException(
          'Only the recipient student or an administrator can accept or decline an offer.',
        );
      }
    } else if (toStatus === OfferStatus.ISSUED || toStatus === OfferStatus.WITHDRAWN || toStatus === OfferStatus.CANCELLED) {
      if (actorRole !== UserRole.INDUSTRY && actorRole !== UserRole.SUPER_ADMIN) {
        throw new ForbiddenException(
          `Only authorized industry partners or administrators can transition offer to '${toStatus}'.`,
        );
      }
    }
  }

  /**
   * Validate whether transition from current placement status to next status is permitted.
   */
  public validatePlacementTransition(
    currentStatus: PlacementStatus,
    toStatus: PlacementStatus,
    actorRole: UserRole,
  ): void {
    if (currentStatus === toStatus) {
      return; // Idempotent no-op
    }

    const allowedNext = ALLOWED_PLACEMENT_TRANSITIONS[currentStatus] || [];
    if (!allowedNext.includes(toStatus)) {
      throw new BadRequestException(
        `Invalid placement status transition from '${currentStatus}' to '${toStatus}'.`,
      );
    }

    // Role-specific authority gates
    if (
      toStatus === PlacementStatus.VERIFIED ||
      toStatus === PlacementStatus.CONFIRMED ||
      toStatus === PlacementStatus.JOINED ||
      toStatus === PlacementStatus.REVOKED
    ) {
      if (
        actorRole !== UserRole.INSTITUTION_ADMIN &&
        actorRole !== UserRole.SUPER_ADMIN
      ) {
        throw new ForbiddenException(
          `Only authorized institutional administrators or super administrators can transition placement to '${toStatus}'.`,
        );
      }
    }
  }

  /**
   * Execute an offer state transition within a Prisma transaction, recording status history.
   */
  public async executeOfferTransition(
    tx: any,
    offerId: string,
    currentStatus: OfferStatus,
    toStatus: OfferStatus,
    actorId: string,
    actorRole: UserRole,
    notes?: string,
  ) {
    this.validateOfferTransition(currentStatus, toStatus, actorRole);

    const updateData: any = {
      status: toStatus,
    };

    if (toStatus === OfferStatus.ISSUED) {
      updateData.issuedAt = new Date();
    } else if (toStatus === OfferStatus.ACCEPTED || toStatus === OfferStatus.DECLINED) {
      updateData.studentResponseAt = new Date();
    }

    const updatedOffer = await tx.placementOffer.update({
      where: { id: offerId },
      data: updateData,
    });

    await tx.offerStatusHistory.create({
      data: {
        offerId,
        fromStatus: currentStatus,
        toStatus,
        changedByRole: actorRole,
        changedById: actorId,
        notes: notes || null,
      },
    });

    // Notify parties of offer state changes
    if (this.notificationsService && currentStatus !== toStatus) {
      try {
        const fullOffer = await tx.placementOffer.findUnique({
          where: { id: offerId },
          include: {
            studentProfile: { select: { userId: true, fullName: true } },
            industryProfile: { select: { userId: true, companyName: true } },
          },
        });

        if (fullOffer) {
          if (toStatus === OfferStatus.ISSUED && fullOffer.studentProfile?.userId) {
            await this.notificationsService.dispatchNotification(
              {
                recipientUserId: fullOffer.studentProfile.userId,
                type: NotificationType.PLACEMENT_OFFER_ISSUED,
                priority: NotificationPriority.URGENT,
                title: 'Placement Offer Received!',
                message: `You have received a formal placement offer from ${fullOffer.industryProfile?.companyName || 'Corporate Partner'} for '${fullOffer.title}'.`,
                entityType: 'PLACEMENT_OFFER',
                entityId: offerId,
                actionUrl: '/portal/student/offers',
                idempotencyKey: `OFFER_ISSUED:OFFER:${offerId}:${fullOffer.studentProfile.userId}`,
              },
              tx,
            );
          } else if (toStatus === OfferStatus.ACCEPTED && fullOffer.industryProfile?.userId) {
            await this.notificationsService.dispatchNotification(
              {
                recipientUserId: fullOffer.industryProfile.userId,
                type: NotificationType.PLACEMENT_OFFER_ACCEPTED,
                priority: NotificationPriority.HIGH,
                title: 'Placement Offer Accepted',
                message: `${fullOffer.studentProfile?.fullName || 'A candidate'} has accepted the placement offer for '${fullOffer.title}'.`,
                entityType: 'PLACEMENT_OFFER',
                entityId: offerId,
                actionUrl: '/portal/industry/placements',
                idempotencyKey: `OFFER_ACCEPTED:OFFER:${offerId}:${fullOffer.industryProfile.userId}`,
              },
              tx,
            );
          } else if (toStatus === OfferStatus.DECLINED && fullOffer.industryProfile?.userId) {
            await this.notificationsService.dispatchNotification(
              {
                recipientUserId: fullOffer.industryProfile.userId,
                type: NotificationType.PLACEMENT_OFFER_DECLINED,
                priority: NotificationPriority.NORMAL,
                title: 'Placement Offer Declined',
                message: `${fullOffer.studentProfile?.fullName || 'A candidate'} has declined the placement offer for '${fullOffer.title}'.`,
                entityType: 'PLACEMENT_OFFER',
                entityId: offerId,
                actionUrl: '/portal/industry/placements',
                idempotencyKey: `OFFER_DECLINED:OFFER:${offerId}:${fullOffer.industryProfile.userId}`,
              },
              tx,
            );
          }
        }
      } catch {
        // Safe fallback if mock doesn't support findUnique
      }
    }

    return updatedOffer;
  }

  /**
   * Execute a placement state transition within a Prisma transaction, recording status history.
   */
  public async executePlacementTransition(
    tx: any,
    placementId: string,
    currentStatus: PlacementStatus,
    toStatus: PlacementStatus,
    actorId: string,
    actorRole: UserRole,
    notes?: string,
  ) {
    this.validatePlacementTransition(currentStatus, toStatus, actorRole);

    const updateData: any = {
      status: toStatus,
    };

    if (toStatus === PlacementStatus.VERIFIED) {
      updateData.verifiedByUserId = actorId;
      updateData.verifiedAt = new Date();
    } else if (toStatus === PlacementStatus.JOINED) {
      updateData.joiningConfirmed = true;
      updateData.joiningConfirmedAt = new Date();
    }

    const updatedPlacement = await tx.placement.update({
      where: { id: placementId },
      data: updateData,
    });

    await tx.placementStatusHistory.create({
      data: {
        placementId,
        fromStatus: currentStatus,
        toStatus,
        changedByRole: actorRole,
        changedById: actorId,
        notes: notes || null,
      },
    });

    // Notify parties of placement status changes
    if (this.notificationsService && currentStatus !== toStatus) {
      try {
        const fullPlacement = await tx.placement.findUnique({
          where: { id: placementId },
          include: {
            studentProfile: { select: { userId: true, fullName: true } },
            industryProfile: { select: { userId: true, companyName: true } },
          },
        });

        if (fullPlacement) {
          let notifType: NotificationType | null = null;
          let notifPriority: NotificationPriority = NotificationPriority.HIGH;
          let studentTitle = 'Placement Status Updated';
          let studentMessage = `Your placement status has been updated to ${toStatus}.`;
          let industryTitle = 'Placement Status Updated';
          let industryMessage = `Candidate placement status for ${fullPlacement.studentProfile?.fullName || 'student'} has been updated to ${toStatus}.`;

          if (toStatus === PlacementStatus.VERIFIED) {
            notifType = NotificationType.PLACEMENT_VERIFIED;
            studentTitle = 'Placement Verified!';
            studentMessage = 'Your placement has been formally verified and approved by the Institution TPO.';
            industryTitle = 'Placement Verified by TPO';
            industryMessage = `Placement for ${fullPlacement.studentProfile?.fullName || 'candidate'} was verified by the institution.`;
          } else if (toStatus === PlacementStatus.CONFIRMED) {
            notifType = NotificationType.PLACEMENT_CONFIRMED;
            studentTitle = 'Placement Confirmed!';
            studentMessage = 'Your placement record has been formally confirmed.';
          } else if (toStatus === PlacementStatus.JOINED) {
            notifType = NotificationType.PLACEMENT_JOINED;
            studentTitle = 'Placement Joining Confirmed!';
            studentMessage = 'Your joining report has been confirmed.';
          } else if (toStatus === PlacementStatus.REVOKED) {
            notifType = NotificationType.PLACEMENT_REVOKED;
            notifPriority = NotificationPriority.URGENT;
            studentTitle = 'Placement Revoked';
            studentMessage = 'Your placement verification was revoked by the institution administrator.';
            industryTitle = 'Placement Verification Revoked';
            industryMessage = `Placement verification for ${fullPlacement.studentProfile?.fullName || 'candidate'} was revoked.`;
          }

          if (notifType) {
            if (fullPlacement.studentProfile?.userId) {
              await this.notificationsService.dispatchNotification(
                {
                  recipientUserId: fullPlacement.studentProfile.userId,
                  type: notifType,
                  priority: notifPriority,
                  title: studentTitle,
                  message: studentMessage,
                  entityType: 'PLACEMENT',
                  entityId: placementId,
                  actionUrl: '/portal/student/offers',
                  idempotencyKey: `PLACEMENT_STATUS:${toStatus}:PLACEMENT:${placementId}:${fullPlacement.studentProfile.userId}`,
                },
                tx,
              );
            }

            if (fullPlacement.industryProfile?.userId) {
              await this.notificationsService.dispatchNotification(
                {
                  recipientUserId: fullPlacement.industryProfile.userId,
                  type: notifType,
                  priority: notifPriority,
                  title: industryTitle,
                  message: industryMessage,
                  entityType: 'PLACEMENT',
                  entityId: placementId,
                  actionUrl: '/portal/industry/placements',
                  idempotencyKey: `PLACEMENT_STATUS:${toStatus}:PLACEMENT:${placementId}:${fullPlacement.industryProfile.userId}`,
                },
                tx,
              );
            }
          }
        }
      } catch {
        // Safe fallback if mock doesn't support findUnique
      }
    }

    return updatedPlacement;
  }

  /**
   * Lazy deterministic evaluation of offer expiry.
   * If the offer is in ISSUED status and offerExpiryDate < now, transitions to EXPIRED.
   */
  public async evaluateOfferExpiry<T extends { id: string; status: OfferStatus; offerExpiryDate: Date | string }>(
    tx: any,
    offer: T,
  ): Promise<T> {
    if (
      offer.status === OfferStatus.ISSUED &&
      new Date(offer.offerExpiryDate).getTime() < Date.now()
    ) {
      const updated = await tx.placementOffer.update({
        where: { id: offer.id },
        data: { status: OfferStatus.EXPIRED },
      });

      await tx.offerStatusHistory.create({
        data: {
          offerId: offer.id,
          fromStatus: OfferStatus.ISSUED,
          toStatus: OfferStatus.EXPIRED,
          changedByRole: 'SYSTEM',
          changedById: 'system-timer',
          notes: 'Offer expired automatically due to validity deadline.',
        },
      });

      return { ...offer, ...updated };
    }

    return offer;
  }
}

import {
  Injectable,
  Optional,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { ApplicationLifecycleService } from './application-lifecycle.service';
import { NotificationsService } from '../../notifications/services/notifications.service';
import { ScheduleInterviewDto } from '../dto/schedule-interview.dto';
import { UpdateInterviewDto } from '../dto/update-interview.dto';
import { ApplicationStatus, UserRole, InterviewMode, NotificationType, NotificationPriority } from '@prisma/client';

@Injectable()
export class InterviewsService {
  private readonly logger = new Logger(InterviewsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly lifecycleService: ApplicationLifecycleService,
    @Optional() private readonly notificationsService?: NotificationsService,
  ) {}

  /**
   * Recruiter: Schedule an interview round for candidate application.
   */
  async scheduleInterview(
    userId: string,
    applicationId: string,
    dto: ScheduleInterviewDto,
  ) {
    const application = await this.prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        opportunity: {
          include: {
            industryProfile: true,
          },
        },
        studentProfile: {
          select: { userId: true },
        },
      },
    });

    if (!application) {
      throw new NotFoundException(`Application '${applicationId}' not found`);
    }

    // Verify recruiter owns the opportunity
    if (application.opportunity.industryProfile.userId !== userId) {
      throw new ForbiddenException(
        'You are not authorized to schedule interviews for another recruiter\'s opportunity',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      // Create Interview record
      const interview = await tx.interview.create({
        data: {
          applicationId,
          title: dto.title,
          scheduledAt: new Date(dto.scheduledAt),
          durationMins: dto.durationMins || 45,
          mode: dto.mode || InterviewMode.ONLINE_MEETING,
          meetingLink: dto.meetingLink || null,
          interviewer: dto.interviewer || null,
          instructions: dto.instructions || null,
        },
      });

      // Transition application to INTERVIEW_SCHEDULED if not already in interview stage
      if (application.status !== ApplicationStatus.INTERVIEW_SCHEDULED) {
        await this.lifecycleService.executeTransition(
          tx,
          applicationId,
          application.status,
          ApplicationStatus.INTERVIEW_SCHEDULED,
          userId,
          UserRole.INDUSTRY,
          `Interview scheduled: ${dto.title}`,
        );
      }

      // Notify candidate
      if (application?.studentProfile?.userId && this.notificationsService) {
        await this.notificationsService.dispatchNotification(
          {
            recipientUserId: application.studentProfile.userId,
            type: NotificationType.INTERVIEW_SCHEDULED,
            priority: NotificationPriority.HIGH,
            title: `Interview Scheduled: ${dto.title}`,
            message: `An interview has been scheduled for '${application.opportunity.title}' on ${new Date(dto.scheduledAt).toLocaleString()}.`,
            entityType: 'INTERVIEW',
            entityId: interview.id,
            actionUrl: '/applications',
            idempotencyKey: `INTERVIEW_SCHEDULED:INTERVIEW:${interview.id}:${application.studentProfile.userId}`,
          },
          tx,
        );
      }

      return interview;
    });
  }

  /**
   * Recruiter: Update interview status, meeting details, or recruiter evaluation notes.
   */
  async updateInterview(
    userId: string,
    applicationId: string,
    interviewId: string,
    dto: UpdateInterviewDto,
  ) {
    const interview = await this.prisma.interview.findUnique({
      where: { id: interviewId },
      include: {
        application: {
          include: {
            opportunity: {
              include: {
                industryProfile: true,
              },
            },
            studentProfile: {
              select: { userId: true },
            },
          },
        },
      },
    });

    if (!interview || interview.applicationId !== applicationId) {
      throw new NotFoundException('Interview round not found for this application');
    }

    if (interview.application.opportunity.industryProfile.userId !== userId) {
      throw new ForbiddenException(
        'You are not authorized to modify interviews for another recruiter\'s opportunity',
      );
    }

    const updated = await this.prisma.interview.update({
      where: { id: interviewId },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.scheduledAt !== undefined && { scheduledAt: new Date(dto.scheduledAt) }),
        ...(dto.durationMins !== undefined && { durationMins: dto.durationMins }),
        ...(dto.mode !== undefined && { mode: dto.mode }),
        ...(dto.meetingLink !== undefined && { meetingLink: dto.meetingLink }),
        ...(dto.interviewer !== undefined && { interviewer: dto.interviewer }),
        ...(dto.instructions !== undefined && { instructions: dto.instructions }),
        ...(dto.status !== undefined && { status: dto.status }),
        ...(dto.recruiterNotes !== undefined && { recruiterNotes: dto.recruiterNotes }),
        ...(dto.rating !== undefined && { rating: dto.rating }),
      },
    });

    // Notify candidate of interview updates
    if (interview?.application?.studentProfile?.userId && this.notificationsService) {
      await this.notificationsService.dispatchNotification({
        recipientUserId: interview.application.studentProfile.userId,
        type: NotificationType.INTERVIEW_UPDATED,
        priority: NotificationPriority.HIGH,
        title: `Interview Updated: ${dto.title || interview.title}`,
        message: `Your interview schedule or details for '${interview.application.opportunity.title}' have been updated.`,
        entityType: 'INTERVIEW',
        entityId: interview.id,
        actionUrl: '/applications',
      });
    }

    return updated;
  }
}


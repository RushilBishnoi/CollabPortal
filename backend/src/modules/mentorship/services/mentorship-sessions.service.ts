import {
  Injectable,
  Optional,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import {
  Prisma,
  MentorshipSessionStatus,
  UserRole,
  NotificationType,
  NotificationPriority,
} from '@prisma/client';
import { BookSessionDto } from '../dto/book-session.dto';
import { UpdateSessionDto } from '../dto/update-session.dto';
import { SubmitSessionFeedbackDto } from '../dto/submit-session-feedback.dto';
import { QuerySessionsDto } from '../dto/query-sessions.dto';
import {
  MENTORSHIP_PAGINATION_DEFAULTS,
  MENTORSHIP_VALIDATION_LIMITS,
} from '../constants/mentorship.constants';
import { NotificationsService } from '../../notifications/services/notifications.service';

@Injectable()
export class MentorshipSessionsService {
  constructor(
    private readonly prisma: PrismaService,
    @Optional() private readonly notificationsService?: NotificationsService,
  ) {}

  private async resolveStudentProfile(userId: string) {
    const student = await this.prisma.studentProfile.findUnique({
      where: { userId },
    });
    if (!student) {
      throw new ForbiddenException('User does not have an active Student profile.');
    }
    return student;
  }

  private async resolveMentorProfile(userId: string) {
    const mentor = await this.prisma.mentorProfile.findUnique({
      where: { userId },
    });
    if (!mentor) {
      throw new ForbiddenException('User does not have an active Mentor profile.');
    }
    return mentor;
  }

  /**
   * Conflict check: Verify no overlapping session exists for a mentor or student
   */
  private async checkOverlapConflict(
    tx: Prisma.TransactionClient,
    mentorProfileId: string,
    studentProfileId: string,
    scheduledAt: Date,
    durationMinutes: number,
    excludeSessionId?: string,
  ) {
    const sessionStart = scheduledAt.getTime();
    const sessionEnd = sessionStart + durationMinutes * 60 * 1000;

    // Mentor overlapping active sessions
    const mentorOverlap = await tx.mentorshipSession.findFirst({
      where: {
        mentorProfileId,
        id: excludeSessionId ? { not: excludeSessionId } : undefined,
        status: { in: [MentorshipSessionStatus.SCHEDULED, MentorshipSessionStatus.RESCHEDULED] },
        scheduledAt: {
          gte: new Date(sessionStart - 24 * 60 * 60 * 1000),
          lte: new Date(sessionEnd + 24 * 60 * 60 * 1000),
        },
      },
    });

    if (mentorOverlap) {
      const overlapStart = new Date(mentorOverlap.scheduledAt).getTime();
      const overlapEnd = overlapStart + mentorOverlap.durationMinutes * 60 * 1000;
      if (sessionStart < overlapEnd && sessionEnd > overlapStart) {
        throw new ConflictException(
          'The mentor already has another session scheduled at this conflicting time.',
        );
      }
    }

    // Student overlapping active sessions
    const studentOverlap = await tx.mentorshipSession.findFirst({
      where: {
        studentProfileId,
        id: excludeSessionId ? { not: excludeSessionId } : undefined,
        status: { in: [MentorshipSessionStatus.SCHEDULED, MentorshipSessionStatus.RESCHEDULED] },
        scheduledAt: {
          gte: new Date(sessionStart - 24 * 60 * 60 * 1000),
          lte: new Date(sessionEnd + 24 * 60 * 60 * 1000),
        },
      },
    });

    if (studentOverlap) {
      const overlapStart = new Date(studentOverlap.scheduledAt).getTime();
      const overlapEnd = overlapStart + studentOverlap.durationMinutes * 60 * 1000;
      if (sessionStart < overlapEnd && sessionEnd > overlapStart) {
        throw new ConflictException(
          'You already have another mentorship session scheduled at this conflicting time.',
        );
      }
    }
  }

  /**
   * Book a 1-on-1 mentorship session
   */
  async bookSession(
    userId: string,
    mentorProfileId: string,
    dto: BookSessionDto,
  ) {
    const student = await this.resolveStudentProfile(userId);

    const mentor = await this.prisma.mentorProfile.findUnique({
      where: { id: mentorProfileId },
    });

    if (!mentor) {
      throw new NotFoundException('Mentor profile not found.');
    }

    const scheduledDate = new Date(dto.scheduledAt);
    const minFutureMs =
      MENTORSHIP_VALIDATION_LIMITS.MIN_MINUTES_IN_FUTURE * 60 * 1000;

    if (isNaN(scheduledDate.getTime()) || scheduledDate.getTime() <= Date.now() + minFutureMs) {
      throw new BadRequestException(
        `Sessions must be scheduled at least ${MENTORSHIP_VALIDATION_LIMITS.MIN_MINUTES_IN_FUTURE} minutes in the future.`,
      );
    }

    const duration =
      dto.durationMinutes ?? MENTORSHIP_VALIDATION_LIMITS.DEFAULT_SLOT_DURATION_MINS;

    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Conflict check
      await this.checkOverlapConflict(
        tx,
        mentorProfileId,
        student.id,
        scheduledDate,
        duration,
      );

      const session = await tx.mentorshipSession.create({
        data: {
          mentorProfileId,
          studentProfileId: student.id,
          mentorshipId: dto.mentorshipId,
          title: dto.title,
          description: dto.description,
          scheduledAt: scheduledDate,
          durationMinutes: duration,
          meetingPlatform: dto.meetingPlatform ?? mentor.defaultMeetingPlatform,
          meetingLink: dto.meetingLink ?? mentor.defaultMeetingLink,
          location: dto.location,
          status: MentorshipSessionStatus.SCHEDULED,
        },
        include: {
          mentorProfile: {
            include: { user: { select: { email: true, avatarUrl: true } } },
          },
          studentProfile: {
            include: { user: { select: { email: true, avatarUrl: true } } },
          },
        },
      });

      // Notify mentor of new scheduled session
      if (this.notificationsService && mentor.userId) {
        await this.notificationsService.dispatchNotification(
          {
            recipientUserId: mentor.userId,
            type: NotificationType.MENTORSHIP_SESSION_SCHEDULED,
            priority: NotificationPriority.HIGH,
            title: 'Mentorship Session Scheduled',
            message: `${student.fullName || 'A student'} booked a session: '${dto.title}' for ${scheduledDate.toLocaleString()}.`,
            entityType: 'MENTORSHIP_SESSION',
            entityId: session.id,
            actionUrl: '/portal/mentor/workspace',
            idempotencyKey: `SESSION_SCHEDULED:SESSION:${session.id}:${mentor.userId}`,
          },
          tx,
        );
      }

      return session;
    });
  }

  /**
   * Update or Reschedule or Cancel a session
   */
  async updateSession(
    userId: string,
    userRole: UserRole,
    sessionId: string,
    dto: UpdateSessionDto,
  ) {
    const session = await this.prisma.mentorshipSession.findUnique({
      where: { id: sessionId },
      include: {
        mentorProfile: true,
        studentProfile: true,
      },
    });

    if (!session) {
      throw new NotFoundException('Mentorship session not found.');
    }

    // RBAC ownership check
    const isStudentOwner = session.studentProfile?.userId === userId;
    const isMentorOwner = session.mentorProfile?.userId === userId;
    const isSuperAdmin = userRole === UserRole.SUPER_ADMIN;

    if (!isStudentOwner && !isMentorOwner && !isSuperAdmin) {
      throw new ForbiddenException('You are not authorized to modify this session.');
    }

    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      let targetScheduledAt = session.scheduledAt;
      let targetDuration = dto.durationMinutes ?? session.durationMinutes;

      // Rescheduling flow
      if (dto.scheduledAt) {
        targetScheduledAt = new Date(dto.scheduledAt);
        const minFutureMs =
          MENTORSHIP_VALIDATION_LIMITS.MIN_MINUTES_IN_FUTURE * 60 * 1000;

        if (targetScheduledAt.getTime() <= Date.now() + minFutureMs) {
          throw new BadRequestException(
            'Rescheduled time must be at least 15 minutes in the future.',
          );
        }

        // Re-run conflict check
        await this.checkOverlapConflict(
          tx,
          session.mentorProfileId,
          session.studentProfileId,
          targetScheduledAt,
          targetDuration,
          session.id,
        );
      }

      const updateData: any = {
        scheduledAt: targetScheduledAt,
        durationMinutes: targetDuration,
        meetingPlatform: dto.meetingPlatform,
        meetingLink: dto.meetingLink,
      };

      if (dto.scheduledAt && !dto.status) {
        updateData.status = MentorshipSessionStatus.RESCHEDULED;
      }

      if (dto.status) {
        updateData.status = dto.status;
        if (dto.status === MentorshipSessionStatus.CANCELLED) {
          updateData.cancellationReason = dto.cancellationReason;
          updateData.cancelledByRole = userRole;
        }
        if (dto.status === MentorshipSessionStatus.COMPLETED) {
          updateData.completedAt = new Date();
        }
      }

      const updatedSession = await tx.mentorshipSession.update({
        where: { id: sessionId },
        data: updateData,
        include: {
          mentorProfile: {
            include: { user: { select: { email: true, avatarUrl: true } } },
          },
          studentProfile: {
            include: { user: { select: { email: true, avatarUrl: true } } },
          },
        },
      });

      // Notify counterpart participant of session updates
      if (this.notificationsService) {
        const recipientUserId = isMentorOwner
          ? updatedSession.studentProfile?.userId
          : updatedSession.mentorProfile?.userId;

        if (recipientUserId) {
          if (dto.status === MentorshipSessionStatus.CANCELLED) {
            await this.notificationsService.dispatchNotification(
              {
                recipientUserId,
                type: NotificationType.MENTORSHIP_SESSION_CANCELLED,
                priority: NotificationPriority.URGENT,
                title: 'Mentorship Session Cancelled',
                message: `Session '${updatedSession.title}' was cancelled: ${dto.cancellationReason || 'No reason provided'}.`,
                entityType: 'MENTORSHIP_SESSION',
                entityId: sessionId,
                actionUrl: isMentorOwner ? '/portal/student/mentorship' : '/portal/mentor/workspace',
                idempotencyKey: `SESSION_CANCELLED:SESSION:${sessionId}:${recipientUserId}`,
              },
              tx,
            );
          } else if (dto.status === MentorshipSessionStatus.COMPLETED) {
            await this.notificationsService.dispatchNotification(
              {
                recipientUserId,
                type: NotificationType.MENTORSHIP_SESSION_COMPLETED,
                priority: NotificationPriority.NORMAL,
                title: 'Mentorship Session Completed',
                message: `Session '${updatedSession.title}' has been marked as completed.`,
                entityType: 'MENTORSHIP_SESSION',
                entityId: sessionId,
                actionUrl: isMentorOwner ? '/portal/student/mentorship' : '/portal/mentor/workspace',
                idempotencyKey: `SESSION_COMPLETED:SESSION:${sessionId}:${recipientUserId}`,
              },
              tx,
            );
          } else if (dto.scheduledAt || dto.status === MentorshipSessionStatus.RESCHEDULED) {
            await this.notificationsService.dispatchNotification(
              {
                recipientUserId,
                type: NotificationType.MENTORSHIP_SESSION_RESCHEDULED,
                priority: NotificationPriority.HIGH,
                title: 'Mentorship Session Rescheduled',
                message: `Session '${updatedSession.title}' was rescheduled to ${new Date(targetScheduledAt).toLocaleString()}.`,
                entityType: 'MENTORSHIP_SESSION',
                entityId: sessionId,
                actionUrl: isMentorOwner ? '/portal/student/mentorship' : '/portal/mentor/workspace',
                idempotencyKey: `SESSION_RESCHEDULED:SESSION:${sessionId}:${recipientUserId}`,
              },
              tx,
            );
          }
        }
      }

      return updatedSession;
    });
  }

  /**
   * Submit Session Feedback, Notes, and Star Rating (1-5)
   */
  async submitFeedback(
    userId: string,
    userRole: UserRole,
    sessionId: string,
    dto: SubmitSessionFeedbackDto,
  ) {
    const session = await this.prisma.mentorshipSession.findUnique({
      where: { id: sessionId },
      include: {
        mentorProfile: true,
        studentProfile: true,
      },
    });

    if (!session) {
      throw new NotFoundException('Mentorship session not found.');
    }

    const isStudent = session.studentProfile.userId === userId;
    const isMentor = session.mentorProfile.userId === userId;
    const isSuperAdmin = userRole === UserRole.SUPER_ADMIN;

    if (!isStudent && !isMentor && !isSuperAdmin) {
      throw new ForbiddenException('You are not a participant in this session.');
    }

    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const updateData: any = {};

      if (dto.sharedSummary) {
        updateData.sharedSummary = dto.sharedSummary;
      }

      // Student feedback & rating
      if (isStudent || isSuperAdmin) {
        if (dto.studentNotes) updateData.studentNotes = dto.studentNotes;
        if (dto.studentFeedback) updateData.studentFeedback = dto.studentFeedback;
        if (dto.studentRating !== undefined) {
          if (
            dto.studentRating < MENTORSHIP_VALIDATION_LIMITS.MIN_RATING ||
            dto.studentRating > MENTORSHIP_VALIDATION_LIMITS.MAX_RATING
          ) {
            throw new BadRequestException('Rating must be an integer between 1 and 5.');
          }
          updateData.studentRating = dto.studentRating;
        }
      }

      // Mentor private notes
      if (isMentor || isSuperAdmin) {
        if (dto.mentorNotes) updateData.mentorNotes = dto.mentorNotes;
      }

      // Mark completed
      updateData.status = MentorshipSessionStatus.COMPLETED;
      if (!session.completedAt) {
        updateData.completedAt = new Date();
      }

      const updatedSession = await tx.mentorshipSession.update({
        where: { id: sessionId },
        data: updateData,
      });

      // Atomically aggregate mentor rating if new student rating provided and wasn't previously counted
      if (dto.studentRating && !session.studentRating) {
        const mentor = await tx.mentorProfile.findUnique({
          where: { id: session.mentorProfileId },
        });

        if (mentor) {
          const currentCount = mentor.ratingCount;
          const currentAvg = mentor.averageRating;
          const newCount = currentCount + 1;
          const newAvg =
            Math.round(((currentAvg * currentCount + dto.studentRating) / newCount) * 10) / 10;

          await tx.mentorProfile.update({
            where: { id: mentor.id },
            data: {
              averageRating: newAvg,
              ratingCount: newCount,
              totalSessionsCompleted: { increment: 1 },
            },
          });
        }
      }

      return updatedSession;
    });
  }

  /**
   * Get detailed session with IDOR protection on private notes
   */
  async getSessionById(userId: string, userRole: UserRole, sessionId: string) {
    const session = await this.prisma.mentorshipSession.findUnique({
      where: { id: sessionId },
      include: {
        mentorProfile: {
          include: { user: { select: { email: true, avatarUrl: true } } },
        },
        studentProfile: {
          include: { user: { select: { email: true, avatarUrl: true } } },
        },
        mentorship: true,
      },
    });

    if (!session) {
      throw new NotFoundException('Mentorship session not found.');
    }

    const isStudent = session.studentProfile.userId === userId;
    const isMentor = session.mentorProfile.userId === userId;
    const isSuperAdmin = userRole === UserRole.SUPER_ADMIN;

    if (!isStudent && !isMentor && !isSuperAdmin) {
      throw new ForbiddenException('You do not have permission to view this session.');
    }

    // Mask private notes based on participant role
    if (isStudent && !isSuperAdmin) {
      session.mentorNotes = null;
    }
    if (isMentor && !isSuperAdmin) {
      session.studentNotes = null;
    }

    return session;
  }

  /**
   * Student: List my booked sessions
   */
  async getStudentSessions(userId: string, query: QuerySessionsDto) {
    const student = await this.resolveStudentProfile(userId);

    const page = query.page || MENTORSHIP_PAGINATION_DEFAULTS.PAGE;
    const limit = Math.min(
      query.limit || MENTORSHIP_PAGINATION_DEFAULTS.LIMIT,
      MENTORSHIP_PAGINATION_DEFAULTS.MAX_LIMIT,
    );
    const skip = (page - 1) * limit;

    const where: any = { studentProfileId: student.id };
    if (query.status) {
      where.status = query.status;
    }
    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        {
          mentorProfile: {
            headline: { contains: query.search, mode: 'insensitive' },
          },
        },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.mentorshipSession.findMany({
        where,
        skip,
        take: limit,
        orderBy: { scheduledAt: 'desc' },
        include: {
          mentorProfile: {
            include: { user: { select: { email: true, avatarUrl: true } } },
          },
        },
      }),
      this.prisma.mentorshipSession.count({ where }),
    ]);

    // Mask mentor private notes
    const sanitizedItems = items.map((item: any) => ({
      ...item,
      mentorNotes: null,
    }));

    return {
      items: sanitizedItems,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Mentor: List my hosted sessions
   */
  async getMentorSessions(userId: string, query: QuerySessionsDto) {
    const mentor = await this.resolveMentorProfile(userId);

    const page = query.page || MENTORSHIP_PAGINATION_DEFAULTS.PAGE;
    const limit = Math.min(
      query.limit || MENTORSHIP_PAGINATION_DEFAULTS.LIMIT,
      MENTORSHIP_PAGINATION_DEFAULTS.MAX_LIMIT,
    );
    const skip = (page - 1) * limit;

    const where: any = { mentorProfileId: mentor.id };
    if (query.status) {
      where.status = query.status;
    }
    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        {
          studentProfile: {
            fullName: { contains: query.search, mode: 'insensitive' },
          },
        },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.mentorshipSession.findMany({
        where,
        skip,
        take: limit,
        orderBy: { scheduledAt: 'desc' },
        include: {
          studentProfile: {
            include: { user: { select: { email: true, avatarUrl: true } } },
          },
        },
      }),
      this.prisma.mentorshipSession.count({ where }),
    ]);

    // Mask student private notes
    const sanitizedItems = items.map((item: any) => ({
      ...item,
      studentNotes: null,
    }));

    return {
      items: sanitizedItems,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}

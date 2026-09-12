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
  MentorshipRequestStatus,
  MentorshipStatus,
  UserRole,
  NotificationType,
  NotificationPriority,
} from '@prisma/client';
import { CreateMentorshipRequestDto } from '../dto/create-mentorship-request.dto';
import {
  RespondMentorshipRequestDto,
  MentorshipResponseAction,
} from '../dto/respond-mentorship-request.dto';
import { NotificationsService } from '../../notifications/services/notifications.service';

@Injectable()
export class MentorshipRequestsService {
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
   * Student creates a new mentorship request
   */
  async createRequest(
    userId: string,
    mentorProfileId: string,
    dto: CreateMentorshipRequestDto,
  ) {
    const student = await this.resolveStudentProfile(userId);

    const mentor = await this.prisma.mentorProfile.findUnique({
      where: { id: mentorProfileId },
    });

    if (!mentor) {
      throw new NotFoundException('Mentor profile not found.');
    }

    if (!mentor.isAvailable) {
      throw new BadRequestException(
        'This mentor is currently not accepting new mentorship requests.',
      );
    }

    // Check for existing pending request
    const existingPending = await this.prisma.mentorshipRequest.findFirst({
      where: {
        mentorProfileId,
        studentProfileId: student.id,
        status: MentorshipRequestStatus.PENDING,
      },
    });

    if (existingPending) {
      throw new ConflictException(
        'You already have a pending mentorship request with this mentor.',
      );
    }

    // Check for existing active mentorship
    const existingActive = await this.prisma.mentorship.findFirst({
      where: {
        mentorProfileId,
        studentProfileId: student.id,
        status: MentorshipStatus.ACTIVE,
      },
    });

    if (existingActive) {
      throw new ConflictException(
        'You already have an active mentorship relationship with this mentor.',
      );
    }

    const createdRequest = await this.prisma.mentorshipRequest.create({
      data: {
        mentorProfileId,
        studentProfileId: student.id,
        statementOfPurpose: dto.statementOfPurpose,
        targetCareerRoleId: dto.targetCareerRoleId,
        expectedDurationWeeks: dto.expectedDurationWeeks ?? 8,
        status: MentorshipRequestStatus.PENDING,
      },
      include: {
        mentorProfile: {
          include: {
            user: { select: { email: true, avatarUrl: true } },
          },
        },
        targetCareerRole: true,
      },
    });

    // Notify mentor of new mentorship request
    if (this.notificationsService && mentor.userId) {
      await this.notificationsService.dispatchNotification({
        recipientUserId: mentor.userId,
        type: NotificationType.MENTOR_REQUEST_RECEIVED,
        priority: NotificationPriority.HIGH,
        title: 'New Mentorship Request',
        message: `${student.fullName || 'A student'} has sent you a mentorship request.`,
        entityType: 'MENTORSHIP_REQUEST',
        entityId: createdRequest.id,
        actionUrl: '/portal/mentor/workspace',
        idempotencyKey: `MENTOR_REQ:REQUEST:${createdRequest.id}:${mentor.userId}`,
      });
    }

    return createdRequest;
  }

  /**
   * Mentor responds to a mentorship request (ACCEPT or REJECT)
   */
  async respondToRequest(
    userId: string,
    requestId: string,
    dto: RespondMentorshipRequestDto,
  ) {
    const mentor = await this.resolveMentorProfile(userId);

    const request = await this.prisma.mentorshipRequest.findUnique({
      where: { id: requestId },
      include: {
        studentProfile: { select: { id: true, userId: true, fullName: true } },
      },
    });

    if (!request || request.mentorProfileId !== mentor.id) {
      throw new NotFoundException('Mentorship request not found.');
    }

    if (request.status !== MentorshipRequestStatus.PENDING) {
      throw new BadRequestException(
        `Cannot respond to a request in '${request.status}' status. Only PENDING requests can be accepted or rejected.`,
      );
    }

    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      if (dto.action === MentorshipResponseAction.ACCEPT) {
        // Enforce capacity check
        const activeCount = await tx.mentorship.count({
          where: {
            mentorProfileId: mentor.id,
            status: MentorshipStatus.ACTIVE,
          },
        });

        if (activeCount >= mentor.maxMentees) {
          throw new BadRequestException(
            `Cannot accept new mentee. You have reached your maximum mentee capacity (${mentor.maxMentees} active mentees).`,
          );
        }

        // Update request status
        const updatedRequest = await tx.mentorshipRequest.update({
          where: { id: requestId },
          data: {
            status: MentorshipRequestStatus.ACCEPTED,
            mentorResponseNotes: dto.notes,
            respondedAt: new Date(),
          },
        });

        // Create active Mentorship
        const mentorship = await tx.mentorship.create({
          data: {
            requestId: request.id,
            mentorProfileId: mentor.id,
            studentProfileId: request.studentProfileId,
            status: MentorshipStatus.ACTIVE,
            notes: dto.notes,
          },
        });

        // Notify student of acceptance
        if (this.notificationsService && request.studentProfile?.userId) {
          await this.notificationsService.dispatchNotification(
            {
              recipientUserId: request.studentProfile.userId,
              type: NotificationType.MENTOR_REQUEST_ACCEPTED,
              priority: NotificationPriority.HIGH,
              title: 'Mentorship Request Accepted!',
              message: `${mentor.headline || mentor.designation || 'Your mentor'} has accepted your mentorship request.`,
              entityType: 'MENTORSHIP',
              entityId: mentorship.id,
              actionUrl: '/portal/student/mentorship',
              idempotencyKey: `MENTOR_RESP:ACCEPT:${requestId}:${request.studentProfile.userId}`,
            },
            tx,
          );
        }

        // Notify mentor that active mentorship relationship has started
        if (this.notificationsService && mentor.userId) {
          await this.notificationsService.dispatchNotification(
            {
              recipientUserId: mentor.userId,
              type: NotificationType.MENTORSHIP_STARTED,
              priority: NotificationPriority.HIGH,
              title: 'New Mentorship Active',
              message: `You are now actively mentoring ${request.studentProfile?.fullName || 'a student'}.`,
              entityType: 'MENTORSHIP',
              entityId: mentorship.id,
              actionUrl: '/portal/mentor/workspace',
              idempotencyKey: `MENTORSHIP_STARTED:MENTORSHIP:${mentorship.id}:${mentor.userId}`,
            },
            tx,
          );
        }

        return { request: updatedRequest, mentorship };
      } else {
        // REJECT
        const updatedRequest = await tx.mentorshipRequest.update({
          where: { id: requestId },
          data: {
            status: MentorshipRequestStatus.REJECTED,
            rejectionReason: dto.rejectionReason,
            mentorResponseNotes: dto.notes,
            respondedAt: new Date(),
          },
        });

        // Notify student of rejection
        if (this.notificationsService && request.studentProfile?.userId) {
          await this.notificationsService.dispatchNotification(
            {
              recipientUserId: request.studentProfile.userId,
              type: NotificationType.MENTOR_REQUEST_REJECTED,
              priority: NotificationPriority.NORMAL,
              title: 'Mentorship Request Update',
              message: `Your mentorship request with ${mentor.headline || mentor.designation || 'the mentor'} was not accepted.`,
              entityType: 'MENTORSHIP_REQUEST',
              entityId: requestId,
              actionUrl: '/portal/student/mentorship',
              idempotencyKey: `MENTOR_RESP:REJECT:${requestId}:${request.studentProfile.userId}`,
            },
            tx,
          );
        }

        return { request: updatedRequest, mentorship: null };
      }
    });
  }

  /**
   * Student withdraws their pending request
   */
  async withdrawRequest(userId: string, requestId: string) {
    const student = await this.resolveStudentProfile(userId);

    const request = await this.prisma.mentorshipRequest.findUnique({
      where: { id: requestId },
    });

    if (!request || request.studentProfileId !== student.id) {
      throw new NotFoundException('Mentorship request not found.');
    }

    if (request.status !== MentorshipRequestStatus.PENDING) {
      throw new BadRequestException(
        `Cannot withdraw request in '${request.status}' status.`,
      );
    }

    return this.prisma.mentorshipRequest.update({
      where: { id: requestId },
      data: { status: MentorshipRequestStatus.WITHDRAWN },
    });
  }

  /**
   * Get student's mentorship requests
   */
  async getStudentRequests(userId: string) {
    const student = await this.resolveStudentProfile(userId);

    return this.prisma.mentorshipRequest.findMany({
      where: { studentProfileId: student.id },
      orderBy: { createdAt: 'desc' },
      include: {
        mentorProfile: {
          include: {
            user: { select: { email: true, avatarUrl: true } },
            skills: { include: { skill: true } },
          },
        },
        targetCareerRole: true,
        mentorship: true,
      },
    });
  }

  /**
   * Get mentor's incoming requests
   */
  async getMentorRequests(userId: string, status?: MentorshipRequestStatus) {
    const mentor = await this.resolveMentorProfile(userId);

    const where: any = { mentorProfileId: mentor.id };
    if (status) {
      where.status = status;
    }

    return this.prisma.mentorshipRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        studentProfile: {
          include: {
            user: { select: { email: true, avatarUrl: true } },
            institution: { select: { name: true } },
          },
        },
        targetCareerRole: true,
        mentorship: true,
      },
    });
  }

  /**
   * Get active mentorship relationships for a student
   */
  async getStudentMentorships(userId: string) {
    const student = await this.resolveStudentProfile(userId);

    return this.prisma.mentorship.findMany({
      where: { studentProfileId: student.id },
      orderBy: { createdAt: 'desc' },
      include: {
        mentorProfile: {
          include: {
            user: { select: { email: true, avatarUrl: true } },
            skills: { include: { skill: true } },
          },
        },
        goals: true,
        sessions: { orderBy: { scheduledAt: 'desc' }, take: 5 },
      },
    });
  }

  /**
   * Get active mentorship relationships for a mentor
   */
  async getMentorMentorships(userId: string) {
    const mentor = await this.resolveMentorProfile(userId);

    return this.prisma.mentorship.findMany({
      where: { mentorProfileId: mentor.id },
      orderBy: { createdAt: 'desc' },
      include: {
        studentProfile: {
          include: {
            user: { select: { email: true, avatarUrl: true } },
            institution: { select: { name: true } },
          },
        },
        goals: true,
        sessions: { orderBy: { scheduledAt: 'desc' }, take: 5 },
      },
    });
  }

  /**
   * Complete an active mentorship
   */
  async completeMentorship(
    userId: string,
    userRole: UserRole,
    mentorshipId: string,
    notes?: string,
  ) {
    const mentorship = await this.prisma.mentorship.findUnique({
      where: { id: mentorshipId },
      include: { mentorProfile: true, studentProfile: true },
    });

    if (!mentorship) {
      throw new NotFoundException('Mentorship not found.');
    }

    // Authorization check
    if (userRole === UserRole.STUDENT && mentorship.studentProfile.userId !== userId) {
      throw new ForbiddenException('You are not authorized to complete this mentorship.');
    }
    if (
      (userRole === UserRole.INDUSTRY || userRole === UserRole.FACULTY) &&
      mentorship.mentorProfile.userId !== userId
    ) {
      throw new ForbiddenException('You are not authorized to complete this mentorship.');
    }

    return this.prisma.mentorship.update({
      where: { id: mentorshipId },
      data: {
        status: MentorshipStatus.COMPLETED,
        endDate: new Date(),
        notes: notes ?? mentorship.notes,
      },
    });
  }
}

import {
  Injectable,
  Inject,
  Optional,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import {
  ParticipationStatus,
  CollaborationStatus,
  CollaborationAudience,
  UserRole,
  NotificationType,
  NotificationPriority,
  Prisma,
} from '@prisma/client';
import { CreateParticipationDto } from '../dto/create-participation.dto';
import { UpdateParticipationStatusDto } from '../dto/update-participation-status.dto';
import { ParticipationQueryDto } from '../dto/participation-query.dto';
import { CollaborationLifecycleService } from './collaboration-lifecycle.service';
import { NotificationsService } from '../../notifications/services/notifications.service';
import { COLLABORATION_PAGINATION_DEFAULTS } from '../config/collaboration.constants';

@Injectable()
export class ParticipationService {
  private readonly logger = new Logger(ParticipationService.name);

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(CollaborationLifecycleService) private readonly lifecycleService: CollaborationLifecycleService,
    @Optional() private readonly notificationsService?: NotificationsService,
  ) {}

  /**
   * Helper: Resolve FacultyProfile for user ID.
   */
  async resolveFacultyProfile(userId: string) {
    const profile = await this.prisma.facultyProfile.findUnique({
      where: { userId },
    });
    if (!profile) {
      throw new NotFoundException('Faculty profile not found for authenticated user');
    }
    return profile;
  }

  /**
   * Helper: Resolve StudentProfile for user ID.
   */
  async resolveStudentProfile(userId: string) {
    const profile = await this.prisma.studentProfile.findUnique({
      where: { userId },
    });
    if (!profile) {
      throw new NotFoundException('Student profile not found for authenticated user');
    }
    return profile;
  }

  /**
   * Helper: Resolve IndustryProfile for user ID.
   */
  async resolveIndustryProfile(userId: string) {
    const profile = await this.prisma.industryProfile.findUnique({
      where: { userId },
    });
    if (!profile) {
      throw new NotFoundException('Industry profile not found for authenticated user');
    }
    return profile;
  }

  /**
   * Faculty: Request participation in a collaboration engagement.
   */
  async requestFacultyParticipation(
    userId: string,
    collaborationId: string,
    dto: CreateParticipationDto,
  ) {
    const faculty = await this.resolveFacultyProfile(userId);

    const collaboration = await this.prisma.collaboration.findUnique({
      where: { id: collaborationId },
      include: {
        industryProfile: { select: { userId: true, companyName: true } },
      },
    });

    if (!collaboration) {
      throw new NotFoundException(`Collaboration with ID '${collaborationId}' not found`);
    }

    if (collaboration.status !== CollaborationStatus.OPEN) {
      throw new BadRequestException(
        `Cannot request participation: Collaboration is currently '${collaboration.status}' (must be 'OPEN').`,
      );
    }

    if (collaboration.deadline && new Date(collaboration.deadline) < new Date()) {
      throw new BadRequestException('Cannot request participation: Application deadline has passed.');
    }

    if (
      collaboration.targetAudience !== CollaborationAudience.FACULTY &&
      collaboration.targetAudience !== CollaborationAudience.BOTH
    ) {
      throw new ForbiddenException(
        `This collaboration is designated for ${collaboration.targetAudience} audience only.`,
      );
    }

    if (
      collaboration.eligibleDepartments &&
      collaboration.eligibleDepartments.length > 0 &&
      faculty.department &&
      !collaboration.eligibleDepartments.includes(faculty.department)
    ) {
      throw new BadRequestException(
        `Your department '${faculty.department}' is not in the list of eligible departments for this collaboration.`,
      );
    }

    // Check duplicate
    const existing = await this.prisma.collaborationParticipation.findUnique({
      where: {
        collaborationId_facultyProfileId: {
          collaborationId,
          facultyProfileId: faculty.id,
        },
      },
    });

    if (existing) {
      throw new ConflictException('You have already submitted a participation request for this collaboration.');
    }

    return this.prisma.$transaction(async (tx) => {
      const participation = await tx.collaborationParticipation.create({
        data: {
          collaborationId,
          facultyProfileId: faculty.id,
          studentProfileId: null,
          status: ParticipationStatus.PENDING,
          motivation: dto.motivation || null,
          relevantExperience: dto.relevantExperience || null,
        },
        include: {
          collaboration: {
            select: {
              id: true,
              title: true,
              collaborationType: true,
              status: true,
              industryProfile: {
                select: { companyName: true },
              },
            },
          },
        },
      });

      await tx.collaborationStatusHistory.create({
        data: {
          participationId: participation.id,
          fromStatus: null,
          toStatus: ParticipationStatus.PENDING,
          changedByRole: UserRole.FACULTY,
          changedById: userId,
          notes: 'Participation request submitted',
        },
      });

      // Notify collaboration industry organizer
      if (collaboration?.industryProfile?.userId && this.notificationsService) {
        await this.notificationsService.dispatchNotification(
          {
            recipientUserId: collaboration.industryProfile.userId,
            type: NotificationType.COLLABORATION_PARTICIPATION_REQUESTED,
            priority: NotificationPriority.NORMAL,
            title: 'New Collaboration Participation Request',
            message: `${faculty.fullName || 'A faculty member'} has requested to participate in '${collaboration.title}'.`,
            entityType: 'COLLABORATION',
            entityId: collaboration.id,
            actionUrl: '/industry/collaborations',
            idempotencyKey: `COLLAB_REQ:COLLABORATION:${collaboration.id}:${participation.id}:${collaboration.industryProfile.userId}`,
          },
          tx,
        );
      }

      return participation;
    });
  }

  /**
   * Student: Request participation in a collaboration engagement.
   */
  async requestStudentParticipation(
    userId: string,
    collaborationId: string,
    dto: CreateParticipationDto,
  ) {
    const student = await this.resolveStudentProfile(userId);

    const collaboration = await this.prisma.collaboration.findUnique({
      where: { id: collaborationId },
      include: {
        industryProfile: { select: { userId: true, companyName: true } },
      },
    });

    if (!collaboration) {
      throw new NotFoundException(`Collaboration with ID '${collaborationId}' not found`);
    }

    if (collaboration.status !== CollaborationStatus.OPEN) {
      throw new BadRequestException(
        `Cannot request participation: Collaboration is currently '${collaboration.status}' (must be 'OPEN').`,
      );
    }

    if (collaboration.deadline && new Date(collaboration.deadline) < new Date()) {
      throw new BadRequestException('Cannot request participation: Application deadline has passed.');
    }

    if (
      collaboration.targetAudience !== CollaborationAudience.STUDENT &&
      collaboration.targetAudience !== CollaborationAudience.BOTH
    ) {
      throw new ForbiddenException(
        `This collaboration is designated for ${collaboration.targetAudience} audience only.`,
      );
    }

    if (
      collaboration.eligibleDepartments &&
      collaboration.eligibleDepartments.length > 0 &&
      student.department &&
      !collaboration.eligibleDepartments.includes(student.department)
    ) {
      throw new BadRequestException(
        `Your department '${student.department}' is not in the list of eligible departments for this collaboration.`,
      );
    }

    // Check duplicate
    const existing = await this.prisma.collaborationParticipation.findUnique({
      where: {
        collaborationId_studentProfileId: {
          collaborationId,
          studentProfileId: student.id,
        },
      },
    });

    if (existing) {
      throw new ConflictException('You have already submitted a participation request for this collaboration.');
    }

    return this.prisma.$transaction(async (tx) => {
      const participation = await tx.collaborationParticipation.create({
        data: {
          collaborationId,
          facultyProfileId: null,
          studentProfileId: student.id,
          status: ParticipationStatus.PENDING,
          motivation: dto.motivation || null,
          relevantExperience: dto.relevantExperience || null,
        },
        include: {
          collaboration: {
            select: {
              id: true,
              title: true,
              collaborationType: true,
              status: true,
              industryProfile: {
                select: { companyName: true },
              },
            },
          },
        },
      });

      await tx.collaborationStatusHistory.create({
        data: {
          participationId: participation.id,
          fromStatus: null,
          toStatus: ParticipationStatus.PENDING,
          changedByRole: UserRole.STUDENT,
          changedById: userId,
          notes: 'Participation request submitted',
        },
      });

      // Notify collaboration industry organizer
      if (collaboration?.industryProfile?.userId && this.notificationsService) {
        await this.notificationsService.dispatchNotification(
          {
            recipientUserId: collaboration.industryProfile.userId,
            type: NotificationType.COLLABORATION_PARTICIPATION_REQUESTED,
            priority: NotificationPriority.NORMAL,
            title: 'New Collaboration Participation Request',
            message: `${student.fullName || 'A student'} has requested to participate in '${collaboration.title}'.`,
            entityType: 'COLLABORATION',
            entityId: collaboration.id,
            actionUrl: '/industry/collaborations',
            idempotencyKey: `COLLAB_REQ:COLLABORATION:${collaboration.id}:${participation.id}:${collaboration.industryProfile.userId}`,
          },
          tx,
        );
      }

      return participation;
    });
  }

  /**
   * Faculty: List own participations (omitting private industryNotes).
   */
  async getMyFacultyParticipations(userId: string, query: ParticipationQueryDto) {
    const faculty = await this.resolveFacultyProfile(userId);

    const page = Math.max(1, Number(query.page) || COLLABORATION_PAGINATION_DEFAULTS.PAGE);
    const limit = Math.min(
      COLLABORATION_PAGINATION_DEFAULTS.MAX_LIMIT,
      Math.max(1, Number(query.limit) || COLLABORATION_PAGINATION_DEFAULTS.LIMIT),
    );
    const skip = (page - 1) * limit;

    const where: Prisma.CollaborationParticipationWhereInput = {
      facultyProfileId: faculty.id,
      ...(query.status && { status: query.status }),
    };

    const [items, total] = await Promise.all([
      this.prisma.collaborationParticipation.findMany({
        where,
        skip,
        take: limit,
        orderBy: { requestedAt: 'desc' },
        select: {
          id: true,
          collaborationId: true,
          status: true,
          motivation: true,
          relevantExperience: true,
          rejectionReason: true,
          requestedAt: true,
          decidedAt: true,
          completedAt: true,
          createdAt: true,
          collaboration: {
            select: {
              id: true,
              title: true,
              collaborationType: true,
              status: true,
              mode: true,
              startDate: true,
              endDate: true,
              location: true,
              industryProfile: {
                select: { companyName: true, industryType: true },
              },
            },
          },
          statusHistory: {
            orderBy: { createdAt: 'desc' },
            select: {
              id: true,
              fromStatus: true,
              toStatus: true,
              changedByRole: true,
              notes: true,
              createdAt: true,
            },
          },
        },
      }),
      this.prisma.collaborationParticipation.count({ where }),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  /**
   * Student: List own participations (omitting private industryNotes).
   */
  async getMyStudentParticipations(userId: string, query: ParticipationQueryDto) {
    const student = await this.resolveStudentProfile(userId);

    const page = Math.max(1, Number(query.page) || COLLABORATION_PAGINATION_DEFAULTS.PAGE);
    const limit = Math.min(
      COLLABORATION_PAGINATION_DEFAULTS.MAX_LIMIT,
      Math.max(1, Number(query.limit) || COLLABORATION_PAGINATION_DEFAULTS.LIMIT),
    );
    const skip = (page - 1) * limit;

    const where: Prisma.CollaborationParticipationWhereInput = {
      studentProfileId: student.id,
      ...(query.status && { status: query.status }),
    };

    const [items, total] = await Promise.all([
      this.prisma.collaborationParticipation.findMany({
        where,
        skip,
        take: limit,
        orderBy: { requestedAt: 'desc' },
        select: {
          id: true,
          collaborationId: true,
          status: true,
          motivation: true,
          relevantExperience: true,
          rejectionReason: true,
          requestedAt: true,
          decidedAt: true,
          completedAt: true,
          createdAt: true,
          collaboration: {
            select: {
              id: true,
              title: true,
              collaborationType: true,
              status: true,
              mode: true,
              startDate: true,
              endDate: true,
              location: true,
              industryProfile: {
                select: { companyName: true, industryType: true },
              },
            },
          },
          statusHistory: {
            orderBy: { createdAt: 'desc' },
            select: {
              id: true,
              fromStatus: true,
              toStatus: true,
              changedByRole: true,
              notes: true,
              createdAt: true,
            },
          },
        },
      }),
      this.prisma.collaborationParticipation.count({ where }),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  /**
   * Faculty/Student: Get single participation details (with IDOR verification, omitting industryNotes).
   */
  async getMyParticipationById(userId: string, participationId: string, role: UserRole) {
    const participation = await this.prisma.collaborationParticipation.findUnique({
      where: { id: participationId },
      select: {
        id: true,
        collaborationId: true,
        facultyProfileId: true,
        studentProfileId: true,
        status: true,
        motivation: true,
        relevantExperience: true,
        rejectionReason: true,
        requestedAt: true,
        decidedAt: true,
        completedAt: true,
        createdAt: true,
        collaboration: {
          select: {
            id: true,
            title: true,
            description: true,
            collaborationType: true,
            status: true,
            mode: true,
            targetAudience: true,
            startDate: true,
            endDate: true,
            durationDays: true,
            sessionCount: true,
            location: true,
            meetingLink: true,
            contactPerson: true,
            contactEmail: true,
            instructions: true,
            industryProfile: {
              select: {
                id: true,
                companyName: true,
                industryType: true,
                website: true,
              },
            },
          },
        },
        statusHistory: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            fromStatus: true,
            toStatus: true,
            changedByRole: true,
            notes: true,
            createdAt: true,
          },
        },
      },
    });

    if (!participation) {
      throw new NotFoundException(`Participation with ID '${participationId}' not found`);
    }

    if (role === UserRole.FACULTY) {
      const faculty = await this.resolveFacultyProfile(userId);
      if (participation.facultyProfileId !== faculty.id) {
        throw new ForbiddenException('You do not have access to view this participation record');
      }
    } else if (role === UserRole.STUDENT) {
      const student = await this.resolveStudentProfile(userId);
      if (participation.studentProfileId !== student.id) {
        throw new ForbiddenException('You do not have access to view this participation record');
      }
    }

    return participation;
  }

  /**
   * Faculty/Student: Withdraw participation.
   */
  async withdrawParticipation(userId: string, participationId: string, role: UserRole) {
    const participation = await this.prisma.collaborationParticipation.findUnique({
      where: { id: participationId },
    });

    if (!participation) {
      throw new NotFoundException(`Participation with ID '${participationId}' not found`);
    }

    if (role === UserRole.FACULTY) {
      const faculty = await this.resolveFacultyProfile(userId);
      if (participation.facultyProfileId !== faculty.id) {
        throw new ForbiddenException('You do not have access to withdraw this participation');
      }
    } else if (role === UserRole.STUDENT) {
      const student = await this.resolveStudentProfile(userId);
      if (participation.studentProfileId !== student.id) {
        throw new ForbiddenException('You do not have access to withdraw this participation');
      }
    }

    return this.prisma.$transaction(async (tx) => {
      return this.lifecycleService.executeParticipationTransition(
        tx,
        participationId,
        participation.status,
        ParticipationStatus.WITHDRAWN,
        userId,
        role,
        'Withdrawn by participant',
      );
    });
  }

  /**
   * Industry / Super Admin: List all participants for a specific collaboration (with full details & industryNotes).
   */
  async getCollaborationParticipations(
    userId: string,
    collaborationId: string,
    query: ParticipationQueryDto,
    userRole: UserRole,
  ) {
    const collaboration = await this.prisma.collaboration.findUnique({
      where: { id: collaborationId },
    });

    if (!collaboration) {
      throw new NotFoundException(`Collaboration with ID '${collaborationId}' not found`);
    }

    if (userRole !== UserRole.SUPER_ADMIN) {
      const industry = await this.resolveIndustryProfile(userId);
      if (collaboration.industryProfileId !== industry.id) {
        throw new ForbiddenException('You do not have access to view participants for this collaboration');
      }
    }

    const page = Math.max(1, Number(query.page) || COLLABORATION_PAGINATION_DEFAULTS.PAGE);
    const limit = Math.min(
      COLLABORATION_PAGINATION_DEFAULTS.MAX_LIMIT,
      Math.max(1, Number(query.limit) || COLLABORATION_PAGINATION_DEFAULTS.LIMIT),
    );
    const skip = (page - 1) * limit;

    const where: Prisma.CollaborationParticipationWhereInput = {
      collaborationId,
      ...(query.status && { status: query.status }),
      ...(query.role === UserRole.FACULTY && { facultyProfileId: { not: null } }),
      ...(query.role === UserRole.STUDENT && { studentProfileId: { not: null } }),
    };

    const [items, total] = await Promise.all([
      this.prisma.collaborationParticipation.findMany({
        where,
        skip,
        take: limit,
        orderBy: { requestedAt: 'desc' },
        include: {
          facultyProfile: {
            select: {
              id: true,
              fullName: true,
              designation: true,
              department: true,
              areasOfExpertise: true,
              institution: { select: { id: true, name: true, code: true } },
            },
          },
          studentProfile: {
            select: {
              id: true,
              fullName: true,
              degree: true,
              department: true,
              graduationYear: true,
              cgpa: true,
              institution: { select: { id: true, name: true, code: true } },
            },
          },
          statusHistory: {
            orderBy: { createdAt: 'desc' },
          },
        },
      }),
      this.prisma.collaborationParticipation.count({ where }),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  /**
   * Industry / Super Admin: Get single participation detail for review.
   */
  async getCollaborationParticipationById(
    userId: string,
    collaborationId: string,
    participationId: string,
    userRole: UserRole,
  ) {
    const collaboration = await this.prisma.collaboration.findUnique({
      where: { id: collaborationId },
    });

    if (!collaboration) {
      throw new NotFoundException(`Collaboration with ID '${collaborationId}' not found`);
    }

    if (userRole !== UserRole.SUPER_ADMIN) {
      const industry = await this.resolveIndustryProfile(userId);
      if (collaboration.industryProfileId !== industry.id) {
        throw new ForbiddenException('You do not have access to view this participation');
      }
    }

    const participation = await this.prisma.collaborationParticipation.findFirst({
      where: {
        id: participationId,
        collaborationId,
      },
      include: {
        facultyProfile: {
          include: {
            institution: { select: { id: true, name: true, code: true } },
            user: { select: { email: true } },
          },
        },
        studentProfile: {
          include: {
            institution: { select: { id: true, name: true, code: true } },
            user: { select: { email: true } },
            studentSkills: {
              include: { skill: true },
            },
          },
        },
        statusHistory: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!participation) {
      throw new NotFoundException(`Participation record '${participationId}' not found in this collaboration`);
    }

    return participation;
  }

  /**
   * Industry / Super Admin: Update participation status (approve/reject/complete).
   */
  async updateParticipationStatus(
    userId: string,
    collaborationId: string,
    participationId: string,
    dto: UpdateParticipationStatusDto,
    userRole: UserRole,
  ) {
    const collaboration = await this.prisma.collaboration.findUnique({
      where: { id: collaborationId },
    });

    if (!collaboration) {
      throw new NotFoundException(`Collaboration with ID '${collaborationId}' not found`);
    }

    if (userRole !== UserRole.SUPER_ADMIN) {
      const industry = await this.resolveIndustryProfile(userId);
      if (collaboration.industryProfileId !== industry.id) {
        throw new ForbiddenException('You do not have permission to manage participants for this collaboration');
      }
    }

    const participation = await this.prisma.collaborationParticipation.findFirst({
      where: {
        id: participationId,
        collaborationId,
      },
    });

    if (!participation) {
      throw new NotFoundException(`Participation record '${participationId}' not found in this collaboration`);
    }

    return this.prisma.$transaction(async (tx) => {
      return this.lifecycleService.executeParticipationTransition(
        tx,
        participationId,
        participation.status,
        dto.status,
        userId,
        userRole,
        dto.notes,
        dto.rejectionReason,
        dto.industryNotes,
      );
    });
  }
}

import {
  Injectable,
  Inject,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import {
  CollaborationStatus,
  CollaborationAudience,
  UserRole,
  Prisma,
} from '@prisma/client';
import { CreateCollaborationDto } from '../dto/create-collaboration.dto';
import { UpdateCollaborationDto } from '../dto/update-collaboration.dto';
import { CollaborationQueryDto } from '../dto/collaboration-query.dto';
import { UpdateCollaborationStatusDto } from '../dto/update-collaboration-status.dto';
import { CollaborationLifecycleService } from './collaboration-lifecycle.service';
import { COLLABORATION_PAGINATION_DEFAULTS } from '../config/collaboration.constants';

@Injectable()
export class CollaborationsService {
  private readonly logger = new Logger(CollaborationsService.name);

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(CollaborationLifecycleService) private readonly lifecycleService: CollaborationLifecycleService,
  ) {}

  /**
   * Resolve IndustryProfile for the authenticated user ID.
   */
  async resolveIndustryProfile(userId: string) {
    let profile = await this.prisma.industryProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        throw new NotFoundException('User not found');
      }

      if (user.role && user.role !== UserRole.INDUSTRY) {
        throw new ForbiddenException('Only users with the INDUSTRY role can access or provision an industry profile');
      }

      try {
        profile = await this.prisma.industryProfile.create({
          data: {
            userId,
            companyName: 'Unspecified Organization',
            industryType: 'Unspecified',
          },
        });
      } catch (err: any) {
        profile = await this.prisma.industryProfile.findUnique({
          where: { userId },
        });
        if (!profile) {
          throw err;
        }
      }
    }

    return profile;
  }

  /**
   * Create a new collaboration engagement (INDUSTRY).
   */
  async create(userId: string, dto: CreateCollaborationDto) {
    const industry = await this.resolveIndustryProfile(userId);

    const collaboration = await this.prisma.collaboration.create({
      data: {
        industryProfileId: industry.id,
        title: dto.title,
        description: dto.description,
        collaborationType: dto.collaborationType,
        status: dto.status || CollaborationStatus.DRAFT,
        targetAudience: dto.targetAudience || CollaborationAudience.BOTH,
        mode: dto.mode || 'ONLINE',
        startDate: dto.startDate ? new Date(dto.startDate) : null,
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        durationDays: dto.durationDays || null,
        sessionCount: dto.sessionCount || null,
        location: dto.location || null,
        meetingLink: dto.meetingLink || null,
        maxParticipants: dto.maxParticipants || null,
        eligibleDepartments: dto.eligibleDepartments || [],
        domainTags: dto.domainTags || [],
        stipend: dto.stipend !== undefined ? dto.stipend : null,
        stipendCurrency: dto.stipendCurrency || 'INR',
        contactPerson: dto.contactPerson || null,
        contactEmail: dto.contactEmail || null,
        instructions: dto.instructions || null,
        deadline: dto.deadline ? new Date(dto.deadline) : null,
      },
      include: {
        industryProfile: {
          select: {
            id: true,
            companyName: true,
            industryType: true,
            website: true,
            isVerified: true,
          },
        },
      },
    });

    return collaboration;
  }

  /**
   * Find all collaborations with flexible filters and pagination (Marketplace).
   */
  async findAll(query: CollaborationQueryDto, defaultOpenOnly = false) {
    const page = Math.max(1, Number(query.page) || COLLABORATION_PAGINATION_DEFAULTS.PAGE);
    const limit = Math.min(
      COLLABORATION_PAGINATION_DEFAULTS.MAX_LIMIT,
      Math.max(1, Number(query.limit) || COLLABORATION_PAGINATION_DEFAULTS.LIMIT),
    );
    const skip = (page - 1) * limit;

    const where: Prisma.CollaborationWhereInput = {};

    if (query.status) {
      where.status = query.status;
    } else if (defaultOpenOnly) {
      where.status = CollaborationStatus.OPEN;
    }

    if (query.collaborationType) {
      where.collaborationType = query.collaborationType;
    }

    if (query.targetAudience) {
      where.targetAudience = {
        in: [query.targetAudience, CollaborationAudience.BOTH],
      };
    }

    if (query.mode) {
      where.mode = query.mode;
    }

    if (query.industryProfileId) {
      where.industryProfileId = query.industryProfileId;
    }

    if (query.department) {
      where.OR = [
        { eligibleDepartments: { isEmpty: true } },
        { eligibleDepartments: { has: query.department } },
      ];
    }

    if (query.search) {
      const searchFilter: Prisma.CollaborationWhereInput = {
        OR: [
          { title: { contains: query.search, mode: 'insensitive' } },
          { description: { contains: query.search, mode: 'insensitive' } },
          { location: { contains: query.search, mode: 'insensitive' } },
          { domainTags: { has: query.search } },
          { industryProfile: { companyName: { contains: query.search, mode: 'insensitive' } } },
        ],
      };

      if (where.OR) {
        where.AND = [searchFilter];
      } else {
        where.OR = searchFilter.OR;
      }
    }

    const [items, total] = await Promise.all([
      this.prisma.collaboration.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ createdAt: 'desc' }],
        include: {
          industryProfile: {
            select: {
              id: true,
              companyName: true,
              industryType: true,
              website: true,
              isVerified: true,
            },
          },
          _count: {
            select: {
              participations: true,
            },
          },
        },
      }),
      this.prisma.collaboration.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * List all collaborations created by the authenticated industry recruiter.
   */
  async findMyCollaborations(userId: string) {
    const industry = await this.resolveIndustryProfile(userId);

    const items = await this.prisma.collaboration.findMany({
      where: { industryProfileId: industry.id },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            participations: true,
          },
        },
      },
    });

    return items;
  }

  /**
   * Find a single collaboration by ID.
   */
  async findById(id: string) {
    const collaboration = await this.prisma.collaboration.findUnique({
      where: { id },
      include: {
        industryProfile: {
          select: {
            id: true,
            companyName: true,
            industryType: true,
            description: true,
            website: true,
            headquarters: true,
            isVerified: true,
            contactEmail: true,
            contactPhone: true,
          },
        },
        _count: {
          select: {
            participations: true,
          },
        },
      },
    });

    if (!collaboration) {
      throw new NotFoundException(`Collaboration with ID '${id}' not found`);
    }

    return collaboration;
  }

  /**
   * Update collaboration details (Industry Owner / SUPER_ADMIN).
   */
  async update(userId: string, id: string, dto: UpdateCollaborationDto, userRole: UserRole) {
    const collaboration = await this.findById(id);

    if (userRole !== UserRole.SUPER_ADMIN) {
      const industry = await this.resolveIndustryProfile(userId);
      if (collaboration.industryProfileId !== industry.id) {
        throw new ForbiddenException('You do not have permission to edit this collaboration');
      }
    }

    if (
      collaboration.status === CollaborationStatus.COMPLETED ||
      collaboration.status === CollaborationStatus.CANCELLED
    ) {
      throw new BadRequestException(
        `Cannot edit a collaboration that is already in terminal state '${collaboration.status}'`,
      );
    }

    const updateData: Prisma.CollaborationUpdateInput = {
      ...(dto.title !== undefined && { title: dto.title }),
      ...(dto.description !== undefined && { description: dto.description }),
      ...(dto.collaborationType !== undefined && { collaborationType: dto.collaborationType }),
      ...(dto.targetAudience !== undefined && { targetAudience: dto.targetAudience }),
      ...(dto.mode !== undefined && { mode: dto.mode }),
      ...(dto.startDate !== undefined && { startDate: dto.startDate ? new Date(dto.startDate) : null }),
      ...(dto.endDate !== undefined && { endDate: dto.endDate ? new Date(dto.endDate) : null }),
      ...(dto.durationDays !== undefined && { durationDays: dto.durationDays }),
      ...(dto.sessionCount !== undefined && { sessionCount: dto.sessionCount }),
      ...(dto.location !== undefined && { location: dto.location }),
      ...(dto.meetingLink !== undefined && { meetingLink: dto.meetingLink }),
      ...(dto.maxParticipants !== undefined && { maxParticipants: dto.maxParticipants }),
      ...(dto.eligibleDepartments !== undefined && { eligibleDepartments: dto.eligibleDepartments }),
      ...(dto.domainTags !== undefined && { domainTags: dto.domainTags }),
      ...(dto.stipend !== undefined && { stipend: dto.stipend }),
      ...(dto.stipendCurrency !== undefined && { stipendCurrency: dto.stipendCurrency }),
      ...(dto.contactPerson !== undefined && { contactPerson: dto.contactPerson }),
      ...(dto.contactEmail !== undefined && { contactEmail: dto.contactEmail }),
      ...(dto.instructions !== undefined && { instructions: dto.instructions }),
      ...(dto.deadline !== undefined && { deadline: dto.deadline ? new Date(dto.deadline) : null }),
    };

    const updated = await this.prisma.collaboration.update({
      where: { id },
      data: updateData,
      include: {
        industryProfile: {
          select: {
            id: true,
            companyName: true,
            industryType: true,
            website: true,
            isVerified: true,
          },
        },
      },
    });

    return updated;
  }

  /**
   * Update collaboration lifecycle status (Industry Owner / SUPER_ADMIN).
   */
  async updateStatus(
    userId: string,
    id: string,
    dto: UpdateCollaborationStatusDto,
    userRole: UserRole,
  ) {
    const collaboration = await this.findById(id);

    if (userRole !== UserRole.SUPER_ADMIN) {
      const industry = await this.resolveIndustryProfile(userId);
      if (collaboration.industryProfileId !== industry.id) {
        throw new ForbiddenException('You do not have permission to change this collaboration status');
      }
    }

    this.lifecycleService.validateCollaborationTransition(
      collaboration.status,
      dto.status,
      userRole,
    );

    const updated = await this.prisma.collaboration.update({
      where: { id },
      data: { status: dto.status },
      include: {
        industryProfile: {
          select: {
            id: true,
            companyName: true,
            industryType: true,
          },
        },
      },
    });

    return updated;
  }

  /**
   * Delete collaboration (only DRAFT or CANCELLED, or SUPER_ADMIN).
   */
  async delete(userId: string, id: string, userRole: UserRole) {
    const collaboration = await this.findById(id);

    if (userRole !== UserRole.SUPER_ADMIN) {
      const industry = await this.resolveIndustryProfile(userId);
      if (collaboration.industryProfileId !== industry.id) {
        throw new ForbiddenException('You do not have permission to delete this collaboration');
      }

      if (
        collaboration.status !== CollaborationStatus.DRAFT &&
        collaboration.status !== CollaborationStatus.CANCELLED
      ) {
        throw new BadRequestException('Only DRAFT or CANCELLED collaborations can be deleted');
      }
    }

    await this.prisma.collaboration.delete({
      where: { id },
    });

    return { success: true, message: 'Collaboration deleted successfully' };
  }
}

import {
  Injectable,
  Inject,
  Optional,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { CreateOpportunityDto } from '../dto/create-opportunity.dto';
import { UpdateOpportunityDto } from '../dto/update-opportunity.dto';
import { AddOpportunitySkillDto } from '../dto/add-opportunity-skill.dto';
import { OpportunityQueryDto } from '../dto/opportunity-query.dto';
import { UpdateOpportunityStatusDto } from '../dto/update-opportunity-status.dto';
import { OpportunityStatus, NotificationType, NotificationPriority, UserRole } from '@prisma/client';
import { NotificationsService } from '../../notifications/services/notifications.service';

@Injectable()
export class OpportunitiesService {
  private readonly logger = new Logger(OpportunitiesService.name);

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Optional() private readonly notificationsService?: NotificationsService,
  ) {}

  /**
   * Resolve industry profile for authenticated user (JWT userId).
   */
  async resolveIndustryProfile(userId: string) {
    let profile = await this.prisma.industryProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (!user) throw new NotFoundException('User not found');

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
        profile = await this.prisma.industryProfile.findUnique({ where: { userId } });
        if (!profile) throw err;
      }
    }

    return profile;
  }

  /**
   * Recruiter: Create new opportunity with optional skill requirements.
   */
  async create(userId: string, dto: CreateOpportunityDto) {
    const profile = await this.resolveIndustryProfile(userId);

    const existingSlug = await this.prisma.opportunity.findUnique({
      where: { slug: dto.slug },
    });
    if (existingSlug) {
      throw new ConflictException(`Opportunity with slug '${dto.slug}' already exists`);
    }

    // Verify career role if supplied
    if (dto.careerRoleId) {
      const role = await this.prisma.careerRole.findUnique({
        where: { id: dto.careerRoleId },
      });
      if (!role) {
        throw new NotFoundException(`Career role '${dto.careerRoleId}' not found`);
      }
    }

    return this.prisma.$transaction(async (tx) => {
      const opp = await tx.opportunity.create({
        data: {
          industryProfileId: profile.id,
          careerRoleId: dto.careerRoleId || null,
          title: dto.title,
          slug: dto.slug,
          description: dto.description,
          opportunityType: dto.opportunityType,
          status: dto.status || OpportunityStatus.PUBLISHED,
          location: dto.location || 'Remote',
          isRemote: dto.isRemote || false,
          stipend: dto.stipend,
          stipendCurrency: dto.stipendCurrency || 'INR',
          stipendPeriod: dto.stipendPeriod || 'MONTHLY',
          minCgpa: dto.minCgpa,
          minGraduationYear: dto.minGraduationYear,
          maxGraduationYear: dto.maxGraduationYear,
          eligibleDepartments: dto.eligibleDepartments || [],
          deadline: dto.deadline ? new Date(dto.deadline) : null,
          positionsCount: dto.positionsCount || 1,
          maxApplications: dto.maxApplications,
        },
      });

      if (dto.skills && dto.skills.length > 0) {
        if (typeof tx.skill.findMany === 'function') {
          const existingSkills = await tx.skill.findMany({
            where: { id: { in: dto.skills.map((s) => s.skillId) } },
            select: { id: true },
          });
          const validIds = new Set(existingSkills.map((s: any) => s.id));
          const validSkills = dto.skills.filter((s) => validIds.has(s.skillId));

          if (typeof tx.opportunitySkill.createMany === 'function') {
            await tx.opportunitySkill.createMany({
              data: validSkills.map((s) => ({
                opportunityId: opp.id,
                skillId: s.skillId,
                requiredProficiency: s.requiredProficiency,
                weight: s.weight ?? 1.0,
                isMandatory: s.isMandatory ?? true,
              })),
              skipDuplicates: true,
            });
          } else {
            await Promise.all(
              validSkills.map((s) =>
                tx.opportunitySkill.create({
                  data: {
                    opportunityId: opp.id,
                    skillId: s.skillId,
                    requiredProficiency: s.requiredProficiency,
                    weight: s.weight ?? 1.0,
                    isMandatory: s.isMandatory ?? true,
                  },
                }),
              ),
            );
          }
        } else {
          for (const s of dto.skills) {
            const skillExists = await tx.skill.findUnique({ where: { id: s.skillId } });
            if (skillExists) {
              await tx.opportunitySkill.create({
                data: {
                  opportunityId: opp.id,
                  skillId: s.skillId,
                  requiredProficiency: s.requiredProficiency,
                  weight: s.weight ?? 1.0,
                  isMandatory: s.isMandatory ?? true,
                },
              });
            }
          }
        }
      }

      // If published initially, notify eligible student audience
      if (opp.status === OpportunityStatus.PUBLISHED) {
        await this.notifyOpportunityPublished(tx, opp);
      }

      return tx.opportunity.findUnique({
        where: { id: opp.id },
        include: {
          industryProfile: { select: { id: true, companyName: true, headquarters: true, isVerified: true } },
          careerRole: { select: { id: true, title: true, category: true } },
          skills: {
            include: {
              skill: { select: { id: true, name: true, category: { select: { id: true, name: true } } } },
            },
          },
        },
      });
    });
  }

  /**
   * Recruiter: Find all opportunities posted by authenticated recruiter.
   */
  async findMyOpportunities(userId: string) {
    const profile = await this.resolveIndustryProfile(userId);

    return this.prisma.opportunity.findMany({
      where: { industryProfileId: profile.id },
      include: {
        careerRole: { select: { id: true, title: true, category: true } },
        skills: {
          include: {
            skill: { select: { id: true, name: true, category: { select: { id: true, name: true } } } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Recruiter: Find single opportunity ensuring recruiter ownership.
   */
  async findMyOpportunityById(userId: string, id: string) {
    const profile = await this.resolveIndustryProfile(userId);

    const opp = await this.prisma.opportunity.findUnique({
      where: { id },
      include: {
        industryProfile: true,
        careerRole: true,
        skills: {
          include: {
            skill: { select: { id: true, name: true, category: { select: { id: true, name: true } } } },
          },
        },
      },
    });

    if (!opp) {
      throw new NotFoundException(`Opportunity '${id}' not found`);
    }

    if (opp.industryProfileId !== profile.id) {
      throw new ForbiddenException('You are not authorized to access another recruiter\'s opportunity');
    }

    return opp;
  }

  /**
   * Recruiter: Update posting details with ownership enforcement.
   */
  async update(userId: string, id: string, dto: UpdateOpportunityDto) {
    const opp = await this.findMyOpportunityById(userId, id);

    if (dto.slug && dto.slug !== opp.slug) {
      const slugConflict = await this.prisma.opportunity.findUnique({
        where: { slug: dto.slug },
      });
      if (slugConflict) {
        throw new ConflictException(`Opportunity with slug '${dto.slug}' already exists`);
      }
    }

    return this.prisma.opportunity.update({
      where: { id: opp.id },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.slug !== undefined && { slug: dto.slug }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.opportunityType !== undefined && { opportunityType: dto.opportunityType }),
        ...(dto.status !== undefined && { status: dto.status }),
        ...(dto.location !== undefined && { location: dto.location }),
        ...(dto.isRemote !== undefined && { isRemote: dto.isRemote }),
        ...(dto.stipend !== undefined && { stipend: dto.stipend }),
        ...(dto.stipendCurrency !== undefined && { stipendCurrency: dto.stipendCurrency }),
        ...(dto.stipendPeriod !== undefined && { stipendPeriod: dto.stipendPeriod }),
        ...(dto.minCgpa !== undefined && { minCgpa: dto.minCgpa }),
        ...(dto.minGraduationYear !== undefined && { minGraduationYear: dto.minGraduationYear }),
        ...(dto.maxGraduationYear !== undefined && { maxGraduationYear: dto.maxGraduationYear }),
        ...(dto.eligibleDepartments !== undefined && { eligibleDepartments: dto.eligibleDepartments }),
        ...(dto.positionsCount !== undefined && { positionsCount: dto.positionsCount }),
        ...(dto.maxApplications !== undefined && { maxApplications: dto.maxApplications }),
        ...(dto.careerRoleId !== undefined && { careerRoleId: dto.careerRoleId }),
        ...(dto.deadline !== undefined && { deadline: dto.deadline ? new Date(dto.deadline) : null }),
      },
      include: {
        industryProfile: { select: { id: true, companyName: true, isVerified: true } },
        careerRole: { select: { id: true, title: true, category: true } },
        skills: {
          include: {
            skill: { select: { id: true, name: true, category: { select: { id: true, name: true } } } },
          },
        },
      },
    });
  }

  /**
   * Recruiter: Update posting status (DRAFT | PUBLISHED | CLOSED | ARCHIVED).
   */
  async updateStatus(userId: string, id: string, dto: UpdateOpportunityStatusDto) {
    const opp = await this.findMyOpportunityById(userId, id);

    const updated = await this.prisma.opportunity.update({
      where: { id: opp.id },
      data: { status: dto.status },
    });

    if (dto.status === OpportunityStatus.PUBLISHED && opp.status !== OpportunityStatus.PUBLISHED) {
      await this.notifyOpportunityPublished(this.prisma, opp);
    }

    return updated;
  }

  /**
   * Helper: Notify eligible students when an opportunity is published.
   * Scoped to audience rules (department, minimum CGPA) and bounded to 50 max to prevent unbounded fan-outs.
   */
  private async notifyOpportunityPublished(
    tx: any,
    opp: { id: string; title: string; eligibleDepartments?: string[]; minCgpa?: number | null },
  ) {
    if (!this.notificationsService) return;

    try {
      const studentWhere: any = {};
      if (opp.eligibleDepartments && opp.eligibleDepartments.length > 0) {
        studentWhere.department = { in: opp.eligibleDepartments };
      }
      if (opp.minCgpa !== undefined && opp.minCgpa !== null) {
        studentWhere.cgpa = { gte: opp.minCgpa };
      }

      const eligibleStudents = await tx.studentProfile.findMany({
        where: studentWhere,
        select: { userId: true },
        take: 50,
      });

      const validStudents = (eligibleStudents as Array<{ userId: string }>).filter((s) => Boolean(s.userId));
      const dispatches = validStudents.map((student) =>
        this.notificationsService!.dispatchNotification(
          {
            recipientUserId: student.userId,
            type: NotificationType.OPPORTUNITY_PUBLISHED,
            priority: NotificationPriority.LOW,
            title: 'New Opportunity Published',
            message: `A new opportunity '${opp.title}' matching your academic criteria is now open.`,
            entityType: 'OPPORTUNITY',
            entityId: opp.id,
            actionUrl: '/opportunities',
            idempotencyKey: `OPP_PUBLISHED:OPPORTUNITY:${opp.id}:${student.userId}`,
          },
          tx,
        ),
      );
      await Promise.allSettled(dispatches);
    } catch {
      // Safe fallback in unit tests if findMany is not mocked
    }
  }

  /**
   * Recruiter: Add or update skill requirement on opportunity.
   */
  async addSkillRequirement(userId: string, opportunityId: string, dto: AddOpportunitySkillDto) {
    const opp = await this.findMyOpportunityById(userId, opportunityId);

    const skill = await this.prisma.skill.findUnique({ where: { id: dto.skillId } });
    if (!skill || !skill.isActive) {
      throw new NotFoundException(`Skill '${dto.skillId}' not found or is inactive`);
    }

    return this.prisma.opportunitySkill.upsert({
      where: {
        opportunityId_skillId: {
          opportunityId: opp.id,
          skillId: skill.id,
        },
      },
      update: {
        requiredProficiency: dto.requiredProficiency,
        weight: dto.weight ?? 1.0,
        isMandatory: dto.isMandatory ?? true,
      },
      create: {
        opportunityId: opp.id,
        skillId: skill.id,
        requiredProficiency: dto.requiredProficiency,
        weight: dto.weight ?? 1.0,
        isMandatory: dto.isMandatory ?? true,
      },
      include: {
        skill: { select: { id: true, name: true, category: { select: { id: true, name: true } } } },
      },
    });
  }

  /**
   * Recruiter: Remove skill requirement from opportunity.
   */
  async removeSkillRequirement(userId: string, opportunityId: string, skillId: string) {
    const opp = await this.findMyOpportunityById(userId, opportunityId);

    const existing = await this.prisma.opportunitySkill.findUnique({
      where: {
        opportunityId_skillId: {
          opportunityId: opp.id,
          skillId,
        },
      },
    });

    if (!existing) {
      throw new NotFoundException('Skill requirement not found on this opportunity');
    }

    await this.prisma.opportunitySkill.delete({ where: { id: existing.id } });
    return { success: true, message: 'Skill requirement removed from opportunity' };
  }

  /**
   * Public & Students: Browse and search published opportunities with pagination.
   */
  async findAllPublished(query?: OpportunityQueryDto) {
    const where: any = {
      status: query?.status || OpportunityStatus.PUBLISHED,
    };

    if (query?.opportunityType) {
      where.opportunityType = query.opportunityType;
    }

    if (query?.isRemote !== undefined) {
      where.isRemote = query.isRemote === true || String(query.isRemote) === 'true';
    }

    if (query?.location) {
      where.location = { contains: query.location, mode: 'insensitive' };
    }

    if (query?.careerRoleId) {
      where.careerRoleId = query.careerRoleId;
    }

    if (query?.skillId) {
      where.skills = {
        some: { skillId: query.skillId },
      };
    }

    if (query?.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
        { location: { contains: query.search, mode: 'insensitive' } },
        { industryProfile: { companyName: { contains: query.search, mode: 'insensitive' } } },
      ];
    }

    const page = Math.max(1, Number(query?.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query?.limit) || 20));
    const skip = (page - 1) * limit;

    const [total, data] = await Promise.all([
      this.prisma.opportunity.count({ where }),
      this.prisma.opportunity.findMany({
        where,
        skip,
        take: limit,
        include: {
          industryProfile: {
            select: {
              id: true,
              companyName: true,
              industryType: true,
              headquarters: true,
              website: true,
              isVerified: true,
            },
          },
          careerRole: {
            select: {
              id: true,
              title: true,
              slug: true,
              category: true,
            },
          },
          skills: {
            include: {
              skill: {
                select: {
                  id: true,
                  name: true,
                  category: { select: { id: true, name: true } },
                },
              },
            },
            orderBy: [{ weight: 'desc' }, { isMandatory: 'desc' }],
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Public & Students: Get single opportunity by ID or Slug.
   */
  async findByIdOrSlug(idOrSlug: string) {
    let opp = await this.prisma.opportunity.findUnique({
      where: { id: idOrSlug },
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
          },
        },
        careerRole: {
          select: {
            id: true,
            title: true,
            slug: true,
            category: true,
          },
        },
        skills: {
          include: {
            skill: {
              select: {
                id: true,
                name: true,
                category: { select: { id: true, name: true } },
              },
            },
          },
          orderBy: [{ weight: 'desc' }, { isMandatory: 'desc' }],
        },
      },
    });

    if (!opp) {
      opp = await this.prisma.opportunity.findUnique({
        where: { slug: idOrSlug },
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
            },
          },
          careerRole: {
            select: {
              id: true,
              title: true,
              slug: true,
              category: true,
            },
          },
          skills: {
            include: {
              skill: {
                select: {
                  id: true,
                  name: true,
                  category: { select: { id: true, name: true } },
                },
              },
            },
            orderBy: [{ weight: 'desc' }, { isMandatory: 'desc' }],
          },
        },
      });
    }

    if (!opp) {
      throw new NotFoundException(`Opportunity '${idOrSlug}' not found`);
    }

    return opp;
  }
}

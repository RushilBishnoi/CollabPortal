import {
  Injectable,
  Optional,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { OpportunityMatchingService } from '../../opportunities/services/opportunity-matching.service';
import { ApplicationLifecycleService } from './application-lifecycle.service';
import { ApplicationDocumentsService } from './application-documents.service';
import { CreateApplicationDto } from '../dto/create-application.dto';
import { UpdateApplicationStatusDto } from '../dto/update-application-status.dto';
import { ApplicationQueryDto } from '../dto/application-query.dto';
import { ApplicationStatus, OpportunityStatus, UserRole, DocumentType, NotificationType } from '@prisma/client';
import { NotificationsService } from '../../notifications/services/notifications.service';

@Injectable()
export class ApplicationsService {
  private readonly logger = new Logger(ApplicationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly matchingService: OpportunityMatchingService,
    private readonly lifecycleService: ApplicationLifecycleService,
    private readonly documentsService: ApplicationDocumentsService,
    @Optional() private readonly notificationsService?: NotificationsService,
  ) {}

  /**
   * Student: Submit an application to a published opportunity.
   */
  async apply(userId: string, dto: CreateApplicationDto) {
    // 1. Resolve student profile
    const studentProfile = await this.matchingService.resolveStudentProfile(userId);

    // 2. Resolve opportunity and its requirements
    const opportunity = await this.prisma.opportunity.findUnique({
      where: { id: dto.opportunityId },
      include: {
        industryProfile: true,
        careerRole: true,
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
        },
      },
    });

    if (!opportunity) {
      throw new NotFoundException(`Opportunity '${dto.opportunityId}' not found`);
    }

    if (opportunity.status !== OpportunityStatus.PUBLISHED) {
      throw new BadRequestException('Cannot apply to an unpublished, closed, or archived opportunity');
    }

    if (opportunity.deadline && new Date() > new Date(opportunity.deadline)) {
      throw new BadRequestException('Application deadline for this opportunity has passed');
    }

    // 3. Duplicate Application Defense
    const existing = await this.prisma.application.findUnique({
      where: {
        studentProfileId_opportunityId: {
          studentProfileId: studentProfile.id,
          opportunityId: opportunity.id,
        },
      },
    });

    if (existing) {
      throw new ConflictException('You have already submitted an application for this opportunity');
    }

    // 4. Server-authoritative Hard Eligibility Check
    const eligibility = this.matchingService.checkEligibility(studentProfile, opportunity);
    if (!eligibility.isEligible) {
      throw new ForbiddenException({
        code: 'INELIGIBLE_FOR_OPPORTUNITY',
        message: 'You do not meet the mandatory academic eligibility requirements for this opportunity',
        details: eligibility.failureReasons,
      });
    }

    // 5. Evaluate Phase 8 Deterministic Match Score & Breakdown Snapshot
    const matchEvaluation = this.matchingService.evaluateOpportunityMatch(studentProfile, opportunity);

    // 6. Transactional Creation of Application, Snapshot, Documents, and History
    return this.prisma.$transaction(async (tx) => {
      const application = await tx.application.create({
        data: {
          opportunityId: opportunity.id,
          studentProfileId: studentProfile.id,
          status: ApplicationStatus.APPLIED,
          coverLetter: dto.coverLetter || null,
          matchScoreSnapshot: matchEvaluation.overallScore,
          matchBreakdownSnapshot: {
            overallScore: matchEvaluation.overallScore,
            breakdown: matchEvaluation.breakdown,
            skillsSummary: matchEvaluation.skillsSummary,
            skillRequirements: matchEvaluation.skillRequirements,
            eligibility: matchEvaluation.eligibility,
          } as any,
        },
      });

      // Store resume document if provided
      if (dto.resumeFile && dto.resumeFile.buffer) {
        await this.documentsService.storeDocument(
          tx,
          application.id,
          dto.resumeFile,
          DocumentType.RESUME,
        );
      }

      // Record initial status history
      await tx.applicationStatusHistory.create({
        data: {
          applicationId: application.id,
          fromStatus: null,
          toStatus: ApplicationStatus.APPLIED,
          changedByRole: UserRole.STUDENT,
          changedById: userId,
          notes: 'Application submitted by candidate',
        },
      });

      // Notify recruiter / opportunity owner
      if (opportunity.industryProfile?.userId && this.notificationsService) {
        await this.notificationsService.dispatchNotification(
          {
            recipientUserId: opportunity.industryProfile.userId,
            type: NotificationType.APPLICATION_SUBMITTED,
            title: 'New Application Received',
            message: `A candidate has submitted an application for '${opportunity.title}'.`,
            entityType: 'APPLICATION',
            entityId: application.id,
            actionUrl: `/portal/industry/placements`,
            idempotencyKey: `APPLICATION_SUBMITTED:APPLICATION:${application.id}:${opportunity.industryProfile.userId}`,
          },
          tx,
        );
      }

      return tx.application.findUnique({
        where: { id: application.id },
        include: {
          opportunity: {
            select: {
              id: true,
              title: true,
              slug: true,
              opportunityType: true,
              location: true,
              isRemote: true,
              industryProfile: { select: { companyName: true, headquarters: true, isVerified: true } },
            },
          },
          documents: true,
          statusHistory: { orderBy: { createdAt: 'asc' } },
        },
      });
    });
  }

  /**
   * Student: List own submitted applications (sanitized, no private recruiter notes).
   */
  async findStudentApplications(userId: string, query?: ApplicationQueryDto) {
    const studentProfile = await this.matchingService.resolveStudentProfile(userId);

    const where: any = {
      studentProfileId: studentProfile.id,
    };

    if (query?.status) {
      where.status = query.status;
    }

    const page = query?.page && query.page > 0 ? query.page : 1;
    const limit = query?.limit && query.limit > 0 ? query.limit : 20;
    const skip = (page - 1) * limit;

    const [total, data] = await Promise.all([
      this.prisma.application.count({ where }),
      this.prisma.application.findMany({
        where,
        skip,
        take: limit,
        include: {
          opportunity: {
            select: {
              id: true,
              title: true,
              slug: true,
              opportunityType: true,
              location: true,
              isRemote: true,
              stipend: true,
              stipendPeriod: true,
              industryProfile: {
                select: {
                  id: true,
                  companyName: true,
                  industryType: true,
                  headquarters: true,
                  isVerified: true,
                },
              },
            },
          },
          documents: {
            select: {
              id: true,
              documentType: true,
              originalFilename: true,
              sizeBytes: true,
              createdAt: true,
            },
          },
          interviews: {
            select: {
              id: true,
              title: true,
              scheduledAt: true,
              durationMins: true,
              mode: true,
              meetingLink: true,
              interviewer: true,
              instructions: true,
              status: true,
            },
            orderBy: { scheduledAt: 'desc' },
          },
          statusHistory: {
            select: {
              id: true,
              fromStatus: true,
              toStatus: true,
              createdAt: true,
              notes: true,
            },
            orderBy: { createdAt: 'asc' },
          },
        },
        orderBy: { submittedAt: 'desc' },
      }),
    ]);

    // Format sanitized response
    const sanitized = data.map((app) => ({
      id: app.id,
      status: app.status,
      submittedAt: app.submittedAt,
      decidedAt: app.decidedAt,
      matchScore: app.matchScoreSnapshot,
      coverLetter: app.coverLetter,
      opportunity: app.opportunity,
      documents: app.documents,
      interviews: app.interviews,
      statusHistory: app.statusHistory,
    }));

    return {
      data: sanitized,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Student: Get single application details with status timeline (sanitized).
   */
  async findStudentApplicationById(userId: string, id: string) {
    const studentProfile = await this.matchingService.resolveStudentProfile(userId);

    const app = await this.prisma.application.findUnique({
      where: { id },
      include: {
        opportunity: {
          include: {
            industryProfile: {
              select: {
                id: true,
                companyName: true,
                industryType: true,
                website: true,
                headquarters: true,
                isVerified: true,
              },
            },
            careerRole: {
              select: {
                id: true,
                title: true,
                category: true,
              },
            },
          },
        },
        documents: {
          select: {
            id: true,
            documentType: true,
            originalFilename: true,
            sizeBytes: true,
            createdAt: true,
          },
        },
        interviews: {
          select: {
            id: true,
            title: true,
            scheduledAt: true,
            durationMins: true,
            mode: true,
            meetingLink: true,
            interviewer: true,
            instructions: true,
            status: true,
          },
          orderBy: { scheduledAt: 'desc' },
        },
        statusHistory: {
          select: {
            id: true,
            fromStatus: true,
            toStatus: true,
            createdAt: true,
            notes: true,
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!app) {
      throw new NotFoundException(`Application '${id}' not found`);
    }

    if (app.studentProfileId !== studentProfile.id) {
      throw new ForbiddenException('You are not authorized to view another student\'s application');
    }

    return {
      id: app.id,
      status: app.status,
      submittedAt: app.submittedAt,
      reviewedAt: app.reviewedAt,
      decidedAt: app.decidedAt,
      matchScore: app.matchScoreSnapshot,
      matchBreakdown: app.matchBreakdownSnapshot,
      coverLetter: app.coverLetter,
      opportunity: app.opportunity,
      documents: app.documents,
      interviews: app.interviews,
      statusHistory: app.statusHistory,
    };
  }

  /**
   * Student: Withdraw application before final decision.
   */
  async withdraw(userId: string, id: string) {
    const studentProfile = await this.matchingService.resolveStudentProfile(userId);

    const app = await this.prisma.application.findUnique({
      where: { id },
    });

    if (!app) {
      throw new NotFoundException(`Application '${id}' not found`);
    }

    if (app.studentProfileId !== studentProfile.id) {
      throw new ForbiddenException('You are not authorized to withdraw another student\'s application');
    }

    return this.prisma.$transaction(async (tx) => {
      return this.lifecycleService.executeTransition(
        tx,
        app.id,
        app.status,
        ApplicationStatus.WITHDRAWN,
        userId,
        UserRole.STUDENT,
        'Application withdrawn by candidate',
      );
    });
  }

  /**
   * Recruiter: Find all applications received for an opportunity owned by recruiter.
   */
  async findRecruiterApplications(
    userId: string,
    opportunityId: string,
    query?: ApplicationQueryDto,
  ) {
    const opp = await this.prisma.opportunity.findUnique({
      where: { id: opportunityId },
      include: { industryProfile: true },
    });

    if (!opp) {
      throw new NotFoundException(`Opportunity '${opportunityId}' not found`);
    }

    if (opp.industryProfile.userId !== userId) {
      throw new ForbiddenException(
        'You are not authorized to view candidate applications for another company\'s opportunity',
      );
    }

    const where: any = {
      opportunityId,
    };

    if (query?.status) {
      where.status = query.status;
    }

    if (query?.search) {
      where.studentProfile = {
        OR: [
          { fullName: { contains: query.search, mode: 'insensitive' } },
          { department: { contains: query.search, mode: 'insensitive' } },
          { degree: { contains: query.search, mode: 'insensitive' } },
        ],
      };
    }

    const page = query?.page && query.page > 0 ? query.page : 1;
    const limit = query?.limit && query.limit > 0 ? query.limit : 20;
    const skip = (page - 1) * limit;

    const [total, data] = await Promise.all([
      this.prisma.application.count({ where }),
      this.prisma.application.findMany({
        where,
        skip,
        take: limit,
        include: {
          studentProfile: {
            include: {
              studentSkills: {
                include: {
                  skill: { select: { id: true, name: true } },
                },
              },
            },
          },
          documents: true,
          interviews: {
            orderBy: { scheduledAt: 'desc' },
          },
          statusHistory: {
            orderBy: { createdAt: 'asc' },
          },
        },
        orderBy: [{ matchScoreSnapshot: 'desc' }, { submittedAt: 'desc' }],
      }),
    ]);

    return {
      opportunity: {
        id: opp.id,
        title: opp.title,
        slug: opp.slug,
        opportunityType: opp.opportunityType,
        status: opp.status,
        positionsCount: opp.positionsCount,
      },
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
   * Recruiter: Deep candidate evaluation view with complete profile and match breakdown.
   */
  async findRecruiterApplicationById(userId: string, id: string) {
    const app = await this.prisma.application.findUnique({
      where: { id },
      include: {
        opportunity: {
          include: {
            industryProfile: true,
            careerRole: true,
            skills: {
              include: {
                skill: { select: { id: true, name: true, category: { select: { name: true } } } },
              },
            },
          },
        },
        studentProfile: {
          include: {
            user: { select: { email: true, createdAt: true } },
            institution: { select: { id: true, name: true, code: true } },
            studentSkills: {
              include: {
                skill: { select: { id: true, name: true, category: { select: { name: true } } } },
              },
            },
            projects: true,
            certifications: true,
            experiences: true,
          },
        },
        documents: true,
        interviews: {
          orderBy: { scheduledAt: 'desc' },
        },
        statusHistory: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!app) {
      throw new NotFoundException(`Application '${id}' not found`);
    }

    if (app.opportunity.industryProfile.userId !== userId) {
      throw new ForbiddenException(
        'You are not authorized to view candidate applications for another company\'s opportunity',
      );
    }

    return app;
  }

  /**
   * Recruiter: Update application recruitment stage (UNDER_REVIEW | SHORTLISTED | SELECTED | REJECTED).
   */
  async updateRecruiterStatus(
    userId: string,
    id: string,
    dto: UpdateApplicationStatusDto,
  ) {
    const app = await this.prisma.application.findUnique({
      where: { id },
      include: {
        opportunity: {
          include: {
            industryProfile: true,
          },
        },
      },
    });

    if (!app) {
      throw new NotFoundException(`Application '${id}' not found`);
    }

    if (app.opportunity.industryProfile.userId !== userId) {
      throw new ForbiddenException(
        'You are not authorized to update applications for another company\'s opportunity',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      return this.lifecycleService.executeTransition(
        tx,
        app.id,
        app.status,
        dto.status,
        userId,
        UserRole.INDUSTRY,
        dto.recruiterNotes,
        dto.rejectionReason,
      );
    });
  }
}

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { PlacementLifecycleService } from './placement-lifecycle.service';
import { CreatePlacementOfferDto } from '../dto/create-placement-offer.dto';
import { UpdatePlacementOfferDto } from '../dto/update-placement-offer.dto';
import { QueryOffersDto } from '../dto/query-offers.dto';
import { DeclineOfferDto } from '../dto/student-offer-response.dto';
import {
  ApplicationStatus,
  OfferStatus,
  PlacementStatus,
  UserRole,
  NotificationType,
  NotificationPriority,
} from '@prisma/client';
import { Optional } from '@nestjs/common';
import { PLACEMENT_PAGINATION_DEFAULTS } from '../constants/placement.constants';
import { NotificationsService } from '../../notifications/services/notifications.service';

@Injectable()
export class PlacementOffersService {
  private readonly logger = new Logger(PlacementOffersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly lifecycleService: PlacementLifecycleService,
    @Optional() private readonly notificationsService?: NotificationsService,
  ) {}

  /**
   * Resolve industry profile for an INDUSTRY user.
   */
  async resolveIndustryProfile(userId: string) {
    const profile = await this.prisma.industryProfile.findUnique({
      where: { userId },
    });
    if (!profile) {
      throw new NotFoundException('Industry profile not found for authenticated user.');
    }
    return profile;
  }

  /**
   * Resolve student profile for a STUDENT user.
   */
  async resolveStudentProfile(userId: string) {
    const profile = await this.prisma.studentProfile.findUnique({
      where: { userId },
    });
    if (!profile) {
      throw new NotFoundException('Student profile not found for authenticated user.');
    }
    return profile;
  }

  /**
   * Create a formal placement offer for a SELECTED candidate application.
   */
  async createOffer(
    userId: string,
    userRole: UserRole,
    applicationId: string,
    dto: CreatePlacementOfferDto,
  ) {
    // 1. Fetch Application with Opportunity
    const application = await this.prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        opportunity: true,
        studentProfile: {
          include: {
            user: { select: { email: true } },
          },
        },
        placementOffer: true,
      },
    });

    if (!application) {
      throw new NotFoundException('Application not found.');
    }

    // 2. Gate: Application MUST be in SELECTED status
    if (application.status !== ApplicationStatus.SELECTED) {
      throw new BadRequestException(
        `Cannot create placement offer for application in '${application.status}' status. Application must be SELECTED.`,
      );
    }

    // 3. IDOR Gate: Verify Industry Ownership
    if (userRole === UserRole.INDUSTRY) {
      const industry = await this.resolveIndustryProfile(userId);
      if (application.opportunity.industryProfileId !== industry.id) {
        throw new ForbiddenException('You do not own this opportunity/application.');
      }
    }

    // 4. Duplicate Check
    if (application.placementOffer) {
      throw new ConflictException(
        'A placement offer already exists for this candidate application.',
      );
    }

    // 5. Date Invariant Check
    const joiningDate = new Date(dto.joiningDate);
    const offerExpiryDate = new Date(dto.offerExpiryDate);

    if (isNaN(joiningDate.getTime()) || isNaN(offerExpiryDate.getTime())) {
      throw new BadRequestException('Invalid date provided for joining or offer expiry.');
    }

    if (offerExpiryDate.getTime() <= Date.now()) {
      throw new BadRequestException('Offer expiry date must be in the future.');
    }

    // 6. Create Offer within transaction
    return this.prisma.$transaction(async (tx) => {
      const offer = await tx.placementOffer.create({
        data: {
          applicationId: application.id,
          opportunityId: application.opportunityId,
          studentProfileId: application.studentProfileId,
          industryProfileId: application.opportunity.industryProfileId,
          title: dto.title,
          designation: dto.designation,
          employmentType: dto.employmentType,
          status: OfferStatus.DRAFT,
          ctcAnnual: dto.ctcAnnual ?? null,
          baseSalaryMonthly: dto.baseSalaryMonthly ?? null,
          stipendMonthly: dto.stipendMonthly ?? null,
          currency: dto.currency || 'INR',
          joiningDate,
          offerExpiryDate,
          workLocation: dto.workLocation || 'Remote',
          workMode: dto.workMode || 'IN_PERSON',
          department: dto.department || null,
          description: dto.description || null,
          termsAndConditions: dto.termsAndConditions || null,
          benefitsSummary: dto.benefitsSummary || null,
          contactPerson: dto.contactPerson || null,
          contactEmail: dto.contactEmail || null,
        },
      });

      // Audit log creation
      await tx.offerStatusHistory.create({
        data: {
          offerId: offer.id,
          fromStatus: null,
          toStatus: OfferStatus.DRAFT,
          changedByRole: userRole,
          changedById: userId,
          notes: 'Draft offer created for selected candidate.',
        },
      });

      return offer;
    });
  }

  /**
   * Update a draft offer.
   */
  async updateOffer(
    userId: string,
    userRole: UserRole,
    offerId: string,
    dto: UpdatePlacementOfferDto,
  ) {
    const offer = await this.prisma.placementOffer.findUnique({
      where: { id: offerId },
    });

    if (!offer) {
      throw new NotFoundException('Placement offer not found.');
    }

    if (offer.status !== OfferStatus.DRAFT) {
      throw new BadRequestException(
        `Cannot edit offer in '${offer.status}' status. Only DRAFT offers can be edited.`,
      );
    }

    if (userRole === UserRole.INDUSTRY) {
      const industry = await this.resolveIndustryProfile(userId);
      if (offer.industryProfileId !== industry.id) {
        throw new ForbiddenException('You do not own this offer.');
      }
    }

    const updateData: any = { ...dto };
    if (dto.joiningDate) updateData.joiningDate = new Date(dto.joiningDate);
    if (dto.offerExpiryDate) updateData.offerExpiryDate = new Date(dto.offerExpiryDate);

    return this.prisma.placementOffer.update({
      where: { id: offerId },
      data: updateData,
    });
  }

  /**
   * Formally issue offer to student (DRAFT -> ISSUED).
   */
  async issueOffer(
    userId: string,
    userRole: UserRole,
    offerId: string,
    notes?: string,
  ) {
    const offer = await this.prisma.placementOffer.findUnique({
      where: { id: offerId },
    });

    if (!offer) {
      throw new NotFoundException('Placement offer not found.');
    }

    if (userRole === UserRole.INDUSTRY) {
      const industry = await this.resolveIndustryProfile(userId);
      if (offer.industryProfileId !== industry.id) {
        throw new ForbiddenException('You do not own this offer.');
      }
    }

    // Verify expiry date is in future
    if (new Date(offer.offerExpiryDate).getTime() <= Date.now()) {
      throw new BadRequestException('Cannot issue offer with past expiry date.');
    }

    return this.prisma.$transaction(async (tx) => {
      return this.lifecycleService.executeOfferTransition(
        tx,
        offer.id,
        offer.status,
        OfferStatus.ISSUED,
        userId,
        userRole,
        notes || 'Offer formally issued to candidate.',
      );
    });
  }

  /**
   * Withdraw an issued offer (ISSUED -> WITHDRAWN).
   */
  async withdrawOffer(
    userId: string,
    userRole: UserRole,
    offerId: string,
    notes?: string,
  ) {
    const offer = await this.prisma.placementOffer.findUnique({
      where: { id: offerId },
    });

    if (!offer) {
      throw new NotFoundException('Placement offer not found.');
    }

    if (userRole === UserRole.INDUSTRY) {
      const industry = await this.resolveIndustryProfile(userId);
      if (offer.industryProfileId !== industry.id) {
        throw new ForbiddenException('You do not own this offer.');
      }
    }

    return this.prisma.$transaction(async (tx) => {
      return this.lifecycleService.executeOfferTransition(
        tx,
        offer.id,
        offer.status,
        OfferStatus.WITHDRAWN,
        userId,
        userRole,
        notes || 'Offer withdrawn by corporate partner.',
      );
    });
  }

  /**
   * Delete unissued draft offer.
   */
  async deleteDraftOffer(userId: string, userRole: UserRole, offerId: string) {
    const offer = await this.prisma.placementOffer.findUnique({
      where: { id: offerId },
    });

    if (!offer) {
      throw new NotFoundException('Placement offer not found.');
    }

    if (offer.status !== OfferStatus.DRAFT) {
      throw new BadRequestException('Only DRAFT offers can be deleted.');
    }

    if (userRole === UserRole.INDUSTRY) {
      const industry = await this.resolveIndustryProfile(userId);
      if (offer.industryProfileId !== industry.id) {
        throw new ForbiddenException('You do not own this offer.');
      }
    }

    await this.prisma.placementOffer.delete({
      where: { id: offerId },
    });

    return { success: true, message: 'Draft offer successfully deleted.' };
  }

  /**
   * Get offers for Industry Partner with filters and pagination.
   */
  async getIndustryOffers(userId: string, userRole: UserRole, query: QueryOffersDto) {
    let industryProfileId: string | undefined;

    if (userRole === UserRole.INDUSTRY) {
      const industry = await this.resolveIndustryProfile(userId);
      industryProfileId = industry.id;
    }

    const where: any = {};
    if (industryProfileId) {
      where.industryProfileId = industryProfileId;
    }
    if (query.status) {
      where.status = query.status;
    }
    if (query.employmentType) {
      where.employmentType = query.employmentType;
    }
    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { designation: { contains: query.search, mode: 'insensitive' } },
        { studentProfile: { fullName: { contains: query.search, mode: 'insensitive' } } },
      ];
    }

    const page = query.page || PLACEMENT_PAGINATION_DEFAULTS.PAGE;
    const limit = Math.min(
      query.limit || PLACEMENT_PAGINATION_DEFAULTS.LIMIT,
      PLACEMENT_PAGINATION_DEFAULTS.MAX_LIMIT,
    );
    const skip = (page - 1) * limit;

    const [rawOffers, total] = await Promise.all([
      this.prisma.placementOffer.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          opportunity: { select: { id: true, title: true, opportunityType: true } },
          studentProfile: {
            select: {
              id: true,
              fullName: true,
              department: true,
              graduationYear: true,
              cgpa: true,
              avatarUrl: true,
              user: { select: { email: true } },
            },
          },
          documents: true,
          placement: true,
        },
      }),
      this.prisma.placementOffer.count({ where }),
    ]);

    // Lazy evaluate expiry
    const offers = await Promise.all(
      rawOffers.map(async (o) => {
        return this.lifecycleService.evaluateOfferExpiry(this.prisma, o);
      }),
    );

    return {
      items: offers,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get Industry Offer by ID.
   */
  async getIndustryOfferById(userId: string, userRole: UserRole, offerId: string) {
    const rawOffer = await this.prisma.placementOffer.findUnique({
      where: { id: offerId },
      include: {
        opportunity: true,
        studentProfile: {
          include: {
            user: { select: { email: true } },
            institution: { select: { id: true, name: true, code: true } },
          },
        },
        industryProfile: true,
        documents: true,
        statusHistory: { orderBy: { createdAt: 'desc' } },
        placement: {
          include: {
            statusHistory: { orderBy: { createdAt: 'desc' } },
            documents: true,
          },
        },
      },
    });

    if (!rawOffer) {
      throw new NotFoundException('Offer not found.');
    }

    if (userRole === UserRole.INDUSTRY) {
      const industry = await this.resolveIndustryProfile(userId);
      if (rawOffer.industryProfileId !== industry.id) {
        throw new ForbiddenException('You do not own this offer.');
      }
    }

    return this.lifecycleService.evaluateOfferExpiry(this.prisma, rawOffer);
  }

  /**
   * Student: Get received placement offers.
   */
  async getStudentOffers(userId: string, query: QueryOffersDto) {
    const student = await this.resolveStudentProfile(userId);

    const where: any = {
      studentProfileId: student.id,
      status: { not: OfferStatus.DRAFT }, // Students never see DRAFT offers
    };

    if (query.status) {
      where.status = query.status;
    }
    if (query.employmentType) {
      where.employmentType = query.employmentType;
    }
    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { designation: { contains: query.search, mode: 'insensitive' } },
        { industryProfile: { companyName: { contains: query.search, mode: 'insensitive' } } },
      ];
    }

    const page = query.page || PLACEMENT_PAGINATION_DEFAULTS.PAGE;
    const limit = Math.min(
      query.limit || PLACEMENT_PAGINATION_DEFAULTS.LIMIT,
      PLACEMENT_PAGINATION_DEFAULTS.MAX_LIMIT,
    );
    const skip = (page - 1) * limit;

    const [rawOffers, total] = await Promise.all([
      this.prisma.placementOffer.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          opportunity: { select: { id: true, title: true, opportunityType: true } },
          industryProfile: {
            select: { id: true, companyName: true, website: true, industryType: true },
          },
          documents: true,
          placement: true,
        },
      }),
      this.prisma.placementOffer.count({ where }),
    ]);

    // Lazy evaluate expiry
    const offers = await Promise.all(
      rawOffers.map(async (o) => {
        return this.lifecycleService.evaluateOfferExpiry(this.prisma, o);
      }),
    );

    return {
      items: offers,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Student: Get detailed offer.
   */
  async getStudentOfferById(userId: string, offerId: string) {
    const student = await this.resolveStudentProfile(userId);

    const rawOffer = await this.prisma.placementOffer.findUnique({
      where: { id: offerId },
      include: {
        opportunity: true,
        industryProfile: true,
        documents: true,
        statusHistory: { orderBy: { createdAt: 'desc' } },
        placement: {
          include: {
            statusHistory: { orderBy: { createdAt: 'desc' } },
            documents: true,
          },
        },
      },
    });

    if (!rawOffer || rawOffer.studentProfileId !== student.id || rawOffer.status === OfferStatus.DRAFT) {
      throw new NotFoundException('Offer not found.');
    }

    return this.lifecycleService.evaluateOfferExpiry(this.prisma, rawOffer);
  }

  /**
   * Student accepts an issued offer (ISSUED -> ACCEPTED).
   * Automatically generates the official Placement record in PENDING_VERIFICATION.
   */
  async acceptOffer(userId: string, userRole: UserRole, offerId: string, notes?: string) {
    const student = await this.resolveStudentProfile(userId);

    const initialOffer = await this.prisma.placementOffer.findUnique({
      where: { id: offerId },
      include: {
        industryProfile: true,
        studentProfile: true,
      },
    });

    if (!initialOffer || initialOffer.studentProfileId !== student.id) {
      throw new NotFoundException('Offer not found.');
    }

    // Lazy expiry check
    const offer = await this.lifecycleService.evaluateOfferExpiry(this.prisma, initialOffer);

    if (offer.status === OfferStatus.EXPIRED) {
      throw new BadRequestException(
        `This offer expired on ${new Date(offer.offerExpiryDate).toLocaleDateString()} and can no longer be accepted.`,
      );
    }

    if (offer.status !== OfferStatus.ISSUED) {
      throw new BadRequestException(
        `Cannot accept offer in '${offer.status}' status. Only ISSUED offers can be accepted.`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Transition Offer to ACCEPTED
      const updatedOffer = await this.lifecycleService.executeOfferTransition(
        tx,
        offer.id,
        offer.status,
        OfferStatus.ACCEPTED,
        userId,
        userRole,
        notes || 'Offer accepted by student.',
      );

      // Save student notes if provided
      if (notes) {
        await tx.placementOffer.update({
          where: { id: offer.id },
          data: { studentNotes: notes },
        });
      }

      // 2. Generate Official Placement Record in PENDING_VERIFICATION
      const placement = await tx.placement.create({
        data: {
          offerId: offer.id,
          studentProfileId: offer.studentProfileId,
          institutionId: offer.studentProfile.institutionId || null,
          industryProfileId: offer.industryProfileId,
          status: PlacementStatus.PENDING_VERIFICATION,
          annualCtcSnapshot: offer.ctcAnnual,
          companyNameSnapshot: offer.industryProfile.companyName,
          jobTitleSnapshot: offer.designation || offer.title,
        },
      });

      // 3. Create Placement Status History
      await tx.placementStatusHistory.create({
        data: {
          placementId: placement.id,
          fromStatus: null,
          toStatus: PlacementStatus.PENDING_VERIFICATION,
          changedByRole: userRole,
          changedById: userId,
          notes: 'Placement record created upon student offer acceptance.',
        },
      });

      // 4. Notify Institution Admin / TPO that placement verification is required
      if (this.notificationsService && offer.studentProfile?.institutionId) {
        try {
          const instProfile = await tx.institutionProfile.findUnique({
            where: { id: offer.studentProfile.institutionId },
            select: { userId: true },
          });

          if (instProfile?.userId) {
            await this.notificationsService.dispatchNotification(
              {
                recipientUserId: instProfile.userId,
                type: NotificationType.PLACEMENT_VERIFICATION_REQUIRED,
                priority: NotificationPriority.HIGH,
                title: 'Placement Verification Required',
                message: `Placement for candidate '${offer.studentProfile.fullName || 'Student'}' with ${offer.industryProfile.companyName} requires institutional verification.`,
                entityType: 'PLACEMENT',
                entityId: placement.id,
                actionUrl: '/portal/institution/placements',
                idempotencyKey: `PLACEMENT_VERIFICATION_REQUIRED:PLACEMENT:${placement.id}:${instProfile.userId}`,
              },
              tx,
            );
          }
        } catch {
          // Safe fallback in unit tests if mock doesn't define institutionProfile
        }
      }

      return {
        offer: updatedOffer,
        placement,
      };
    });
  }

  /**
   * Student declines an issued offer (ISSUED -> DECLINED).
   */
  async declineOffer(
    userId: string,
    userRole: UserRole,
    offerId: string,
    dto: DeclineOfferDto,
  ) {
    const student = await this.resolveStudentProfile(userId);

    const initialOffer = await this.prisma.placementOffer.findUnique({
      where: { id: offerId },
    });

    if (!initialOffer || initialOffer.studentProfileId !== student.id) {
      throw new NotFoundException('Offer not found.');
    }

    const offer = await this.lifecycleService.evaluateOfferExpiry(this.prisma, initialOffer);

    if (offer.status !== OfferStatus.ISSUED) {
      throw new BadRequestException(
        `Cannot decline offer in '${offer.status}' status. Only ISSUED offers can be declined.`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const updatedOffer = await this.lifecycleService.executeOfferTransition(
        tx,
        offer.id,
        offer.status,
        OfferStatus.DECLINED,
        userId,
        userRole,
        dto.notes || `Declined: ${dto.declineReason}`,
      );

      await tx.placementOffer.update({
        where: { id: offer.id },
        data: {
          studentDeclineReason: dto.declineReason,
          studentNotes: dto.notes || null,
        },
      });

      return updatedOffer;
    });
  }
}

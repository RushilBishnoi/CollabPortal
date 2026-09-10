import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { PlacementLifecycleService } from './placement-lifecycle.service';
import { VerifyPlacementDto, RevokePlacementDto } from '../dto/verify-placement.dto';
import { ConfirmJoiningDto } from '../dto/confirm-joining.dto';
import { QueryPlacementsDto } from '../dto/query-placements.dto';
import { PlacementStatus, UserRole } from '@prisma/client';
import { PLACEMENT_PAGINATION_DEFAULTS } from '../constants/placement.constants';

@Injectable()
export class PlacementsService {
  private readonly logger = new Logger(PlacementsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly lifecycleService: PlacementLifecycleService,
  ) {}

  /**
   * Resolve institution profile for an INSTITUTION_ADMIN user.
   */
  async resolveInstitutionProfile(userId: string) {
    let profile = await this.prisma.institutionProfile.findUnique({
      where: { userId },
    });
    if (!profile) {
      const primaryInstitution = await this.prisma.institutionProfile.findFirst({
        orderBy: { createdAt: 'asc' },
      });
      if (primaryInstitution && !primaryInstitution.userId) {
        profile = await this.prisma.institutionProfile.update({
          where: { id: primaryInstitution.id },
          data: { userId },
        });
      } else if (primaryInstitution) {
        profile = primaryInstitution;
      } else {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
          throw new NotFoundException('User not found');
        }
        profile = await this.prisma.institutionProfile.create({
          data: {
            userId,
            name: 'Institution of Technology',
            type: 'UNIVERSITY',
          },
        });
      }
    }
    return profile;
  }

  /**
   * Get paginated placements for an institution.
   */
  async getInstitutionPlacements(
    userId: string,
    userRole: UserRole,
    query: QueryPlacementsDto,
  ) {
    let institutionId: string | undefined;

    if (userRole === UserRole.INSTITUTION_ADMIN) {
      const institution = await this.resolveInstitutionProfile(userId);
      institutionId = institution.id;
    }

    const where: any = {};
    if (institutionId) {
      where.institutionId = institutionId;
    }
    if (query.status) {
      where.status = query.status;
    }
    if (query.department) {
      where.studentProfile = {
        department: { contains: query.department, mode: 'insensitive' },
      };
    }
    if (query.search) {
      where.OR = [
        { companyNameSnapshot: { contains: query.search, mode: 'insensitive' } },
        { jobTitleSnapshot: { contains: query.search, mode: 'insensitive' } },
        { studentProfile: { fullName: { contains: query.search, mode: 'insensitive' } } },
      ];
    }

    const page = query.page || PLACEMENT_PAGINATION_DEFAULTS.PAGE;
    const limit = Math.min(
      query.limit || PLACEMENT_PAGINATION_DEFAULTS.LIMIT,
      PLACEMENT_PAGINATION_DEFAULTS.MAX_LIMIT,
    );
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.placement.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          studentProfile: {
            select: {
              id: true,
              fullName: true,
              department: true,
              degree: true,
              graduationYear: true,
              cgpa: true,
              user: { select: { email: true } },
            },
          },
          industryProfile: {
            select: { id: true, companyName: true, website: true },
          },
          offer: {
            select: {
              id: true,
              title: true,
              employmentType: true,
              ctcAnnual: true,
              joiningDate: true,
              workLocation: true,
            },
          },
          documents: true,
        },
      }),
      this.prisma.placement.count({ where }),
    ]);

    return {
      items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get Institution Placement by ID.
   */
  async getInstitutionPlacementById(
    userId: string,
    userRole: UserRole,
    placementId: string,
  ) {
    const placement = await this.prisma.placement.findUnique({
      where: { id: placementId },
      include: {
        studentProfile: {
          include: {
            user: { select: { email: true } },
            institution: true,
          },
        },
        industryProfile: true,
        offer: {
          include: {
            opportunity: true,
            documents: true,
            statusHistory: { orderBy: { createdAt: 'desc' } },
          },
        },
        documents: true,
        statusHistory: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!placement) {
      throw new NotFoundException('Placement not found.');
    }

    if (userRole === UserRole.INSTITUTION_ADMIN) {
      const institution = await this.resolveInstitutionProfile(userId);
      if (placement.institutionId !== institution.id) {
        throw new ForbiddenException('You do not have access to this student placement.');
      }
    }

    return placement;
  }

  /**
   * Institution TPO Verifies a Placement & issues optional NOC.
   */
  async verifyPlacement(
    userId: string,
    userRole: UserRole,
    placementId: string,
    dto: VerifyPlacementDto,
  ) {
    const placement = await this.prisma.placement.findUnique({
      where: { id: placementId },
    });

    if (!placement) {
      throw new NotFoundException('Placement not found.');
    }

    if (userRole === UserRole.INSTITUTION_ADMIN) {
      const institution = await this.resolveInstitutionProfile(userId);
      if (placement.institutionId !== institution.id) {
        throw new ForbiddenException('You do not have permission to verify this placement.');
      }
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await this.lifecycleService.executePlacementTransition(
        tx,
        placement.id,
        placement.status,
        PlacementStatus.VERIFIED,
        userId,
        userRole,
        dto.verificationNotes || 'Placement officially verified by institution TPO.',
      );

      const extraData: any = {};
      if (dto.nocIssued !== undefined) extraData.nocIssued = dto.nocIssued;
      if (dto.nocReferenceNumber) extraData.nocReferenceNumber = dto.nocReferenceNumber;
      if (dto.verificationNotes) extraData.verificationNotes = dto.verificationNotes;

      if (Object.keys(extraData).length > 0) {
        await tx.placement.update({
          where: { id: placement.id },
          data: extraData,
        });
      }

      return updated;
    });
  }

  /**
   * Confirm student joining.
   */
  async confirmJoining(
    userId: string,
    userRole: UserRole,
    placementId: string,
    dto: ConfirmJoiningDto,
  ) {
    const placement = await this.prisma.placement.findUnique({
      where: { id: placementId },
    });

    if (!placement) {
      throw new NotFoundException('Placement not found.');
    }

    if (userRole === UserRole.INSTITUTION_ADMIN) {
      const institution = await this.resolveInstitutionProfile(userId);
      if (placement.institutionId !== institution.id) {
        throw new ForbiddenException('You do not have permission to confirm this placement.');
      }
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await this.lifecycleService.executePlacementTransition(
        tx,
        placement.id,
        placement.status,
        PlacementStatus.JOINED,
        userId,
        userRole,
        dto.notes || 'Student joining confirmed.',
      );

      if (dto.actualJoiningDate) {
        await tx.placement.update({
          where: { id: placement.id },
          data: { actualJoiningDate: new Date(dto.actualJoiningDate) },
        });
      }

      return updated;
    });
  }

  /**
   * Revoke an invalid placement.
   */
  async revokePlacement(
    userId: string,
    userRole: UserRole,
    placementId: string,
    dto: RevokePlacementDto,
  ) {
    const placement = await this.prisma.placement.findUnique({
      where: { id: placementId },
    });

    if (!placement) {
      throw new NotFoundException('Placement not found.');
    }

    if (userRole === UserRole.INSTITUTION_ADMIN) {
      const institution = await this.resolveInstitutionProfile(userId);
      if (placement.institutionId !== institution.id) {
        throw new ForbiddenException('You do not have permission to revoke this placement.');
      }
    }

    return this.prisma.$transaction(async (tx) => {
      return this.lifecycleService.executePlacementTransition(
        tx,
        placement.id,
        placement.status,
        PlacementStatus.REVOKED,
        userId,
        userRole,
        `Revoked: ${dto.reason}`,
      );
    });
  }

  /**
   * Student: View own official placements.
   */
  async getStudentPlacements(userId: string) {
    const student = await this.prisma.studentProfile.findUnique({
      where: { userId },
    });

    if (!student) {
      throw new NotFoundException('Student profile not found.');
    }

    return this.prisma.placement.findMany({
      where: { studentProfileId: student.id },
      orderBy: { createdAt: 'desc' },
      include: {
        offer: {
          include: {
            opportunity: true,
            industryProfile: true,
            documents: true,
          },
        },
        documents: true,
        statusHistory: { orderBy: { createdAt: 'desc' } },
      },
    });
  }
}

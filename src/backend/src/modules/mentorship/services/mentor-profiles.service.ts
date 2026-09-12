import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { Prisma, UserRole, MentorRoleType } from '@prisma/client';
import { UpsertMentorProfileDto } from '../dto/upsert-mentor-profile.dto';
import { QueryMentorsDto } from '../dto/query-mentors.dto';
import { MENTORSHIP_PAGINATION_DEFAULTS } from '../constants/mentorship.constants';

@Injectable()
export class MentorProfilesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Helper: Resolve MentorProfile by user ID or fail
   */
  async resolveMentorProfileByUserId(userId: string) {
    const profile = await this.prisma.mentorProfile.findUnique({
      where: { userId },
      include: {
        skills: { include: { skill: true } },
        careerRoles: { include: { careerRole: true } },
        availabilities: true,
      },
    });

    if (!profile) {
      throw new NotFoundException('Mentor profile not found for this user.');
    }

    return profile;
  }

  /**
   * Helper: Resolve StudentProfile by user ID
   */
  async resolveStudentProfile(userId: string) {
    const student = await this.prisma.studentProfile.findUnique({
      where: { userId },
    });
    if (!student) {
      throw new ForbiddenException('User does not have an active Student profile.');
    }
    return student;
  }

  /**
   * Create or update MentorProfile for INDUSTRY, FACULTY, or SUPER_ADMIN users
   */
  async upsertProfile(
    userId: string,
    userRole: UserRole,
    dto: UpsertMentorProfileDto,
  ) {
    if (
      userRole !== UserRole.INDUSTRY &&
      userRole !== UserRole.FACULTY &&
      userRole !== UserRole.SUPER_ADMIN
    ) {
      throw new ForbiddenException(
        'Only INDUSTRY, FACULTY, or SUPER_ADMIN users can create a mentor profile.',
      );
    }

    const mentorRoleType =
      userRole === UserRole.FACULTY
        ? MentorRoleType.FACULTY
        : MentorRoleType.INDUSTRY;

    // Validate skill IDs if provided
    if (dto.skillIds && dto.skillIds.length > 0) {
      const skillsCount = await this.prisma.skill.count({
        where: { id: { in: dto.skillIds } },
      });
      if (skillsCount !== dto.skillIds.length) {
        throw new BadRequestException('One or more skill IDs are invalid.');
      }
    }

    // Validate career role IDs if provided
    if (dto.careerRoleIds && dto.careerRoleIds.length > 0) {
      const rolesCount = await this.prisma.careerRole.count({
        where: { id: { in: dto.careerRoleIds } },
      });
      if (rolesCount !== dto.careerRoleIds.length) {
        throw new BadRequestException('One or more career role IDs are invalid.');
      }
    }

    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Upsert profile
      const mentorProfile = await tx.mentorProfile.upsert({
        where: { userId },
        create: {
          userId,
          mentorRoleType,
          headline: dto.headline,
          bio: dto.bio,
          designation: dto.designation,
          companyOrInstitution: dto.companyOrInstitution,
          yearsOfExperience: dto.yearsOfExperience ?? 1,
          maxMentees: dto.maxMentees ?? 5,
          isAvailable: dto.isAvailable ?? true,
          defaultMeetingPlatform: dto.defaultMeetingPlatform ?? 'GOOGLE_MEET',
          defaultMeetingLink: dto.defaultMeetingLink,
          linkedInUrl: dto.linkedInUrl,
          githubUrl: dto.githubUrl,
        },
        update: {
          headline: dto.headline,
          bio: dto.bio,
          designation: dto.designation,
          companyOrInstitution: dto.companyOrInstitution,
          yearsOfExperience: dto.yearsOfExperience,
          maxMentees: dto.maxMentees,
          isAvailable: dto.isAvailable,
          defaultMeetingPlatform: dto.defaultMeetingPlatform,
          defaultMeetingLink: dto.defaultMeetingLink,
          linkedInUrl: dto.linkedInUrl,
          githubUrl: dto.githubUrl,
        },
      });

      // Update skills if supplied
      if (dto.skillIds) {
        await tx.mentorSkill.deleteMany({
          where: { mentorProfileId: mentorProfile.id },
        });

        if (dto.skillIds.length > 0) {
          await tx.mentorSkill.createMany({
            data: dto.skillIds.map((skillId) => ({
              mentorProfileId: mentorProfile.id,
              skillId,
            })),
            skipDuplicates: true,
          });
        }
      }

      // Update career roles if supplied
      if (dto.careerRoleIds) {
        await tx.mentorCareerRole.deleteMany({
          where: { mentorProfileId: mentorProfile.id },
        });

        if (dto.careerRoleIds.length > 0) {
          await tx.mentorCareerRole.createMany({
            data: dto.careerRoleIds.map((careerRoleId) => ({
              mentorProfileId: mentorProfile.id,
              careerRoleId,
            })),
            skipDuplicates: true,
          });
        }
      }

      return tx.mentorProfile.findUnique({
        where: { id: mentorProfile.id },
        include: {
          skills: { include: { skill: true } },
          careerRoles: { include: { careerRole: true } },
          availabilities: true,
        },
      });
    });
  }

  /**
   * Get public profile of a mentor by ID
   */
  async getMentorById(mentorProfileId: string) {
    const profile = await this.prisma.mentorProfile.findUnique({
      where: { id: mentorProfileId },
      include: {
        user: { select: { email: true, avatarUrl: true } },
        skills: { include: { skill: { include: { category: true } } } },
        careerRoles: { include: { careerRole: true } },
        availabilities: true,
        _count: {
          select: {
            mentorships: { where: { status: 'ACTIVE' } },
            sessions: { where: { status: 'COMPLETED' } },
          },
        },
      },
    });

    if (!profile) {
      throw new NotFoundException('Mentor profile not found.');
    }

    return profile;
  }

  /**
   * Get current authenticated user's mentor profile
   */
  async getMyProfile(userId: string) {
    const profile = await this.prisma.mentorProfile.findUnique({
      where: { userId },
      include: {
        skills: { include: { skill: true } },
        careerRoles: { include: { careerRole: true } },
        availabilities: true,
        _count: {
          select: {
            mentorships: { where: { status: 'ACTIVE' } },
            mentorshipRequests: { where: { status: 'PENDING' } },
            sessions: true,
          },
        },
      },
    });

    if (!profile) {
      throw new NotFoundException('You have not set up a mentor profile yet.');
    }

    return profile;
  }

  /**
   * Public discovery / search mentors with filters
   */
  async findMentors(query: QueryMentorsDto) {
    const page = query.page || MENTORSHIP_PAGINATION_DEFAULTS.PAGE;
    const limit = Math.min(
      query.limit || MENTORSHIP_PAGINATION_DEFAULTS.LIMIT,
      MENTORSHIP_PAGINATION_DEFAULTS.MAX_LIMIT,
    );
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.isAvailable !== undefined) {
      where.isAvailable = query.isAvailable;
    }

    if (query.mentorRoleType) {
      where.mentorRoleType = query.mentorRoleType;
    }

    if (query.skillId) {
      where.skills = {
        some: { skillId: query.skillId },
      };
    }

    if (query.careerRoleId) {
      where.careerRoles = {
        some: { careerRoleId: query.careerRoleId },
      };
    }

    if (query.search) {
      where.OR = [
        { headline: { contains: query.search, mode: 'insensitive' } },
        { bio: { contains: query.search, mode: 'insensitive' } },
        { designation: { contains: query.search, mode: 'insensitive' } },
        { companyOrInstitution: { contains: query.search, mode: 'insensitive' } },
        {
          skills: {
            some: { skill: { name: { contains: query.search, mode: 'insensitive' } } },
          },
        },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.mentorProfile.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ averageRating: 'desc' }, { totalSessionsCompleted: 'desc' }],
        include: {
          user: { select: { email: true, avatarUrl: true } },
          skills: { include: { skill: true } },
          careerRoles: { include: { careerRole: true } },
          availabilities: true,
          _count: {
            select: {
              mentorships: { where: { status: 'ACTIVE' } },
            },
          },
        },
      }),
      this.prisma.mentorProfile.count({ where }),
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
}

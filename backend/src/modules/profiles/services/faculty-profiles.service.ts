import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { UpdateFacultyProfileDto } from '../dto/update-faculty-profile.dto';

@Injectable()
export class FacultyProfilesService {
  private readonly logger = new Logger(FacultyProfilesService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getMyProfile(userId: string) {
    let profile = await this.prisma.facultyProfile.findUnique({
      where: { userId },
      include: {
        institution: { select: { id: true, name: true, code: true, type: true } },
      },
    });

    if (!profile) {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        throw new NotFoundException('User not found');
      }

      profile = await this.prisma.facultyProfile.create({
        data: {
          userId,
          fullName: user.email.split('@')[0] || 'Faculty Member',
        },
        include: {
          institution: { select: { id: true, name: true, code: true, type: true } },
        },
      });
    }

    return profile;
  }

  async updateMyProfile(userId: string, dto: UpdateFacultyProfileDto) {
    const existing = await this.getMyProfile(userId);

    return this.prisma.facultyProfile.update({
      where: { id: existing.id },
      data: {
        ...(dto.fullName !== undefined && { fullName: dto.fullName }),
        ...(dto.phoneNumber !== undefined && { phoneNumber: dto.phoneNumber }),
        ...(dto.designation !== undefined && { designation: dto.designation }),
        ...(dto.department !== undefined && { department: dto.department }),
        ...(dto.institutionId !== undefined && { institutionId: dto.institutionId }),
        ...(dto.academicBackground !== undefined && { academicBackground: dto.academicBackground }),
        ...(dto.areasOfExpertise !== undefined && { areasOfExpertise: dto.areasOfExpertise }),
        ...(dto.researchInterests !== undefined && { researchInterests: dto.researchInterests }),
        ...(dto.industryInterests !== undefined && { industryInterests: dto.industryInterests }),
      },
      include: {
        institution: { select: { id: true, name: true, code: true, type: true } },
      },
    });
  }

  async getFacultyProfileById(id: string) {
    const profile = await this.prisma.facultyProfile.findUnique({
      where: { id },
      include: {
        institution: { select: { id: true, name: true, code: true, type: true } },
      },
    });

    if (!profile) {
      throw new NotFoundException('Faculty profile not found');
    }

    return profile;
  }
}

import { Injectable, NotFoundException, ForbiddenException, BadRequestException, Logger } from '@nestjs/common';
import { UserRole, Prisma } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { UpdateIndustryProfileDto } from '../dto/update-industry-profile.dto';

@Injectable()
export class IndustryProfilesService {
  private readonly logger = new Logger(IndustryProfilesService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getMyProfile(userId: string) {
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
        profile = await this.prisma.industryProfile.findUnique({ where: { userId } });
        if (!profile) throw err;
      }
    }

    return profile;
  }

  async updateMyProfile(userId: string, dto: UpdateIndustryProfileDto) {
    const existing = await this.getMyProfile(userId);

    const updateData: Prisma.IndustryProfileUpdateInput = {};

    if (dto.companyName !== undefined) {
      const trimmed = dto.companyName.trim();
      if (!trimmed) {
        throw new BadRequestException('Company name cannot be empty');
      }
      updateData.companyName = trimmed;
    }

    if (dto.industryType !== undefined) {
      const trimmed = dto.industryType.trim();
      if (!trimmed) {
        throw new BadRequestException('Industry type cannot be empty');
      }
      updateData.industryType = trimmed;
    }

    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.website !== undefined) updateData.website = dto.website;
    if (dto.companySize !== undefined) updateData.companySize = dto.companySize;
    if (dto.headquarters !== undefined) updateData.headquarters = dto.headquarters;
    if (dto.contactEmail !== undefined) updateData.contactEmail = dto.contactEmail;
    if (dto.contactPhone !== undefined) updateData.contactPhone = dto.contactPhone;

    return this.prisma.industryProfile.update({
      where: { id: existing.id },
      data: updateData,
    });
  }

  async getIndustryProfileById(id: string) {
    const profile = await this.prisma.industryProfile.findUnique({
      where: { id },
    });

    if (!profile) {
      throw new NotFoundException('Industry profile not found');
    }

    return profile;
  }
}

import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { UpdateInstitutionProfileDto } from '../dto/update-institution-profile.dto';

@Injectable()
export class InstitutionProfilesService {
  private readonly logger = new Logger(InstitutionProfilesService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getMyProfile(userId: string) {
    let profile = await this.prisma.institutionProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
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

    return profile;
  }

  async updateMyProfile(userId: string, dto: UpdateInstitutionProfileDto) {
    const existing = await this.getMyProfile(userId);

    return this.prisma.institutionProfile.update({
      where: { id: existing.id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.code !== undefined && { code: dto.code }),
        ...(dto.type !== undefined && { type: dto.type }),
        ...(dto.address !== undefined && { address: dto.address }),
        ...(dto.city !== undefined && { city: dto.city }),
        ...(dto.state !== undefined && { state: dto.state }),
        ...(dto.website !== undefined && { website: dto.website }),
        ...(dto.contactEmail !== undefined && { contactEmail: dto.contactEmail }),
        ...(dto.contactPhone !== undefined && { contactPhone: dto.contactPhone }),
        ...(dto.departments !== undefined && { departments: dto.departments }),
      },
    });
  }

  async getInstitutionProfileById(id: string) {
    const profile = await this.prisma.institutionProfile.findUnique({
      where: { id },
    });

    if (!profile) {
      throw new NotFoundException('Institution profile not found');
    }

    return profile;
  }

  async listInstitutions() {
    return this.prisma.institutionProfile.findMany({
      select: {
        id: true,
        name: true,
        code: true,
        type: true,
        city: true,
        state: true,
        isVerified: true,
      },
      orderBy: { name: 'asc' },
    });
  }
}

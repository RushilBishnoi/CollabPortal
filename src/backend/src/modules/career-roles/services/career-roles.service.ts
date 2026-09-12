import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { CreateCareerRoleDto } from '../dto/create-career-role.dto';
import { UpdateCareerRoleDto } from '../dto/update-career-role.dto';
import { AddCareerRoleSkillDto } from '../dto/add-career-role-skill.dto';
import { CareerRoleQueryDto } from '../dto/career-role-query.dto';

@Injectable()
export class CareerRolesService {
  private readonly logger = new Logger(CareerRolesService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * List all career roles with optional search and category filters.
   */
  async findAll(query?: CareerRoleQueryDto) {
    const where: any = {};

    if (query?.isActive !== undefined) {
      where.isActive = query.isActive;
    } else {
      where.isActive = true;
    }

    if (query?.category) {
      where.category = {
        equals: query.category,
        mode: 'insensitive',
      };
    }

    if (query?.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
        { category: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.careerRole.findMany({
      where,
      include: {
        skills: {
          include: {
            skill: {
              select: {
                id: true,
                name: true,
                description: true,
                category: { select: { id: true, name: true } },
              },
            },
          },
          orderBy: [{ weight: 'desc' }, { isMandatory: 'desc' }],
        },
      },
      orderBy: [{ category: 'asc' }, { title: 'asc' }],
    });
  }

  /**
   * Get distinct list of career role categories.
   */
  async getCategories() {
    const roles = await this.prisma.careerRole.findMany({
      where: { isActive: true },
      select: { category: true },
      distinct: ['category'],
      orderBy: { category: 'asc' },
    });
    return roles.map((r) => r.category);
  }

  /**
   * Retrieve a single career role by ID or slug with all skill requirements.
   */
  async findByIdOrSlug(idOrSlug: string) {
    let role = await this.prisma.careerRole.findUnique({
      where: { id: idOrSlug },
      include: {
        skills: {
          include: {
            skill: {
              select: {
                id: true,
                name: true,
                description: true,
                category: { select: { id: true, name: true } },
              },
            },
          },
          orderBy: [{ weight: 'desc' }, { isMandatory: 'desc' }],
        },
      },
    });

    if (!role) {
      role = await this.prisma.careerRole.findUnique({
        where: { slug: idOrSlug },
        include: {
          skills: {
            include: {
              skill: {
                select: {
                  id: true,
                  name: true,
                  description: true,
                  category: { select: { id: true, name: true } },
                },
              },
            },
            orderBy: [{ weight: 'desc' }, { isMandatory: 'desc' }],
          },
        },
      });
    }

    if (!role) {
      throw new NotFoundException(`Career role '${idOrSlug}' not found`);
    }

    return role;
  }

  /**
   * Create a new canonical career role.
   */
  async create(dto: CreateCareerRoleDto) {
    const existing = await this.prisma.careerRole.findUnique({
      where: { slug: dto.slug },
    });
    if (existing) {
      throw new ConflictException(`Career role with slug '${dto.slug}' already exists`);
    }

    return this.prisma.careerRole.create({
      data: {
        title: dto.title,
        slug: dto.slug,
        category: dto.category,
        description: dto.description,
        minExperienceYears: dto.minExperienceYears ?? 0,
        isActive: dto.isActive ?? true,
      },
    });
  }

  /**
   * Update an existing career role.
   */
  async update(id: string, dto: UpdateCareerRoleDto) {
    const existing = await this.prisma.careerRole.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Career role '${id}' not found`);
    }

    if (dto.slug && dto.slug !== existing.slug) {
      const slugConflict = await this.prisma.careerRole.findUnique({
        where: { slug: dto.slug },
      });
      if (slugConflict) {
        throw new ConflictException(`Career role with slug '${dto.slug}' already exists`);
      }
    }

    return this.prisma.careerRole.update({
      where: { id },
      data: dto,
    });
  }

  /**
   * Add or update a skill requirement for a career role.
   */
  async addSkillRequirement(careerRoleId: string, dto: AddCareerRoleSkillDto) {
    const role = await this.prisma.careerRole.findUnique({ where: { id: careerRoleId } });
    if (!role) {
      throw new NotFoundException(`Career role '${careerRoleId}' not found`);
    }

    const skill = await this.prisma.skill.findUnique({ where: { id: dto.skillId } });
    if (!skill || !skill.isActive) {
      throw new NotFoundException(`Skill '${dto.skillId}' not found or is inactive`);
    }

    return this.prisma.careerRoleSkill.upsert({
      where: {
        careerRoleId_skillId: {
          careerRoleId: role.id,
          skillId: skill.id,
        },
      },
      update: {
        requiredProficiency: dto.requiredProficiency,
        weight: dto.weight ?? 1.0,
        isMandatory: dto.isMandatory ?? true,
      },
      create: {
        careerRoleId: role.id,
        skillId: skill.id,
        requiredProficiency: dto.requiredProficiency,
        weight: dto.weight ?? 1.0,
        isMandatory: dto.isMandatory ?? true,
      },
      include: {
        skill: {
          select: {
            id: true,
            name: true,
            category: { select: { id: true, name: true } },
          },
        },
      },
    });
  }

  /**
   * Remove a skill requirement from a career role.
   */
  async removeSkillRequirement(careerRoleId: string, skillId: string) {
    const existing = await this.prisma.careerRoleSkill.findUnique({
      where: {
        careerRoleId_skillId: {
          careerRoleId,
          skillId,
        },
      },
    });

    if (!existing) {
      throw new NotFoundException('Skill requirement not found on this career role');
    }

    await this.prisma.careerRoleSkill.delete({ where: { id: existing.id } });
    return { success: true, message: 'Skill requirement removed from career role' };
  }
}

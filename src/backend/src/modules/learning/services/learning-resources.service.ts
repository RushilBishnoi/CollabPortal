import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { CreateLearningResourceDto } from '../dto/create-learning-resource.dto';
import { UpdateLearningResourceDto } from '../dto/update-learning-resource.dto';
import { QueryLearningResourcesDto } from '../dto/query-learning-resources.dto';
import { UserRole } from '@prisma/client';
import { LEARNING_PAGINATION_DEFAULTS } from '../constants/learning.constants';

@Injectable()
export class LearningResourcesService {
  private readonly logger = new Logger(LearningResourcesService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Helper to slugify a title safely
   */
  private slugify(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /**
   * Helper to generate unique slug
   */
  private async generateUniqueSlug(title: string): Promise<string> {
    const baseSlug = this.slugify(title);
    let candidate = baseSlug || 'learning-resource';
    let counter = 1;

    while (await this.prisma.learningResource.findUnique({ where: { slug: candidate } })) {
      candidate = `${baseSlug}-${counter}`;
      counter++;
    }

    return candidate;
  }

  /**
   * Create a new curated learning resource
   */
  async create(userId: string, userRole: UserRole, dto: CreateLearningResourceDto) {
    // 1. Verify skill exists
    const skill = await this.prisma.skill.findUnique({
      where: { id: dto.skillId },
    });
    if (!skill) {
      throw new BadRequestException(`Skill with ID '${dto.skillId}' does not exist`);
    }

    // 2. Generate slug
    const slug = await this.generateUniqueSlug(dto.title);

    // 3. Auto-verify if created by SUPER_ADMIN
    const isVerified = userRole === UserRole.SUPER_ADMIN;

    const resource = await this.prisma.learningResource.create({
      data: {
        title: dto.title,
        slug,
        description: dto.description,
        url: dto.url,
        skillId: dto.skillId,
        resourceType: dto.resourceType || 'ARTICLE',
        difficulty: dto.difficulty || 'BEGINNER',
        targetProficiency: dto.targetProficiency || 'BEGINNER',
        estimatedMinutes: dto.estimatedMinutes || 30,
        provider: dto.provider,
        tags: dto.tags || [],
        authorRole: userRole,
        authorUserId: userId,
        isVerified,
        isPublished: true,
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

    return resource;
  }

  /**
   * Query & paginate published learning resources
   */
  async findAll(query: QueryLearningResourcesDto) {
    const page = query.page || LEARNING_PAGINATION_DEFAULTS.PAGE;
    const limit = Math.min(query.limit || LEARNING_PAGINATION_DEFAULTS.LIMIT, LEARNING_PAGINATION_DEFAULTS.MAX_LIMIT);
    const skip = (page - 1) * limit;

    const where: any = {
      isPublished: true,
    };

    if (query.skillId) {
      where.skillId = query.skillId;
    }

    if (query.resourceType) {
      where.resourceType = query.resourceType;
    }

    if (query.difficulty) {
      where.difficulty = query.difficulty;
    }

    if (query.targetProficiency) {
      where.targetProficiency = query.targetProficiency;
    }

    if (query.authorRole) {
      where.authorRole = query.authorRole;
    }

    if (query.isVerified !== undefined) {
      where.isVerified = query.isVerified;
    }

    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
        { provider: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [total, items] = await Promise.all([
      this.prisma.learningResource.count({ where }),
      this.prisma.learningResource.findMany({
        where,
        skip,
        take: limit,
        orderBy: [
          { isVerified: 'desc' },
          { rating: 'desc' },
          { createdAt: 'desc' },
        ],
        include: {
          skill: {
            select: {
              id: true,
              name: true,
              category: { select: { id: true, name: true } },
            },
          },
        },
      }),
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
   * Get single resource by ID or slug
   */
  async findById(idOrSlug: string) {
    let resource = await this.prisma.learningResource.findUnique({
      where: { id: idOrSlug },
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

    if (!resource) {
      resource = await this.prisma.learningResource.findUnique({
        where: { slug: idOrSlug },
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

    if (!resource) {
      throw new NotFoundException(`Learning resource '${idOrSlug}' not found`);
    }

    return resource;
  }

  /**
   * Update an authored learning resource with strict IDOR ownership check
   */
  async update(userId: string, userRole: UserRole, id: string, dto: UpdateLearningResourceDto) {
    const resource = await this.prisma.learningResource.findUnique({
      where: { id },
    });

    if (!resource) {
      throw new NotFoundException(`Learning resource with ID '${id}' not found`);
    }

    // Ownership check: only author or SUPER_ADMIN can edit
    if (resource.authorUserId !== userId && userRole !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('You do not have permission to edit this resource');
    }

    if (dto.skillId) {
      const skill = await this.prisma.skill.findUnique({ where: { id: dto.skillId } });
      if (!skill) throw new BadRequestException(`Skill with ID '${dto.skillId}' does not exist`);
    }

    const updated = await this.prisma.learningResource.update({
      where: { id },
      data: {
        ...(dto.title && { title: dto.title }),
        ...(dto.description && { description: dto.description }),
        ...(dto.url && { url: dto.url }),
        ...(dto.skillId && { skillId: dto.skillId }),
        ...(dto.resourceType && { resourceType: dto.resourceType }),
        ...(dto.difficulty && { difficulty: dto.difficulty }),
        ...(dto.targetProficiency && { targetProficiency: dto.targetProficiency }),
        ...(dto.estimatedMinutes !== undefined && { estimatedMinutes: dto.estimatedMinutes }),
        ...(dto.provider !== undefined && { provider: dto.provider }),
        ...(dto.tags && { tags: dto.tags }),
        ...(dto.isPublished !== undefined && { isPublished: dto.isPublished }),
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

    return updated;
  }

  /**
   * Delete an authored learning resource with IDOR ownership check
   */
  async delete(userId: string, userRole: UserRole, id: string) {
    const resource = await this.prisma.learningResource.findUnique({
      where: { id },
    });

    if (!resource) {
      throw new NotFoundException(`Learning resource with ID '${id}' not found`);
    }

    if (resource.authorUserId !== userId && userRole !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('You do not have permission to delete this resource');
    }

    await this.prisma.learningResource.delete({
      where: { id },
    });

    return { success: true, message: 'Resource deleted successfully' };
  }

  /**
   * Verify/Endorse a resource (Admins only)
   */
  async verify(id: string, isVerified: boolean) {
    const resource = await this.prisma.learningResource.findUnique({ where: { id } });
    if (!resource) {
      throw new NotFoundException(`Learning resource with ID '${id}' not found`);
    }

    return this.prisma.learningResource.update({
      where: { id },
      data: { isVerified },
      include: {
        skill: {
          select: { id: true, name: true },
        },
      },
    });
  }

  /**
   * Find resources authored by the authenticated user
   */
  async findMyResources(userId: string) {
    return this.prisma.learningResource.findMany({
      where: { authorUserId: userId },
      orderBy: { createdAt: 'desc' },
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
}

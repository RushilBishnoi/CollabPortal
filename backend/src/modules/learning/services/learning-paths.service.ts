import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { CreateLearningPathDto } from '../dto/create-learning-path.dto';
import { UpdateLearningPathDto } from '../dto/update-learning-path.dto';
import { QueryLearningPathsDto } from '../dto/query-learning-paths.dto';
import { UserRole, LearningPathStatus } from '@prisma/client';
import { LEARNING_PAGINATION_DEFAULTS } from '../constants/learning.constants';

@Injectable()
export class LearningPathsService {
  private readonly logger = new Logger(LearningPathsService.name);

  constructor(private readonly prisma: PrismaService) {}

  private slugify(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  private async generateUniqueSlug(title: string): Promise<string> {
    const baseSlug = this.slugify(title);
    let candidate = baseSlug || 'learning-path';
    let counter = 1;

    while (await this.prisma.learningPath.findUnique({ where: { slug: candidate } })) {
      candidate = `${baseSlug}-${counter}`;
      counter++;
    }

    return candidate;
  }

  /**
   * Create a structured learning path with items in a single transaction
   */
  async create(userId: string, userRole: UserRole, dto: CreateLearningPathDto) {
    // 1. If careerRoleId is specified, verify it exists
    if (dto.careerRoleId) {
      const careerRole = await this.prisma.careerRole.findUnique({
        where: { id: dto.careerRoleId },
      });
      if (!careerRole) {
        throw new BadRequestException(`CareerRole with ID '${dto.careerRoleId}' does not exist`);
      }
    }

    // 2. Validate items
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('Learning path must contain at least one learning resource item');
    }

    const resourceIds = dto.items.map((i) => i.resourceId);
    const uniqueResourceIds = new Set(resourceIds);
    if (uniqueResourceIds.size !== resourceIds.length) {
      throw new BadRequestException('Duplicate resources are not allowed in a single learning path');
    }

    const foundResources = await this.prisma.learningResource.findMany({
      where: { id: { in: resourceIds } },
      select: { id: true },
    });
    if (foundResources.length !== resourceIds.length) {
      throw new BadRequestException('One or more specified resource IDs do not exist');
    }

    // Ensure sequential ordering
    const sortedItems = [...dto.items].map((item, idx) => ({
      resourceId: item.resourceId,
      order: item.order || idx + 1,
      isMandatory: item.isMandatory !== undefined ? item.isMandatory : true,
      milestoneNotes: item.milestoneNotes,
    }));

    const orders = sortedItems.map((i) => i.order);
    const uniqueOrders = new Set(orders);
    if (uniqueOrders.size !== orders.length) {
      throw new BadRequestException('Item order indices must be unique within a learning path');
    }

    const slug = await this.generateUniqueSlug(dto.title);

    return this.prisma.$transaction(async (tx) => {
      const path = await tx.learningPath.create({
        data: {
          title: dto.title,
          slug,
          description: dto.description,
          careerRoleId: dto.careerRoleId,
          targetProficiency: dto.targetProficiency || 'INTERMEDIATE',
          status: dto.status || LearningPathStatus.PUBLISHED,
          estimatedHours: dto.estimatedHours || 10,
          authorRole: userRole,
          authorUserId: userId,
          items: {
            create: sortedItems.map((i) => ({
              resourceId: i.resourceId,
              order: i.order,
              isMandatory: i.isMandatory,
              milestoneNotes: i.milestoneNotes,
            })),
          },
        },
        include: {
          careerRole: {
            select: { id: true, title: true, slug: true, category: true },
          },
          items: {
            orderBy: { order: 'asc' },
            include: {
              resource: {
                include: {
                  skill: { select: { id: true, name: true, category: { select: { name: true } } } },
                },
              },
            },
          },
        },
      });

      return path;
    });
  }

  /**
   * Find all published learning paths with pagination
   */
  async findAll(query: QueryLearningPathsDto) {
    const page = query.page || LEARNING_PAGINATION_DEFAULTS.PAGE;
    const limit = Math.min(query.limit || LEARNING_PAGINATION_DEFAULTS.LIMIT, LEARNING_PAGINATION_DEFAULTS.MAX_LIMIT);
    const skip = (page - 1) * limit;

    const where: any = {
      status: query.status || LearningPathStatus.PUBLISHED,
    };

    if (query.careerRoleId) {
      where.careerRoleId = query.careerRoleId;
    }

    if (query.targetProficiency) {
      where.targetProficiency = query.targetProficiency;
    }

    if (query.authorRole) {
      where.authorRole = query.authorRole;
    }

    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [total, items] = await Promise.all([
      this.prisma.learningPath.count({ where }),
      this.prisma.learningPath.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ createdAt: 'desc' }],
        include: {
          careerRole: {
            select: { id: true, title: true, slug: true, category: true },
          },
          items: {
            orderBy: { order: 'asc' },
            include: {
              resource: {
                include: {
                  skill: { select: { id: true, name: true } },
                },
              },
            },
          },
          _count: {
            select: { enrollments: true, items: true },
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
   * Find single learning path by ID or slug
   */
  async findById(idOrSlug: string) {
    let path = await this.prisma.learningPath.findUnique({
      where: { id: idOrSlug },
      include: {
        careerRole: {
          select: { id: true, title: true, slug: true, category: true },
        },
        items: {
          orderBy: { order: 'asc' },
          include: {
            resource: {
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
        },
        _count: {
          select: { enrollments: true },
        },
      },
    });

    if (!path) {
      path = await this.prisma.learningPath.findUnique({
        where: { slug: idOrSlug },
        include: {
          careerRole: {
            select: { id: true, title: true, slug: true, category: true },
          },
          items: {
            orderBy: { order: 'asc' },
            include: {
              resource: {
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
          },
          _count: {
            select: { enrollments: true },
          },
        },
      });
    }

    if (!path) {
      throw new NotFoundException(`Learning path '${idOrSlug}' not found`);
    }

    return path;
  }

  /**
   * Update learning path with IDOR check
   */
  async update(userId: string, userRole: UserRole, id: string, dto: UpdateLearningPathDto) {
    const path = await this.prisma.learningPath.findUnique({ where: { id } });
    if (!path) throw new NotFoundException(`Learning path with ID '${id}' not found`);

    if (path.authorUserId !== userId && userRole !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('You do not have permission to edit this learning path');
    }

    if (dto.careerRoleId) {
      const careerRole = await this.prisma.careerRole.findUnique({ where: { id: dto.careerRoleId } });
      if (!careerRole) throw new BadRequestException(`CareerRole with ID '${dto.careerRoleId}' does not exist`);
    }

    return this.prisma.$transaction(async (tx) => {
      if (dto.items) {
        const resourceIds = dto.items.map((i) => i.resourceId);
        const uniqueResourceIds = new Set(resourceIds);
        if (uniqueResourceIds.size !== resourceIds.length) {
          throw new BadRequestException('Duplicate resources are not allowed in a single learning path');
        }

        const foundResources = await tx.learningResource.findMany({
          where: { id: { in: resourceIds } },
          select: { id: true },
        });
        if (foundResources.length !== resourceIds.length) {
          throw new BadRequestException('One or more specified resource IDs do not exist');
        }

        // Delete existing items and recreate
        await tx.learningPathItem.deleteMany({ where: { learningPathId: id } });

        const sortedItems = dto.items.map((item, idx) => ({
          resourceId: item.resourceId,
          order: item.order || idx + 1,
          isMandatory: item.isMandatory !== undefined ? item.isMandatory : true,
          milestoneNotes: item.milestoneNotes,
        }));

        await tx.learningPathItem.createMany({
          data: sortedItems.map((i) => ({
            learningPathId: id,
            resourceId: i.resourceId,
            order: i.order,
            isMandatory: i.isMandatory,
            milestoneNotes: i.milestoneNotes,
          })),
        });
      }

      const updated = await tx.learningPath.update({
        where: { id },
        data: {
          ...(dto.title && { title: dto.title }),
          ...(dto.description && { description: dto.description }),
          ...(dto.careerRoleId !== undefined && { careerRoleId: dto.careerRoleId }),
          ...(dto.targetProficiency && { targetProficiency: dto.targetProficiency }),
          ...(dto.estimatedHours !== undefined && { estimatedHours: dto.estimatedHours }),
          ...(dto.status && { status: dto.status }),
        },
        include: {
          careerRole: { select: { id: true, title: true, slug: true } },
          items: {
            orderBy: { order: 'asc' },
            include: {
              resource: {
                include: { skill: { select: { id: true, name: true } } },
              },
            },
          },
        },
      });

      return updated;
    });
  }

  /**
   * Delete learning path with IDOR check
   */
  async delete(userId: string, userRole: UserRole, id: string) {
    const path = await this.prisma.learningPath.findUnique({ where: { id } });
    if (!path) throw new NotFoundException(`Learning path with ID '${id}' not found`);

    if (path.authorUserId !== userId && userRole !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('You do not have permission to delete this learning path');
    }

    await this.prisma.learningPath.delete({ where: { id } });
    return { success: true, message: 'Learning path deleted successfully' };
  }

  /**
   * Find paths authored by current user
   */
  async findMyPaths(userId: string) {
    return this.prisma.learningPath.findMany({
      where: { authorUserId: userId },
      orderBy: { createdAt: 'desc' },
      include: {
        careerRole: { select: { id: true, title: true, slug: true } },
        items: {
          orderBy: { order: 'asc' },
          include: {
            resource: {
              include: { skill: { select: { id: true, name: true } } },
            },
          },
        },
        _count: { select: { enrollments: true } },
      },
    });
  }
}

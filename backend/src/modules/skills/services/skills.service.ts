import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';

/**
 * Proficiency level numeric mapping — centralized source of truth.
 * Used by the future matching and skill-gap engine.
 * BEGINNER=1, INTERMEDIATE=2, ADVANCED=3, EXPERT=4
 */
export const PROFICIENCY_SCORE_MAP: Record<string, number> = {
  BEGINNER: 1,
  INTERMEDIATE: 2,
  ADVANCED: 3,
  EXPERT: 4,
};

@Injectable()
export class SkillsService {
  private readonly logger = new Logger(SkillsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * List all active skill categories, including their parent-child hierarchy.
   */
  async listCategories() {
    return this.prisma.skillCategory.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        description: true,
        parentId: true,
        children: {
          where: { isActive: true },
          select: { id: true, name: true, description: true, parentId: true },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * List active skills, optionally filtered by category.
   */
  async listSkills(categoryId?: string) {
    return this.prisma.skill.findMany({
      where: {
        isActive: true,
        ...(categoryId && { categoryId }),
      },
      select: {
        id: true,
        name: true,
        description: true,
        categoryId: true,
        category: { select: { id: true, name: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Search active skills by name fragment (deterministic substring match).
   */
  async searchSkills(query: string) {
    if (!query || query.trim().length < 2) {
      return [];
    }
    return this.prisma.skill.findMany({
      where: {
        isActive: true,
        name: { contains: query.trim(), mode: 'insensitive' },
      },
      select: {
        id: true,
        name: true,
        description: true,
        categoryId: true,
        category: { select: { id: true, name: true } },
      },
      take: 20,
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Get a single skill by ID.
   */
  async getSkillById(skillId: string) {
    const skill = await this.prisma.skill.findUnique({
      where: { id: skillId },
      select: {
        id: true,
        name: true,
        description: true,
        isActive: true,
        category: { select: { id: true, name: true } },
      },
    });

    if (!skill) {
      throw new NotFoundException(`Skill with ID '${skillId}' not found`);
    }

    return skill;
  }
}

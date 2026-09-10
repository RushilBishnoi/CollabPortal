import {
  Injectable,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { SkillGapService } from '../../skill-gap/services/skill-gap.service';
import { ESTIMATED_HOURS_PER_SKILL_LEVEL } from '../constants/learning.constants';

export interface SkillRemediationItem {
  skillId: string;
  skillName: string;
  categoryName?: string;
  currentProficiency: string | null;
  targetProficiency: string;
  status: 'MISSING' | 'DEFICIT';
  gapLevels: number;
  estimatedHours: number;
  resources: any[];
  linkedAssessment: {
    id: string;
    title: string;
    passingScore: number;
    durationMinutes: number;
  } | null;
}

export interface CareerRemediationPlan {
  careerRole: {
    id: string;
    title: string;
    slug: string;
    category: string;
  };
  overallCompatibilityScore: number;
  totalDeficitSkillsCount: number;
  totalEstimatedRemediationHours: number;
  skillRemediations: SkillRemediationItem[];
  recommendedPaths: any[];
}

@Injectable()
export class LearningRemediationService {
  private readonly logger = new Logger(LearningRemediationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly skillGapService: SkillGapService,
  ) {}

  /**
   * Deterministically generate a learning remediation plan for a student's skill gaps
   */
  async getRemediationForCareerRole(userId: string, roleIdOrSlug: string): Promise<CareerRemediationPlan> {
    // 1. Get evaluated skill gap analysis from Phase 7 SkillGapService
    const matchResult = await this.skillGapService.getRoleSkillGap(userId, roleIdOrSlug);

    // Filter only deficit and missing skills
    const gapRequirements = matchResult.skillRequirements.filter(
      (r) => r.status === 'DEFICIT' || r.status === 'MISSING',
    );

    const deficitSkillIds = gapRequirements.map((r) => r.skillId);

    // 2. Fetch published resources and active assessments for these deficit skills
    const [resources, assessments, paths] = await Promise.all([
      this.prisma.learningResource.findMany({
        where: {
          skillId: { in: deficitSkillIds },
          isPublished: true,
        },
        include: {
          skill: { select: { id: true, name: true } },
        },
        orderBy: [
          { isVerified: 'desc' },
          { rating: 'desc' },
          { estimatedMinutes: 'asc' },
        ],
      }),
      this.prisma.assessment.findMany({
        where: {
          skillId: { in: deficitSkillIds },
          isActive: true,
        },
        select: {
          id: true,
          skillId: true,
          title: true,
          passingScore: true,
          durationMinutes: true,
        },
      }),
      this.prisma.learningPath.findMany({
        where: {
          OR: [
            { careerRoleId: matchResult.careerRole.id },
            { items: { some: { resource: { skillId: { in: deficitSkillIds } } } } },
          ],
          status: 'PUBLISHED',
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
          _count: { select: { enrollments: true, items: true } },
        },
      }),
    ]);

    // Group resources by skillId
    const resourcesBySkill = new Map<string, any[]>();
    for (const res of resources) {
      if (!resourcesBySkill.has(res.skillId)) {
        resourcesBySkill.set(res.skillId, []);
      }
      resourcesBySkill.get(res.skillId)!.push(res);
    }

    // Group assessments by skillId
    const assessmentsBySkill = new Map<string, any>();
    for (const ass of assessments) {
      if (!assessmentsBySkill.has(ass.skillId)) {
        assessmentsBySkill.set(ass.skillId, ass);
      }
    }

    let totalEstimatedHours = 0;
    const skillRemediations: SkillRemediationItem[] = [];

    for (const req of gapRequirements) {
      const gapLevels = req.gapLevels || 1;
      const estimatedHours = gapLevels * ESTIMATED_HOURS_PER_SKILL_LEVEL;
      totalEstimatedHours += estimatedHours;

      const matchedResources = resourcesBySkill.get(req.skillId) || [];
      const linkedAssessment = assessmentsBySkill.get(req.skillId) || null;

      skillRemediations.push({
        skillId: req.skillId,
        skillName: req.skillName,
        categoryName: req.categoryName,
        currentProficiency: req.studentProficiency,
        targetProficiency: req.requiredProficiency,
        status: req.status as 'MISSING' | 'DEFICIT',
        gapLevels,
        estimatedHours,
        resources: matchedResources,
        linkedAssessment: linkedAssessment
          ? {
              id: linkedAssessment.id,
              title: linkedAssessment.title,
              passingScore: linkedAssessment.passingScore,
              durationMinutes: linkedAssessment.durationMinutes,
            }
          : null,
      });
    }

    return {
      careerRole: matchResult.careerRole,
      overallCompatibilityScore: matchResult.overallScore,
      totalDeficitSkillsCount: gapRequirements.length,
      totalEstimatedRemediationHours: totalEstimatedHours,
      skillRemediations,
      recommendedPaths: paths,
    };
  }

  /**
   * Get general student-wide remediation overview across their declared career interests
   */
  async getStudentGeneralRemediation(userId: string) {
    const readiness = await this.skillGapService.getStudentReadinessOverview(userId);
    const topRoles = readiness.topRecommendations;

    if (!topRoles || topRoles.length === 0) {
      return {
        hasTargetRoles: false,
        plans: [],
      };
    }

    // Generate plans for top 2 recommended roles
    const plans = await Promise.all(
      topRoles.slice(0, 2).map((role) =>
        this.getRemediationForCareerRole(userId, role.careerRole.id),
      ),
    );

    return {
      hasTargetRoles: true,
      plans,
    };
  }
}

import {
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import {
  MATCHING_WEIGHTS,
  PROFICIENCY_NUMERIC_MAP,
  CAREER_INTEREST_SCORES,
  ACADEMIC_READINESS_CONFIG,
  PRACTICAL_EXPERIENCE_CONFIG,
} from '../config/career-matching.config';
import { VerificationStatus } from '@prisma/client';

export type SkillGapStatus = 'SATISFIED' | 'DEFICIT' | 'MISSING';

export interface EvaluatedSkillRequirement {
  skillId: string;
  skillName: string;
  categoryName?: string;
  requiredProficiency: string;
  requiredProficiencyValue: number;
  studentProficiency: string | null;
  studentProficiencyValue: number;
  verificationStatus: VerificationStatus | null;
  isVerified: boolean;
  status: SkillGapStatus;
  gapLevels: number;
  weight: number;
  isMandatory: boolean;
}

export interface ScoreComponentBreakdown {
  score: number;
  max: number;
  percentage: number;
  explanation: string;
}

export interface CareerMatchResult {
  careerRole: {
    id: string;
    title: string;
    slug: string;
    category: string;
    description: string | null;
    minExperienceYears: number;
  };
  overallScore: number;
  breakdown: {
    skillCompatibility: ScoreComponentBreakdown;
    verificationConfidence: ScoreComponentBreakdown;
    careerInterest: ScoreComponentBreakdown;
    academicReadiness: ScoreComponentBreakdown;
    practicalExperience: ScoreComponentBreakdown;
  };
  skillsSummary: {
    totalRequired: number;
    satisfiedCount: number;
    deficitCount: number;
    missingCount: number;
    verifiedCount: number;
  };
  skillRequirements: EvaluatedSkillRequirement[];
}

@Injectable()
export class SkillGapService {
  private readonly logger = new Logger(SkillGapService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Helper to round numbers to 1 decimal place deterministically.
   */
  private round1(val: number): number {
    return Math.round(val * 10) / 10;
  }

  /**
   * Helper to resolve full student profile with skills, projects, certifications, experiences.
   */
  private async resolveStudentProfile(userId: string) {
    let profile = await this.prisma.studentProfile.findUnique({
      where: { userId },
      include: {
        studentSkills: {
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
        projects: true,
        certifications: true,
        experiences: true,
      },
    });

    if (!profile) {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (!user) throw new NotFoundException('User not found');

      profile = await this.prisma.studentProfile.create({
        data: { userId, fullName: user.email.split('@')[0] || 'Student' },
        include: {
          studentSkills: {
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
          projects: true,
          certifications: true,
          experiences: true,
        },
      });
    }

    return profile;
  }

  /**
   * Phase 4 Profile Completeness Calculation (0 - 100%)
   */
  private calculateProfileCompleteness(profile: any): number {
    let basicInfo = 0;
    if (profile.fullName && profile.fullName.trim() !== '') basicInfo += 5;
    if (profile.phoneNumber && profile.phoneNumber.trim() !== '') basicInfo += 5;
    if (profile.bio && profile.bio.trim() !== '') basicInfo += 5;
    if (profile.avatarUrl && profile.avatarUrl.trim() !== '') basicInfo += 5;

    let education = 0;
    if (profile.degree && profile.degree.trim() !== '') education += 10;
    if (profile.department && profile.department.trim() !== '') education += 10;
    if (profile.graduationYear) education += 5;
    if (profile.institutionId) education += 5;

    let careerPreferences = 0;
    if (profile.careerInterests && profile.careerInterests.length > 0) careerPreferences += 7;
    if (profile.preferredRoles && profile.preferredRoles.length > 0) careerPreferences += 7;
    if (profile.preferredLocations && profile.preferredLocations.length > 0) careerPreferences += 6;

    let projectsAndCertifications = 0;
    if (profile.projects && profile.projects.length > 0) projectsAndCertifications += 15;
    if (profile.certifications && profile.certifications.length > 0) projectsAndCertifications += 15;

    return Math.min(100, basicInfo + education + careerPreferences + projectsAndCertifications);
  }

  /**
   * Deterministic Evaluation of a student against a single CareerRole.
   */
  public evaluateRoleMatch(profile: any, role: any): CareerMatchResult {
    const studentSkillsMap = new Map<string, any>();
    for (const ss of profile.studentSkills || []) {
      studentSkillsMap.set(ss.skillId, ss);
    }

    const evaluatedRequirements: EvaluatedSkillRequirement[] = [];
    let totalWeightedSkillMatch = 0;
    let totalSkillWeight = 0;
    let satisfiedCount = 0;
    let deficitCount = 0;
    let missingCount = 0;
    let verifiedCount = 0;

    for (const req of role.skills || []) {
      const weight = req.weight ?? 1.0;
      totalSkillWeight += weight;

      const reqLevelVal = (PROFICIENCY_NUMERIC_MAP as Record<string, number>)[req.requiredProficiency] || 1;
      const studentSkill = studentSkillsMap.get(req.skillId);

      if (!studentSkill) {
        // Missing skill
        missingCount++;
        evaluatedRequirements.push({
          skillId: req.skillId,
          skillName: req.skill.name,
          categoryName: req.skill.category?.name,
          requiredProficiency: req.requiredProficiency,
          requiredProficiencyValue: reqLevelVal,
          studentProficiency: null,
          studentProficiencyValue: 0,
          verificationStatus: null,
          isVerified: false,
          status: 'MISSING',
          gapLevels: reqLevelVal,
          weight,
          isMandatory: req.isMandatory,
        });
      } else {
        const studLevelVal = (PROFICIENCY_NUMERIC_MAP as Record<string, number>)[studentSkill.proficiency] || 1;
        const isVerified = studentSkill.verificationStatus === VerificationStatus.VERIFIED;
        if (isVerified) verifiedCount++;

        const rawMatchRatio = Math.min(1.0, studLevelVal / reqLevelVal);
        totalWeightedSkillMatch += rawMatchRatio * weight;

        const isSatisfied = studLevelVal >= reqLevelVal;
        if (isSatisfied) {
          satisfiedCount++;
        } else {
          deficitCount++;
        }

        const gapLevels = Math.max(0, reqLevelVal - studLevelVal);

        evaluatedRequirements.push({
          skillId: req.skillId,
          skillName: req.skill.name,
          categoryName: req.skill.category?.name,
          requiredProficiency: req.requiredProficiency,
          requiredProficiencyValue: reqLevelVal,
          studentProficiency: studentSkill.proficiency,
          studentProficiencyValue: studLevelVal,
          verificationStatus: studentSkill.verificationStatus,
          isVerified,
          status: isSatisfied ? 'SATISFIED' : 'DEFICIT',
          gapLevels,
          weight,
          isMandatory: req.isMandatory,
        });
      }
    }

    const totalRequired = role.skills?.length || 0;

    // ─── Component 1: Skill Compatibility (Max 50.0) ──────────────────────────
    const skillRatio = totalSkillWeight > 0 ? totalWeightedSkillMatch / totalSkillWeight : 0;
    const skillScore = this.round1(skillRatio * MATCHING_WEIGHTS.SKILL_COMPATIBILITY_MAX);
    const skillPercentage = this.round1((skillScore / MATCHING_WEIGHTS.SKILL_COMPATIBILITY_MAX) * 100);

    // ─── Component 2: Verification Confidence (Max 15.0) ──────────────────────
    const verifRatio = totalRequired > 0 ? verifiedCount / totalRequired : 0;
    const verifScore = this.round1(verifRatio * MATCHING_WEIGHTS.VERIFICATION_CONFIDENCE_MAX);
    const verifPercentage = this.round1((verifScore / MATCHING_WEIGHTS.VERIFICATION_CONFIDENCE_MAX) * 100);

    // ─── Component 3: Career Interest Alignment (Max 15.0) ────────────────────
    let interestScore: number = CAREER_INTEREST_SCORES.NO_INTEREST_DECLARED;
    let interestExplanation = 'No career preferences declared';

    const preferredRoles = (profile.preferredRoles || []).map((r: string) => r.toLowerCase().trim());
    const careerInterests = (profile.careerInterests || []).map((c: string) => c.toLowerCase().trim());
    const roleTitleLower = role.title.toLowerCase().trim();
    const roleSlugLower = role.slug.toLowerCase().trim();
    const roleCatLower = role.category.toLowerCase().trim();

    const isDirectMatch =
      preferredRoles.some((pr: string) => pr.includes(roleTitleLower) || roleTitleLower.includes(pr) || pr === roleSlugLower) ||
      careerInterests.some((ci: string) => ci.includes(roleTitleLower) || roleTitleLower.includes(ci));

    const isCategoryMatch =
      careerInterests.some((ci: string) => ci.includes(roleCatLower) || roleCatLower.includes(ci)) ||
      preferredRoles.some((pr: string) => pr.includes(roleCatLower) || roleCatLower.includes(pr));

    if (isDirectMatch) {
      interestScore = CAREER_INTEREST_SCORES.DIRECT_ROLE_MATCH;
      interestExplanation = 'Role matches your declared preferred roles / career interests';
    } else if (isCategoryMatch) {
      interestScore = CAREER_INTEREST_SCORES.CATEGORY_DOMAIN_MATCH;
      interestExplanation = `Role domain (${role.category}) matches your career interests`;
    } else if (preferredRoles.length > 0 || careerInterests.length > 0) {
      interestScore = CAREER_INTEREST_SCORES.GENERAL_INTEREST_DECLARED;
      interestExplanation = 'General career interests declared (partial domain alignment)';
    }

    interestScore = this.round1(interestScore);
    const interestPercentage = this.round1((interestScore / MATCHING_WEIGHTS.CAREER_INTEREST_MAX) * 100);

    // ─── Component 4: Academic Standing & Profile Completeness (Max 10.0) ──────
    const completeness = this.calculateProfileCompleteness(profile);
    const compSubScore = (completeness / 100) * ACADEMIC_READINESS_CONFIG.PROFILE_COMPLETENESS_MAX;

    let cgpaSubScore: number = ACADEMIC_READINESS_CONFIG.CGPA_TIERS.NONE.points;
    if (profile.cgpa !== null && profile.cgpa !== undefined) {
      if (profile.cgpa >= ACADEMIC_READINESS_CONFIG.CGPA_TIERS.HIGH.minCgpa) {
        cgpaSubScore = ACADEMIC_READINESS_CONFIG.CGPA_TIERS.HIGH.points;
      } else if (profile.cgpa >= ACADEMIC_READINESS_CONFIG.CGPA_TIERS.ABOVE_AVG.minCgpa) {
        cgpaSubScore = ACADEMIC_READINESS_CONFIG.CGPA_TIERS.ABOVE_AVG.points;
      } else if (profile.cgpa >= ACADEMIC_READINESS_CONFIG.CGPA_TIERS.AVERAGE.minCgpa) {
        cgpaSubScore = ACADEMIC_READINESS_CONFIG.CGPA_TIERS.AVERAGE.points;
      } else {
        cgpaSubScore = ACADEMIC_READINESS_CONFIG.CGPA_TIERS.ACTIVE_DEGREE.points;
      }
    } else if (profile.degree) {
      cgpaSubScore = ACADEMIC_READINESS_CONFIG.CGPA_TIERS.ACTIVE_DEGREE.points;
    }

    const academicScore = this.round1(
      Math.min(MATCHING_WEIGHTS.ACADEMIC_READINESS_MAX, compSubScore + cgpaSubScore),
    );
    const academicPercentage = this.round1((academicScore / MATCHING_WEIGHTS.ACADEMIC_READINESS_MAX) * 100);

    // ─── Component 5: Projects & Practical Experience (Max 10.0) ──────────────
    const requiredSkillNames = new Set<string>(
      (role.skills || []).map((s: any) => s.skill.name.toLowerCase().trim()),
    );

    let matchingProjectsCount = 0;
    for (const proj of profile.projects || []) {
      const projTechs = (proj.technologies || []).map((t: string) => t.toLowerCase().trim());
      const hasOverlap = projTechs.some((t: string) =>
        Array.from(requiredSkillNames).some((rs: string) => rs.includes(t) || t.includes(rs)),
      );
      if (hasOverlap) {
        matchingProjectsCount++;
      }
    }

    let projSubScore: number = PRACTICAL_EXPERIENCE_CONFIG.PROJECT_TIERS.NONE;
    if (matchingProjectsCount >= 2) {
      projSubScore = PRACTICAL_EXPERIENCE_CONFIG.PROJECT_TIERS.TWO_OR_MORE_DOMAIN;
    } else if (matchingProjectsCount === 1) {
      projSubScore = PRACTICAL_EXPERIENCE_CONFIG.PROJECT_TIERS.ONE_DOMAIN;
    } else if ((profile.projects || []).length > 0) {
      projSubScore = PRACTICAL_EXPERIENCE_CONFIG.PROJECT_TIERS.GENERAL_PROJECTS;
    }

    let workSubScore: number = PRACTICAL_EXPERIENCE_CONFIG.WORK_TIERS.NONE;
    if ((profile.experiences || []).length > 0) {
      workSubScore = PRACTICAL_EXPERIENCE_CONFIG.WORK_TIERS.INTERNSHIP_OR_JOB;
    } else if ((profile.certifications || []).length > 0) {
      workSubScore = PRACTICAL_EXPERIENCE_CONFIG.WORK_TIERS.CERTIFICATION_ONLY;
    }

    const experienceScore = this.round1(
      Math.min(MATCHING_WEIGHTS.PRACTICAL_EXPERIENCE_MAX, projSubScore + workSubScore),
    );
    const experiencePercentage = this.round1(
      (experienceScore / MATCHING_WEIGHTS.PRACTICAL_EXPERIENCE_MAX) * 100,
    );

    // ─── Final Score & Invariant Summation ─────────────────────────────────────
    const overallScore = this.round1(
      Math.min(100.0, Math.max(0.0, skillScore + verifScore + interestScore + academicScore + experienceScore)),
    );

    return {
      careerRole: {
        id: role.id,
        title: role.title,
        slug: role.slug,
        category: role.category,
        description: role.description,
        minExperienceYears: role.minExperienceYears,
      },
      overallScore,
      breakdown: {
        skillCompatibility: {
          score: skillScore,
          max: MATCHING_WEIGHTS.SKILL_COMPATIBILITY_MAX,
          percentage: skillPercentage,
          explanation: `${satisfiedCount} of ${totalRequired} required skills satisfied at target level (${deficitCount} deficits, ${missingCount} missing)`,
        },
        verificationConfidence: {
          score: verifScore,
          max: MATCHING_WEIGHTS.VERIFICATION_CONFIDENCE_MAX,
          percentage: verifPercentage,
          explanation: `${verifiedCount} of ${totalRequired} required skills officially verified via Phase 6 assessments`,
        },
        careerInterest: {
          score: interestScore,
          max: MATCHING_WEIGHTS.CAREER_INTEREST_MAX,
          percentage: interestPercentage,
          explanation: interestExplanation,
        },
        academicReadiness: {
          score: academicScore,
          max: MATCHING_WEIGHTS.ACADEMIC_READINESS_MAX,
          percentage: academicPercentage,
          explanation: `Profile is ${completeness}% complete${profile.cgpa ? `, CGPA: ${profile.cgpa}/10` : ''}`,
        },
        practicalExperience: {
          score: experienceScore,
          max: MATCHING_WEIGHTS.PRACTICAL_EXPERIENCE_MAX,
          percentage: experiencePercentage,
          explanation: `${matchingProjectsCount} domain project(s), ${profile.experiences?.length || 0} internship/work experience(s)`,
        },
      },
      skillsSummary: {
        totalRequired,
        satisfiedCount,
        deficitCount,
        missingCount,
        verifiedCount,
      },
      skillRequirements: evaluatedRequirements,
    };
  }

  /**
   * Evaluate and rank career roles for an already-resolved student profile.
   */
  async getRecommendedRolesForProfile(profile: any) {
    const roles = await this.prisma.careerRole.findMany({
      where: { isActive: true },
      include: {
        skills: {
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
    });

    const recommendations = roles.map((role) => this.evaluateRoleMatch(profile, role));

    // Sort descending by overallScore, then by satisfied skills count
    recommendations.sort((a, b) => {
      if (b.overallScore !== a.overallScore) {
        return b.overallScore - a.overallScore;
      }
      return b.skillsSummary.satisfiedCount - a.skillsSummary.satisfiedCount;
    });

    return recommendations;
  }

  /**
   * Get all active career roles ranked by compatibility for authenticated student.
   */
  async getRecommendedRoles(userId: string) {
    const profile = await this.resolveStudentProfile(userId);
    return this.getRecommendedRolesForProfile(profile);
  }

  /**
   * Get deep-dive skill gap analysis for a specific career role.
   */
  async getRoleSkillGap(userId: string, roleIdOrSlug: string) {
    const profile = await this.resolveStudentProfile(userId);

    let role = await this.prisma.careerRole.findUnique({
      where: { id: roleIdOrSlug },
      include: {
        skills: {
          include: {
            skill: {
              select: {
                id: true,
                name: true,
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
        where: { slug: roleIdOrSlug },
        include: {
          skills: {
            include: {
              skill: {
                select: {
                  id: true,
                  name: true,
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
      throw new NotFoundException(`Career role '${roleIdOrSlug}' not found`);
    }

    return this.evaluateRoleMatch(profile, role);
  }

  /**
   * Get overall Student Skill Readiness Dashboard summary.
   */
  async getStudentReadinessOverview(userId: string) {
    const profile = await this.resolveStudentProfile(userId);
    const recommendations = await this.getRecommendedRolesForProfile(profile);

    const verifiedSkills = profile.studentSkills.filter(
      (s) => s.verificationStatus === VerificationStatus.VERIFIED,
    );
    const pendingSkills = profile.studentSkills.filter(
      (s) => s.verificationStatus === VerificationStatus.PENDING,
    );

    // Aggregate skills requiring improvement across top 3 target roles
    const topRoles = recommendations.slice(0, 3);
    const skillsToImproveMap = new Map<string, any>();
    const missingSkillsMap = new Map<string, any>();

    for (const rec of topRoles) {
      for (const req of rec.skillRequirements) {
        if (req.status === 'DEFICIT') {
          skillsToImproveMap.set(req.skillId, {
            skillId: req.skillId,
            skillName: req.skillName,
            currentProficiency: req.studentProficiency,
            targetProficiency: req.requiredProficiency,
            gapLevels: req.gapLevels,
            roleTitle: rec.careerRole.title,
          });
        } else if (req.status === 'MISSING') {
          missingSkillsMap.set(req.skillId, {
            skillId: req.skillId,
            skillName: req.skillName,
            targetProficiency: req.requiredProficiency,
            roleTitle: rec.careerRole.title,
          });
        }
      }
    }

    return {
      profileSummary: {
        studentProfileId: profile.id,
        fullName: profile.fullName,
        degree: profile.degree,
        department: profile.department,
        totalAcquiredSkills: profile.studentSkills.length,
        verifiedSkillsCount: verifiedSkills.length,
        pendingSkillsCount: pendingSkills.length,
        profileCompleteness: this.calculateProfileCompleteness(profile),
      },
      verifiedSkills: verifiedSkills.map((s) => ({
        id: s.id,
        skillId: s.skillId,
        name: s.skill.name,
        category: s.skill.category?.name,
        proficiency: s.proficiency,
        score: s.score,
        lastAssessedAt: s.lastAssessedAt,
      })),
      pendingSkills: pendingSkills.map((s) => ({
        id: s.id,
        skillId: s.skillId,
        name: s.skill.name,
        category: s.skill.category?.name,
        proficiency: s.proficiency,
      })),
      skillsToImprove: Array.from(skillsToImproveMap.values()),
      missingCriticalSkills: Array.from(missingSkillsMap.values()),
      topRecommendations: recommendations.slice(0, 3),
    };
  }
}

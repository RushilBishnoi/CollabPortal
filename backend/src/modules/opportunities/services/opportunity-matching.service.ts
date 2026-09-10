import {
  Injectable,
  Inject,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import {
  OPPORTUNITY_MATCHING_WEIGHTS,
  PROFICIENCY_NUMERIC_MAP,
  LOCATION_MATCH_SCORES,
  CAREER_INTEREST_SCORES,
  ACADEMIC_READINESS_CONFIG,
} from '../config/opportunity-matching.config';
import { OpportunityQueryDto } from '../dto/opportunity-query.dto';
import { VerificationStatus, OpportunityStatus } from '@prisma/client';

export type SkillRequirementStatus = 'SATISFIED' | 'DEFICIT' | 'MISSING';

export interface EvaluatedOpportunitySkill {
  skillId: string;
  skillName: string;
  categoryName?: string;
  requiredProficiency: string;
  requiredProficiencyValue: number;
  studentProficiency: string | null;
  studentProficiencyValue: number;
  verificationStatus: VerificationStatus | null;
  isVerified: boolean;
  status: SkillRequirementStatus;
  gapLevels: number;
  weight: number;
  isMandatory: boolean;
}

export interface EligibilityEvaluation {
  isEligible: boolean;
  checks: {
    cgpa: {
      passed: boolean;
      required: number | null;
      actual: number | null;
      message: string;
    };
    graduationYear: {
      passed: boolean;
      minYear: number | null;
      maxYear: number | null;
      actual: number | null;
      message: string;
    };
    department: {
      passed: boolean;
      allowedDepartments: string[];
      actual: string | null;
      message: string;
    };
  };
  failureReasons: string[];
}

export interface ScoreComponentBreakdown {
  score: number;
  max: number;
  percentage: number;
  explanation: string;
}

export interface OpportunityMatchResult {
  opportunity: {
    id: string;
    title: string;
    slug: string;
    opportunityType: string;
    status: string;
    location: string;
    isRemote: boolean;
    stipend: number | null;
    stipendCurrency: string;
    stipendPeriod: string;
    deadline: Date | null;
    positionsCount: number;
    description: string;
    company: {
      id: string;
      name: string;
      industryType: string;
      headquarters: string | null;
      website: string | null;
      isVerified: boolean;
    };
    careerRole?: {
      id: string;
      title: string;
      category: string;
    } | null;
  };
  overallScore: number;
  eligibility: EligibilityEvaluation;
  breakdown: {
    skillCompatibility: ScoreComponentBreakdown;
    verificationConfidence: ScoreComponentBreakdown;
    careerInterest: ScoreComponentBreakdown;
    academicReadiness: ScoreComponentBreakdown;
    locationPreference: ScoreComponentBreakdown;
  };
  skillsSummary: {
    totalRequired: number;
    satisfiedCount: number;
    deficitCount: number;
    missingCount: number;
    verifiedCount: number;
  };
  skillRequirements: EvaluatedOpportunitySkill[];
}

@Injectable()
export class OpportunityMatchingService {
  private readonly logger = new Logger(OpportunityMatchingService.name);

  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  private round1(val: number): number {
    return Math.round(val * 10) / 10;
  }

  /**
   * Helper to resolve full student profile with skills, projects, and education.
   */
  async resolveStudentProfile(userId: string) {
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
   * Calculate Profile Completeness (Phase 4 standard).
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
   * Deterministic Hard Eligibility Check (Separate from Score).
   */
  public checkEligibility(studentProfile: any, opportunity: any): EligibilityEvaluation {
    const failureReasons: string[] = [];

    // 1. CGPA Check
    let cgpaPassed = true;
    let cgpaMessage = 'CGPA criteria satisfied';
    if (opportunity.minCgpa !== null && opportunity.minCgpa !== undefined) {
      if (studentProfile.cgpa === null || studentProfile.cgpa === undefined) {
        cgpaPassed = false;
        cgpaMessage = `Minimum CGPA of ${opportunity.minCgpa} required (No CGPA recorded on profile)`;
        failureReasons.push(cgpaMessage);
      } else if (studentProfile.cgpa < opportunity.minCgpa) {
        cgpaPassed = false;
        cgpaMessage = `Your CGPA (${studentProfile.cgpa}) is below minimum requirement of ${opportunity.minCgpa}`;
        failureReasons.push(cgpaMessage);
      } else {
        cgpaMessage = `Your CGPA (${studentProfile.cgpa}) meets minimum requirement (${opportunity.minCgpa})`;
      }
    }

    // 2. Graduation Year Check
    let gradYearPassed = true;
    let gradYearMessage = 'Graduation year criteria satisfied';
    const minYear = opportunity.minGraduationYear;
    const maxYear = opportunity.maxGraduationYear;
    if (minYear || maxYear) {
      if (!studentProfile.graduationYear) {
        gradYearPassed = false;
        gradYearMessage = 'Graduation year required by opportunity but not recorded on profile';
        failureReasons.push(gradYearMessage);
      } else if (minYear && studentProfile.graduationYear < minYear) {
        gradYearPassed = false;
        gradYearMessage = `Graduation year (${studentProfile.graduationYear}) is earlier than eligible batch (${minYear})`;
        failureReasons.push(gradYearMessage);
      } else if (maxYear && studentProfile.graduationYear > maxYear) {
        gradYearPassed = false;
        gradYearMessage = `Graduation year (${studentProfile.graduationYear}) is later than eligible batch (${maxYear})`;
        failureReasons.push(gradYearMessage);
      } else {
        gradYearMessage = `Your graduation year (${studentProfile.graduationYear}) is eligible`;
      }
    }

    // 3. Department Check
    let deptPassed = true;
    let deptMessage = 'Department criteria satisfied';
    const allowedDepts: string[] = opportunity.eligibleDepartments || [];
    if (allowedDepts.length > 0) {
      const studentDept = (studentProfile.department || '').toLowerCase().trim();
      const isAllowed = allowedDepts.some(
        (d: string) => studentDept.includes(d.toLowerCase().trim()) || d.toLowerCase().trim().includes(studentDept),
      );
      if (!studentProfile.department) {
        deptPassed = false;
        deptMessage = `Specific department required (${allowedDepts.join(', ')}) but none recorded on profile`;
        failureReasons.push(deptMessage);
      } else if (!isAllowed) {
        deptPassed = false;
        deptMessage = `Department (${studentProfile.department}) is not in eligible departments list (${allowedDepts.join(', ')})`;
        failureReasons.push(deptMessage);
      } else {
        deptMessage = `Your department (${studentProfile.department}) is eligible`;
      }
    }

    const isEligible = cgpaPassed && gradYearPassed && deptPassed;

    return {
      isEligible,
      checks: {
        cgpa: {
          passed: cgpaPassed,
          required: opportunity.minCgpa ?? null,
          actual: studentProfile.cgpa ?? null,
          message: cgpaMessage,
        },
        graduationYear: {
          passed: gradYearPassed,
          minYear: minYear ?? null,
          maxYear: maxYear ?? null,
          actual: studentProfile.graduationYear ?? null,
          message: gradYearMessage,
        },
        department: {
          passed: deptPassed,
          allowedDepartments: allowedDepts,
          actual: studentProfile.department ?? null,
          message: deptMessage,
        },
      },
      failureReasons,
    };
  }

  /**
   * Deterministic Opportunity Match Evaluation (0-100%).
   */
  public evaluateOpportunityMatch(studentProfile: any, opportunity: any): OpportunityMatchResult {
    const studentSkillsMap = new Map<string, any>();
    for (const ss of studentProfile.studentSkills || []) {
      studentSkillsMap.set(ss.skillId, ss);
    }

    const evaluatedRequirements: EvaluatedOpportunitySkill[] = [];
    let totalWeightedSkillMatch = 0;
    let totalSkillWeight = 0;
    let satisfiedCount = 0;
    let deficitCount = 0;
    let missingCount = 0;
    let verifiedCount = 0;

    for (const req of opportunity.skills || []) {
      const weight = req.weight ?? 1.0;
      totalSkillWeight += weight;

      const reqLevelVal = (PROFICIENCY_NUMERIC_MAP as Record<string, number>)[req.requiredProficiency] || 1;
      const studentSkill = studentSkillsMap.get(req.skillId);

      if (!studentSkill) {
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

    const totalRequired = opportunity.skills?.length || 0;

    // ─── Component 1: Skill Compatibility (Max 50.0) ──────────────────────────
    const skillRatio = totalSkillWeight > 0 ? totalWeightedSkillMatch / totalSkillWeight : 1.0;
    const skillScore = this.round1(skillRatio * OPPORTUNITY_MATCHING_WEIGHTS.SKILL_MATCH_MAX);
    const skillPercentage = this.round1((skillScore / OPPORTUNITY_MATCHING_WEIGHTS.SKILL_MATCH_MAX) * 100);

    // ─── Component 2: Verification Confidence (Max 15.0) ──────────────────────
    const verifRatio = totalRequired > 0 ? verifiedCount / totalRequired : 0;
    const verifScore = this.round1(verifRatio * OPPORTUNITY_MATCHING_WEIGHTS.VERIFICATION_CONFIDENCE_MAX);
    const verifPercentage = this.round1((verifScore / OPPORTUNITY_MATCHING_WEIGHTS.VERIFICATION_CONFIDENCE_MAX) * 100);

    // ─── Component 3: Career Interest Alignment (Max 15.0) ────────────────────
    let interestScore: number = CAREER_INTEREST_SCORES.NO_INTEREST_DECLARED;
    let interestExplanation = 'No career preferences declared';

    const preferredRoles = (studentProfile.preferredRoles || []).map((r: string) => r.toLowerCase().trim());
    const careerInterests = (studentProfile.careerInterests || []).map((c: string) => c.toLowerCase().trim());
    const oppTitleLower = opportunity.title.toLowerCase().trim();
    const roleCatLower = (opportunity.careerRole?.category || '').toLowerCase().trim();
    const roleTitleLower = (opportunity.careerRole?.title || '').toLowerCase().trim();

    const isDirectMatch =
      preferredRoles.some((pr: string) => pr.includes(oppTitleLower) || oppTitleLower.includes(pr) || (roleTitleLower && pr.includes(roleTitleLower))) ||
      careerInterests.some((ci: string) => ci.includes(oppTitleLower) || oppTitleLower.includes(ci) || (roleTitleLower && ci.includes(roleTitleLower)));

    const isCategoryMatch =
      roleCatLower &&
      (careerInterests.some((ci: string) => ci.includes(roleCatLower) || roleCatLower.includes(ci)) ||
        preferredRoles.some((pr: string) => pr.includes(roleCatLower) || roleCatLower.includes(pr)));

    if (isDirectMatch) {
      interestScore = CAREER_INTEREST_SCORES.DIRECT_ROLE_MATCH;
      interestExplanation = 'Opportunity matches your declared career interests & preferred roles';
    } else if (isCategoryMatch) {
      interestScore = CAREER_INTEREST_SCORES.CATEGORY_DOMAIN_MATCH;
      interestExplanation = `Role domain (${opportunity.careerRole?.category}) matches your career interests`;
    } else if (preferredRoles.length > 0 || careerInterests.length > 0) {
      interestScore = CAREER_INTEREST_SCORES.GENERAL_INTEREST_DECLARED;
      interestExplanation = 'General career preferences declared';
    }

    interestScore = this.round1(interestScore);
    const interestPercentage = this.round1((interestScore / OPPORTUNITY_MATCHING_WEIGHTS.CAREER_INTEREST_MAX) * 100);

    // ─── Component 4: Academic Readiness & Eligibility Margin (Max 10.0) ──────
    const completeness = this.calculateProfileCompleteness(studentProfile);
    const compSubScore = (completeness / 100) * ACADEMIC_READINESS_CONFIG.PROFILE_COMPLETENESS_MAX;

    let cgpaSubScore: number = ACADEMIC_READINESS_CONFIG.CGPA_TIERS.NONE.points;
    if (studentProfile.cgpa !== null && studentProfile.cgpa !== undefined) {
      if (studentProfile.cgpa >= ACADEMIC_READINESS_CONFIG.CGPA_TIERS.HIGH.minCgpa) {
        cgpaSubScore = ACADEMIC_READINESS_CONFIG.CGPA_TIERS.HIGH.points;
      } else if (studentProfile.cgpa >= ACADEMIC_READINESS_CONFIG.CGPA_TIERS.ABOVE_AVG.minCgpa) {
        cgpaSubScore = ACADEMIC_READINESS_CONFIG.CGPA_TIERS.ABOVE_AVG.points;
      } else if (studentProfile.cgpa >= ACADEMIC_READINESS_CONFIG.CGPA_TIERS.AVERAGE.minCgpa) {
        cgpaSubScore = ACADEMIC_READINESS_CONFIG.CGPA_TIERS.AVERAGE.points;
      } else {
        cgpaSubScore = ACADEMIC_READINESS_CONFIG.CGPA_TIERS.ACTIVE_DEGREE.points;
      }
    } else if (studentProfile.degree) {
      cgpaSubScore = ACADEMIC_READINESS_CONFIG.CGPA_TIERS.ACTIVE_DEGREE.points;
    }

    const academicScore = this.round1(
      Math.min(OPPORTUNITY_MATCHING_WEIGHTS.ACADEMIC_READINESS_MAX, compSubScore + cgpaSubScore),
    );
    const academicPercentage = this.round1((academicScore / OPPORTUNITY_MATCHING_WEIGHTS.ACADEMIC_READINESS_MAX) * 100);

    // ─── Component 5: Location Preference & Remote Alignment (Max 10.0) ───────
    let locationScore: number = LOCATION_MATCH_SCORES.NO_LOCATION_MATCH;
    let locationExplanation = 'Opportunity location does not match preferred locations';

    const preferredLocations = (studentProfile.preferredLocations || []).map((l: string) => l.toLowerCase().trim());
    const oppLocationLower = (opportunity.location || '').toLowerCase().trim();

    if (opportunity.isRemote || preferredLocations.some((pl: string) => pl === 'remote')) {
      locationScore = LOCATION_MATCH_SCORES.REMOTE_OR_EXACT_LOCATION_MATCH;
      locationExplanation = '100% remote opportunity — full geographic compatibility';
    } else if (
      preferredLocations.some(
        (pl: string) => pl.includes(oppLocationLower) || oppLocationLower.includes(pl),
      )
    ) {
      locationScore = LOCATION_MATCH_SCORES.REMOTE_OR_EXACT_LOCATION_MATCH;
      locationExplanation = `Location (${opportunity.location}) matches your preferred location`;
    } else if (preferredLocations.length > 0) {
      locationScore = LOCATION_MATCH_SCORES.GENERAL_LOCATION_DECLARED;
      locationExplanation = 'Location preferences declared (partial match)';
    }

    locationScore = this.round1(locationScore);
    const locationPercentage = this.round1((locationScore / OPPORTUNITY_MATCHING_WEIGHTS.LOCATION_PREFERENCE_MAX) * 100);

    // ─── Final Score & Invariant Summation ─────────────────────────────────────
    const overallScore = this.round1(
      Math.min(100.0, Math.max(0.0, skillScore + verifScore + interestScore + academicScore + locationScore)),
    );

    const eligibility = this.checkEligibility(studentProfile, opportunity);

    return {
      opportunity: {
        id: opportunity.id,
        title: opportunity.title,
        slug: opportunity.slug,
        opportunityType: opportunity.opportunityType,
        status: opportunity.status,
        location: opportunity.location,
        isRemote: opportunity.isRemote,
        stipend: opportunity.stipend,
        stipendCurrency: opportunity.stipendCurrency,
        stipendPeriod: opportunity.stipendPeriod,
        deadline: opportunity.deadline,
        positionsCount: opportunity.positionsCount,
        description: opportunity.description,
        company: {
          id: opportunity.industryProfile.id,
          name: opportunity.industryProfile.companyName,
          industryType: opportunity.industryProfile.industryType,
          headquarters: opportunity.industryProfile.headquarters || null,
          website: opportunity.industryProfile.website || null,
          isVerified: opportunity.industryProfile.isVerified,
        },
        careerRole: opportunity.careerRole
          ? {
              id: opportunity.careerRole.id,
              title: opportunity.careerRole.title,
              category: opportunity.careerRole.category,
            }
          : null,
      },
      overallScore,
      eligibility,
      breakdown: {
        skillCompatibility: {
          score: skillScore,
          max: OPPORTUNITY_MATCHING_WEIGHTS.SKILL_MATCH_MAX,
          percentage: skillPercentage,
          explanation: `${satisfiedCount} of ${totalRequired} required skills satisfied (${deficitCount} deficits, ${missingCount} missing)`,
        },
        verificationConfidence: {
          score: verifScore,
          max: OPPORTUNITY_MATCHING_WEIGHTS.VERIFICATION_CONFIDENCE_MAX,
          percentage: verifPercentage,
          explanation: `${verifiedCount} of ${totalRequired} required skills verified via Phase 6 assessments`,
        },
        careerInterest: {
          score: interestScore,
          max: OPPORTUNITY_MATCHING_WEIGHTS.CAREER_INTEREST_MAX,
          percentage: interestPercentage,
          explanation: interestExplanation,
        },
        academicReadiness: {
          score: academicScore,
          max: OPPORTUNITY_MATCHING_WEIGHTS.ACADEMIC_READINESS_MAX,
          percentage: academicPercentage,
          explanation: `Profile is ${completeness}% complete${studentProfile.cgpa ? `, CGPA: ${studentProfile.cgpa}/10` : ''}`,
        },
        locationPreference: {
          score: locationScore,
          max: OPPORTUNITY_MATCHING_WEIGHTS.LOCATION_PREFERENCE_MAX,
          percentage: locationPercentage,
          explanation: locationExplanation,
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
   * Get all published opportunities matched and ranked for authenticated student.
   */
  async getMatchedOpportunitiesForStudent(userId: string, query?: OpportunityQueryDto) {
    const studentProfile = await this.resolveStudentProfile(userId);

    const where: any = {
      status: OpportunityStatus.PUBLISHED,
    };

    if (query?.opportunityType) {
      where.opportunityType = query.opportunityType;
    }

    if (query?.isRemote !== undefined) {
      where.isRemote = query.isRemote;
    }

    if (query?.location) {
      where.location = { contains: query.location, mode: 'insensitive' };
    }

    if (query?.careerRoleId) {
      where.careerRoleId = query.careerRoleId;
    }

    if (query?.skillId) {
      where.skills = {
        some: { skillId: query.skillId },
      };
    }

    if (query?.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
        { location: { contains: query.search, mode: 'insensitive' } },
        { industryProfile: { companyName: { contains: query.search, mode: 'insensitive' } } },
      ];
    }

    const opportunities = await this.prisma.opportunity.findMany({
      where,
      include: {
        industryProfile: {
          select: {
            id: true,
            companyName: true,
            industryType: true,
            headquarters: true,
            website: true,
            isVerified: true,
          },
        },
        careerRole: {
          select: {
            id: true,
            title: true,
            slug: true,
            category: true,
          },
        },
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
      orderBy: { createdAt: 'desc' },
    });

    let matched = opportunities.map((opp) => this.evaluateOpportunityMatch(studentProfile, opp));

    // Optional filter by eligibility only
    if (query?.eligibleOnly) {
      matched = matched.filter((m) => m.eligibility.isEligible);
    }

    // Sort descending by overallScore, then by satisfied skill count
    matched.sort((a, b) => {
      if (b.overallScore !== a.overallScore) {
        return b.overallScore - a.overallScore;
      }
      return b.skillsSummary.satisfiedCount - a.skillsSummary.satisfiedCount;
    });

    const page = query?.page && query.page > 0 ? query.page : 1;
    const limit = query?.limit && query.limit > 0 ? query.limit : 20;
    const skip = (page - 1) * limit;
    const paginated = matched.slice(skip, skip + limit);

    return {
      data: paginated,
      meta: {
        total: matched.length,
        page,
        limit,
        totalPages: Math.ceil(matched.length / limit) || 1,
      },
    };
  }

  /**
   * Get deep-dive single opportunity match evaluation.
   */
  async getSingleOpportunityMatch(userId: string, idOrSlug: string) {
    const studentProfile = await this.resolveStudentProfile(userId);

    let opp = await this.prisma.opportunity.findUnique({
      where: { id: idOrSlug },
      include: {
        industryProfile: {
          select: {
            id: true,
            companyName: true,
            industryType: true,
            description: true,
            website: true,
            headquarters: true,
            isVerified: true,
          },
        },
        careerRole: {
          select: {
            id: true,
            title: true,
            slug: true,
            category: true,
          },
        },
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

    if (!opp) {
      opp = await this.prisma.opportunity.findUnique({
        where: { slug: idOrSlug },
        include: {
          industryProfile: {
            select: {
              id: true,
              companyName: true,
              industryType: true,
              description: true,
              website: true,
              headquarters: true,
              isVerified: true,
            },
          },
          careerRole: {
            select: {
              id: true,
              title: true,
              slug: true,
              category: true,
            },
          },
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

    if (!opp) {
      throw new NotFoundException(`Opportunity '${idOrSlug}' not found`);
    }

    return this.evaluateOpportunityMatch(studentProfile, opp);
  }
}

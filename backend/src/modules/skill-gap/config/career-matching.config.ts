import { ProficiencyLevel } from '@prisma/client';

export const PROFICIENCY_NUMERIC_MAP: Record<ProficiencyLevel, number> = {
  [ProficiencyLevel.BEGINNER]: 1,
  [ProficiencyLevel.INTERMEDIATE]: 2,
  [ProficiencyLevel.ADVANCED]: 3,
  [ProficiencyLevel.EXPERT]: 4,
};

export const MATCHING_WEIGHTS = {
  /** Component 1: Pure Skill Proficiency & Coverage Match (Max: 50.0) */
  SKILL_COMPATIBILITY_MAX: 50.0,
  /** Component 2: Verification Confidence from Assessment Results (Max: 15.0) */
  VERIFICATION_CONFIDENCE_MAX: 15.0,
  /** Component 3: Student Career Interest & Role Preferences (Max: 15.0) */
  CAREER_INTEREST_MAX: 15.0,
  /** Component 4: Academic Standing & Profile Completeness (Max: 10.0) */
  ACADEMIC_READINESS_MAX: 10.0,
  /** Component 5: Projects & Practical Experience (Max: 10.0) */
  PRACTICAL_EXPERIENCE_MAX: 10.0,
  /** Invariant Total Weight */
  TOTAL_MAX: 100.0,
} as const;

export const CAREER_INTEREST_SCORES = {
  DIRECT_ROLE_MATCH: 15.0,
  CATEGORY_DOMAIN_MATCH: 10.0,
  GENERAL_INTEREST_DECLARED: 5.0,
  NO_INTEREST_DECLARED: 0.0,
} as const;

export const ACADEMIC_READINESS_CONFIG = {
  PROFILE_COMPLETENESS_MAX: 5.0,
  CGPA_SUBFACTOR_MAX: 5.0,
  CGPA_TIERS: {
    HIGH: { minCgpa: 8.5, points: 5.0 },
    ABOVE_AVG: { minCgpa: 7.5, points: 4.0 },
    AVERAGE: { minCgpa: 6.5, points: 3.0 },
    ACTIVE_DEGREE: { points: 2.5 },
    NONE: { points: 0.0 },
  },
} as const;

export const PRACTICAL_EXPERIENCE_CONFIG = {
  PROJECT_SUBFACTOR_MAX: 5.0,
  WORK_SUBFACTOR_MAX: 5.0,
  PROJECT_TIERS: {
    TWO_OR_MORE_DOMAIN: 5.0,
    ONE_DOMAIN: 3.5,
    GENERAL_PROJECTS: 2.0,
    NONE: 0.0,
  },
  WORK_TIERS: {
    INTERNSHIP_OR_JOB: 5.0,
    CERTIFICATION_ONLY: 3.0,
    NONE: 0.0,
  },
} as const;

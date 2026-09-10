import { ProficiencyLevel } from '@prisma/client';

export const PROFICIENCY_NUMERIC_MAP: Record<ProficiencyLevel, number> = {
  [ProficiencyLevel.BEGINNER]: 1,
  [ProficiencyLevel.INTERMEDIATE]: 2,
  [ProficiencyLevel.ADVANCED]: 3,
  [ProficiencyLevel.EXPERT]: 4,
};

export const OPPORTUNITY_MATCHING_WEIGHTS = {
  /** Component 1: Pure Skill Proficiency & Coverage Match (Max: 50.0) */
  SKILL_MATCH_MAX: 50.0,
  /** Component 2: Verification Confidence from Assessment Results (Max: 15.0) */
  VERIFICATION_CONFIDENCE_MAX: 15.0,
  /** Component 3: Student Career Interest & Role Preference (Max: 15.0) */
  CAREER_INTEREST_MAX: 15.0,
  /** Component 4: Academic Standing & Eligibility Bonus (Max: 10.0) */
  ACADEMIC_READINESS_MAX: 10.0,
  /** Component 5: Location Preference / Remote Alignment (Max: 10.0) */
  LOCATION_PREFERENCE_MAX: 10.0,
  /** Total Invariant Max Weight */
  TOTAL_MAX: 100.0,
} as const;

export const LOCATION_MATCH_SCORES = {
  REMOTE_OR_EXACT_LOCATION_MATCH: 10.0,
  GENERAL_LOCATION_DECLARED: 4.0,
  NO_LOCATION_MATCH: 0.0,
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

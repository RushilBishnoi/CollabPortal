export type SkillGapStatus = 'SATISFIED' | 'DEFICIT' | 'MISSING';

export interface EvaluatedSkillRequirement {
  skillId: string;
  skillName: string;
  categoryName?: string;
  requiredProficiency: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';
  requiredProficiencyValue: number;
  studentProficiency: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT' | null;
  studentProficiencyValue: number;
  verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED' | null;
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

export interface CareerRoleBrief {
  id: string;
  title: string;
  slug: string;
  category: string;
  description: string | null;
  minExperienceYears: number;
}

export interface CareerMatchResult {
  careerRole: CareerRoleBrief;
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

export interface StudentReadinessOverview {
  profileSummary: {
    studentProfileId: string;
    fullName: string;
    degree?: string;
    department?: string;
    totalAcquiredSkills: number;
    verifiedSkillsCount: number;
    pendingSkillsCount: number;
    profileCompleteness: number;
  };
  verifiedSkills: Array<{
    id: string;
    skillId: string;
    name: string;
    category?: string;
    proficiency: string;
    score?: number | null;
    lastAssessedAt?: string | null;
  }>;
  pendingSkills: Array<{
    id: string;
    skillId: string;
    name: string;
    category?: string;
    proficiency: string;
  }>;
  skillsToImprove: Array<{
    skillId: string;
    skillName: string;
    currentProficiency: string;
    targetProficiency: string;
    gapLevels: number;
    roleTitle: string;
  }>;
  missingCriticalSkills: Array<{
    skillId: string;
    skillName: string;
    targetProficiency: string;
    roleTitle: string;
  }>;
  topRecommendations: CareerMatchResult[];
}

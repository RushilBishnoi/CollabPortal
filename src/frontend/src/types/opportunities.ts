export type OpportunityType = 'INTERNSHIP' | 'JOB' | 'APPRENTICESHIP' | 'LIVE_PROJECT';
export type OpportunityStatus = 'DRAFT' | 'PUBLISHED' | 'CLOSED' | 'ARCHIVED';
export type SkillRequirementStatus = 'SATISFIED' | 'DEFICIT' | 'MISSING';

export interface EvaluatedOpportunitySkill {
  skillId: string;
  skillName: string;
  categoryName?: string;
  requiredProficiency: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';
  requiredProficiencyValue: number;
  studentProficiency: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT' | null;
  studentProficiencyValue: number;
  verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED' | null;
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

export interface OpportunityCompanyInfo {
  id: string;
  name?: string;
  companyName?: string;
  industryType: string;
  headquarters: string | null;
  website: string | null;
  description?: string | null;
  isVerified: boolean;
}

export interface OpportunitySkillItem {
  id?: string;
  skillId: string;
  requiredProficiency: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';
  weight: number;
  isMandatory: boolean;
  skill: {
    id: string;
    name: string;
    description?: string | null;
    category?: { id: string; name: string } | null;
  };
}

export interface OpportunityBrief {
  id: string;
  industryProfileId: string;
  careerRoleId?: string | null;
  title: string;
  slug: string;
  description: string;
  opportunityType: OpportunityType;
  status: OpportunityStatus;
  location: string;
  isRemote: boolean;
  stipend: number | null;
  stipendCurrency: string;
  stipendPeriod: string;
  minCgpa: number | null;
  minGraduationYear: number | null;
  maxGraduationYear: number | null;
  eligibleDepartments: string[];
  deadline: string | null;
  positionsCount: number;
  maxApplications: number | null;
  createdAt: string;
  updatedAt: string;
  industryProfile: OpportunityCompanyInfo;
  /** Alias for industryProfile — present in public API responses */
  company?: OpportunityCompanyInfo;
  careerRole?: {
    id: string;
    title: string;
    slug?: string;
    category: string;
  } | null;
  skills: OpportunitySkillItem[];
}

export interface OpportunityMatchResult {
  opportunity: {
    id: string;
    title: string;
    slug: string;
    opportunityType: OpportunityType;
    status: OpportunityStatus;
    location: string;
    isRemote: boolean;
    stipend: number | null;
    stipendCurrency: string;
    stipendPeriod: string;
    deadline: string | null;
    positionsCount: number;
    description: string;
    company: OpportunityCompanyInfo;
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

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

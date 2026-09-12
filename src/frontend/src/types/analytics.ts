export interface InstitutionSummary {
  totalStudents: number;
  placedStudentsCount: number;
  placementRate: number;
  totalApplications: number;
  selectedCount: number;
  interviewCount: number;
  shortlistedCount: number;
  underReviewCount: number;
  applicationConversionRate: number;
  totalSkillsRecorded: number;
  totalVerifiedSkills: number;
  skillVerificationRate: number;
  totalAssessmentAttempts: number;
  assessmentPassRate: number;
  averageAssessmentScore: number;
}

export interface RecruitmentFunnel {
  applied: number;
  underReview: number;
  shortlisted: number;
  interviewScheduled: number;
  selected: number;
  rejected: number;
  withdrawn: number;
}

export interface DepartmentMetric {
  department: string;
  totalStudents: number;
  placedStudents: number;
  placementRate: number;
  averageCgpa: number;
  applicationCount: number;
  verifiedSkillCount: number;
}

export interface BatchTrend {
  graduationYear: number;
  totalStudents: number;
  placedStudents: number;
  totalApplications: number;
  placementRate: number;
}

export interface TopSkillMetric {
  name: string;
  count: number;
  verified: number;
}

export interface TopCompanyMetric {
  companyName: string;
  selectedCount: number;
  applicationCount: number;
}

export interface InstitutionAnalyticsOverview {
  institution: {
    id: string;
    name: string;
    code?: string | null;
    city?: string | null;
    state?: string | null;
  };
  summary: InstitutionSummary;
  funnel: RecruitmentFunnel;
  topSkills: TopSkillMetric[];
  topHiringCompanies: TopCompanyMetric[];
  departmentAnalytics: DepartmentMetric[];
  batchTrends: BatchTrend[];
}

export interface PlatformAnalyticsOverview {
  summary: {
    totalInstitutions: number;
    totalIndustries: number;
    totalStudents: number;
    totalOpportunities: number;
    totalApplications: number;
    selectedApplications: number;
    totalAssessments: number;
    globalPlacementRate: number;
  };
}

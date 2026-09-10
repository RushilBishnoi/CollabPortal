import { Skill, ProficiencyLevel } from './skill';
import { UserRole } from './api';

export type { ProficiencyLevel, UserRole };

export type LearningResourceType =
  | 'VIDEO'
  | 'ARTICLE'
  | 'DOCUMENTATION'
  | 'COURSE'
  | 'INTERACTIVE_LAB'
  | 'PRACTICE_PROJECT'
  | 'BOOK';

export type LearningResourceDifficulty =
  | 'BEGINNER'
  | 'INTERMEDIATE'
  | 'ADVANCED'
  | 'EXPERT';

export type LearningPathStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export type StudentResourceStatus = 'SAVED' | 'IN_PROGRESS' | 'COMPLETED';

export type StudentPathEnrollmentStatus =
  | 'ENROLLED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'PAUSED';

export interface LearningResource {
  id: string;
  title: string;
  slug: string;
  description: string;
  url: string;
  resourceType: LearningResourceType;
  difficulty: LearningResourceDifficulty;
  estimatedMinutes: number;
  skillId: string;
  targetProficiency: ProficiencyLevel;
  authorRole: UserRole;
  authorUserId: string;
  isVerified: boolean;
  isPublished: boolean;
  provider?: string | null;
  tags: string[];
  rating?: number | null;
  ratingCount?: number;
  createdAt: string;
  updatedAt: string;
  skill?: Skill;
}

export interface LearningPathItem {
  id: string;
  learningPathId: string;
  resourceId: string;
  order: number;
  isMandatory: boolean;
  milestoneNotes?: string | null;
  createdAt: string;
  resource?: LearningResource;
}

export interface LearningPath {
  id: string;
  title: string;
  slug: string;
  description: string;
  careerRoleId?: string | null;
  targetProficiency: ProficiencyLevel;
  status: LearningPathStatus;
  estimatedHours: number;
  authorRole: UserRole;
  authorUserId: string;
  institutionId?: string | null;
  createdAt: string;
  updatedAt: string;
  careerRole?: {
    id: string;
    title: string;
    slug: string;
    category: string;
  } | null;
  items?: LearningPathItem[];
  _count?: {
    enrollments: number;
    items?: number;
  };
}

export interface StudentResourceProgress {
  id: string;
  studentProfileId: string;
  resourceId: string;
  status: StudentResourceStatus;
  timeSpentMinutes: number;
  rating?: number | null;
  notes?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  resource?: LearningResource;
}

export interface StudentPathEnrollment {
  id: string;
  studentProfileId: string;
  learningPathId: string;
  status: StudentPathEnrollmentStatus;
  progressPercentage: number;
  completedItemsCount: number;
  totalItemsCount: number;
  startedAt: string;
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  learningPath?: LearningPath;
}

export interface StudentLearningOverview {
  stats: {
    totalEnrolledPaths: number;
    activeEnrollmentsCount: number;
    completedPathsCount: number;
    totalResourcesInteracted: number;
    completedResourcesCount: number;
    inProgressResourcesCount: number;
    savedResourcesCount: number;
    totalHoursSpent: number;
  };
  enrollments: StudentPathEnrollment[];
  resourceProgress: StudentResourceProgress[];
}

export interface SkillRemediationItem {
  skillId: string;
  skillName: string;
  categoryName?: string;
  currentProficiency: string | null;
  targetProficiency: string;
  status: 'MISSING' | 'DEFICIT';
  gapLevels: number;
  estimatedHours: number;
  resources: LearningResource[];
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
  recommendedPaths: LearningPath[];
}

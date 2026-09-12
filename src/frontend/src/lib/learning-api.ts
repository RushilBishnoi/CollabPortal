import { apiClient } from './api-client';
import {
  LearningResource,
  LearningPath,
  StudentLearningOverview,
  StudentPathEnrollment,
  StudentResourceProgress,
  CareerRemediationPlan,
  LearningResourceType,
  LearningResourceDifficulty,
  ProficiencyLevel,
  UserRole,
} from '../types/learning';

export interface QueryLearningResourcesParams {
  search?: string;
  skillId?: string;
  resourceType?: LearningResourceType;
  difficulty?: LearningResourceDifficulty;
  targetProficiency?: ProficiencyLevel;
  authorRole?: UserRole;
  isVerified?: boolean;
  page?: number;
  limit?: number;
}

export interface QueryLearningPathsParams {
  search?: string;
  careerRoleId?: string;
  targetProficiency?: ProficiencyLevel;
  authorRole?: UserRole;
  page?: number;
  limit?: number;
}

export interface CreateResourcePayload {
  title: string;
  description: string;
  url: string;
  skillId: string;
  resourceType?: LearningResourceType;
  difficulty?: LearningResourceDifficulty;
  targetProficiency?: ProficiencyLevel;
  estimatedMinutes?: number;
  provider?: string;
  tags?: string[];
}

export interface CreateLearningPathPayload {
  title: string;
  description: string;
  careerRoleId?: string;
  targetProficiency?: ProficiencyLevel;
  estimatedHours?: number;
  items: {
    resourceId: string;
    order?: number;
    isMandatory?: boolean;
    milestoneNotes?: string;
  }[];
}

export interface PaginatedResponse<T> {
  items: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

const buildQueryString = (params?: Record<string, any>): string => {
  if (!params) return '';
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.append(key, String(value));
    }
  });
  const str = query.toString();
  return str ? `?${str}` : '';
};

export const learningApi = {
  // Resources
  getResources: (params?: QueryLearningResourcesParams) =>
    apiClient.get<PaginatedResponse<LearningResource>>(`/learning/resources${buildQueryString(params)}`),

  getResourceById: (idOrSlug: string) =>
    apiClient.get<LearningResource>(`/learning/resources/${idOrSlug}`),

  createResource: (payload: CreateResourcePayload) =>
    apiClient.post<LearningResource>('/learning/resources', payload),

  updateResource: (id: string, payload: Partial<CreateResourcePayload>) =>
    apiClient.patch<LearningResource>(`/learning/resources/${id}`, payload),

  deleteResource: (id: string) =>
    apiClient.delete<{ success: boolean; message: string }>(`/learning/resources/${id}`),

  getMyResources: () =>
    apiClient.get<LearningResource[]>('/learning/resources/my'),

  verifyResource: (id: string, isVerified: boolean = true) =>
    apiClient.patch<LearningResource>(`/learning/resources/${id}/verify`, { isVerified }),

  // Paths
  getPaths: (params?: QueryLearningPathsParams) =>
    apiClient.get<PaginatedResponse<LearningPath>>(`/learning/paths${buildQueryString(params)}`),

  getPathById: (idOrSlug: string) =>
    apiClient.get<LearningPath>(`/learning/paths/${idOrSlug}`),

  createPath: (payload: CreateLearningPathPayload) =>
    apiClient.post<LearningPath>('/learning/paths', payload),

  updatePath: (id: string, payload: Partial<CreateLearningPathPayload>) =>
    apiClient.patch<LearningPath>(`/learning/paths/${id}`, payload),

  deletePath: (id: string) =>
    apiClient.delete<{ success: boolean; message: string }>(`/learning/paths/${id}`),

  getMyPaths: () =>
    apiClient.get<LearningPath[]>('/learning/paths/my'),

  // Student Learning
  getMyLearning: () =>
    apiClient.get<StudentLearningOverview>('/learning/student/my-learning'),

  enrollInPath: (pathId: string, notes?: string) =>
    apiClient.post<StudentPathEnrollment>(`/learning/student/paths/${pathId}/enroll`, { notes }),

  updateResourceProgress: (
    resourceId: string,
    payload: {
      status: 'SAVED' | 'IN_PROGRESS' | 'COMPLETED';
      timeSpentMinutes?: number;
      rating?: number;
      notes?: string;
    },
  ) =>
    apiClient.post<StudentResourceProgress>(
      `/learning/student/resources/${resourceId}/progress`,
      payload,
    ),

  getRoleRemediation: (roleIdOrSlug: string) =>
    apiClient.get<CareerRemediationPlan>(
      `/learning/student/remediation/career-role/${roleIdOrSlug}`,
    ),

  getGeneralRemediation: () =>
    apiClient.get<{ hasTargetRoles: boolean; plans: CareerRemediationPlan[] }>(
      '/learning/student/remediation/overview',
    ),
};

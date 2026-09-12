import { apiClient } from './api-client';
import {
  CareerMatchResult,
  StudentReadinessOverview,
} from '../types/career-roles';

export const careerApi = {
  /**
   * Get authenticated student's overall readiness dashboard data.
   */
  async getReadinessOverview(): Promise<StudentReadinessOverview> {
    return apiClient.get<StudentReadinessOverview>('/skill-gaps/me');
  },

  /**
   * Get all active career roles ranked by compatibility for authenticated student.
   */
  async getRecommendedRoles(): Promise<CareerMatchResult[]> {
    return apiClient.get<CareerMatchResult[]>('/career-recommendations/me');
  },

  /**
   * Get deep-dive skill gap analysis for a specific career role by ID or slug.
   */
  async getRoleMatch(idOrSlug: string): Promise<CareerMatchResult> {
    return apiClient.get<CareerMatchResult>(`/career-recommendations/me/${idOrSlug}`);
  },
};

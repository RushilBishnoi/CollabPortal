import { apiClient } from './api-client';
import {
  OpportunityBrief,
  OpportunityMatchResult,
  PaginatedResult,
  OpportunityStatus,
} from '../types/opportunities';

export interface OpportunityFilterParams {
  search?: string;
  opportunityType?: string;
  isRemote?: boolean;
  location?: string;
  skillId?: string;
  careerRoleId?: string;
  eligibleOnly?: boolean;
  page?: number;
  limit?: number;
}

export const opportunityApi = {
  /**
   * Public & Students: Browse and search published opportunities.
   */
  async getPublishedOpportunities(params?: OpportunityFilterParams): Promise<PaginatedResult<OpportunityBrief>> {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.opportunityType) query.set('opportunityType', params.opportunityType);
    if (params?.isRemote !== undefined) query.set('isRemote', String(params.isRemote));
    if (params?.location) query.set('location', params.location);
    if (params?.skillId) query.set('skillId', params.skillId);
    if (params?.careerRoleId) query.set('careerRoleId', params.careerRoleId);
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));

    const qs = query.toString();
    return apiClient.get<PaginatedResult<OpportunityBrief>>(`/opportunities${qs ? `?${qs}` : ''}`);
  },

  /**
   * Public & Students: Get single opportunity by ID or slug.
   */
  async getOpportunityByIdOrSlug(idOrSlug: string): Promise<OpportunityBrief> {
    return apiClient.get<OpportunityBrief>(`/opportunities/${idOrSlug}`);
  },

  /**
   * Student: Get personalized opportunities with compatibility scores and eligibility check.
   */
  async getMatchedOpportunitiesForMe(params?: OpportunityFilterParams): Promise<PaginatedResult<OpportunityMatchResult>> {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.opportunityType) query.set('opportunityType', params.opportunityType);
    if (params?.isRemote !== undefined) query.set('isRemote', String(params.isRemote));
    if (params?.location) query.set('location', params.location);
    if (params?.eligibleOnly !== undefined) query.set('eligibleOnly', String(params.eligibleOnly));
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));

    const qs = query.toString();
    return apiClient.get<PaginatedResult<OpportunityMatchResult>>(`/opportunities/matched/me${qs ? `?${qs}` : ''}`);
  },

  /**
   * Student: Get deep-dive single opportunity match evaluation.
   */
  async getSingleMatchEvaluation(idOrSlug: string): Promise<OpportunityMatchResult> {
    return apiClient.get<OpportunityMatchResult>(`/opportunities/${idOrSlug}/match-me`);
  },

  // ─── Industry Recruiter APIs ────────────────────────────────────────────────

  /**
   * Recruiter: Get all opportunities posted by authenticated recruiter.
   */
  async getMyPostings(): Promise<OpportunityBrief[]> {
    return apiClient.get<OpportunityBrief[]>('/industry/opportunities/me');
  },

  /**
   * Recruiter: Get single posting by ID.
   */
  async getMyPostingById(id: string): Promise<OpportunityBrief> {
    return apiClient.get<OpportunityBrief>(`/industry/opportunities/me/${id}`);
  },

  /**
   * Recruiter: Create new opportunity posting.
   */
  async createPosting(data: any): Promise<OpportunityBrief> {
    return apiClient.post<OpportunityBrief>('/industry/opportunities', data);
  },

  /**
   * Recruiter: Update posting details.
   */
  async updatePosting(id: string, data: any): Promise<OpportunityBrief> {
    return apiClient.put<OpportunityBrief>(`/industry/opportunities/me/${id}`, data);
  },

  /**
   * Recruiter: Update status (DRAFT | PUBLISHED | CLOSED | ARCHIVED).
   */
  async updatePostingStatus(id: string, status: OpportunityStatus): Promise<{ status: OpportunityStatus }> {
    return apiClient.patch<{ status: OpportunityStatus }>(`/industry/opportunities/me/${id}/status`, { status });
  },

  /**
   * Recruiter: Add required skill to opportunity.
   */
  async addPostingSkill(id: string, skillData: any): Promise<any> {
    return apiClient.post(`/industry/opportunities/me/${id}/skills`, skillData);
  },

  /**
   * Recruiter: Remove required skill from opportunity.
   */
  async removePostingSkill(id: string, skillId: string): Promise<{ success: boolean; message: string }> {
    return apiClient.delete(`/industry/opportunities/me/${id}/skills/${skillId}`);
  },
};

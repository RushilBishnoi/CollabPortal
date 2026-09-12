import { apiClient } from './api-client';
import {
  StudentApplicationItem,
  RecruiterCandidateApplication,
  PaginatedApplications,
  ApplicationStatus,
} from '../types/applications';

export interface ApplicationFilterParams {
  status?: ApplicationStatus;
  search?: string;
  page?: number;
  limit?: number;
}

export const applicationApi = {
  // ─── Student APIs ──────────────────────────────────────────────────────────

  /**
   * Student: Apply to a published opportunity.
   */
  async apply(data: {
    opportunityId: string;
    coverLetter?: string;
    resumeFile?: {
      originalFilename: string;
      mimeType: string;
      buffer: string; // base64 string
      sizeBytes: number;
    };
  }): Promise<StudentApplicationItem> {
    return apiClient.post<StudentApplicationItem>('/applications', data);
  },

  /**
   * Student: List own submitted applications.
   */
  async getMyApplications(
    params?: ApplicationFilterParams,
  ): Promise<PaginatedApplications<StudentApplicationItem>> {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));

    const qs = query.toString();
    return apiClient.get<PaginatedApplications<StudentApplicationItem>>(
      `/applications/me${qs ? `?${qs}` : ''}`,
    );
  },

  /**
   * Student: Get single application details & timeline.
   */
  async getMyApplicationById(id: string): Promise<StudentApplicationItem> {
    return apiClient.get<StudentApplicationItem>(`/applications/me/${id}`);
  },

  /**
   * Student: Withdraw application before final decision.
   */
  async withdrawApplication(id: string): Promise<any> {
    return apiClient.patch(`/applications/me/${id}/withdraw`, {});
  },

  // ─── Recruiter Pipeline APIs ────────────────────────────────────────────────

  /**
   * Recruiter: List candidates for an authored opportunity.
   */
  async getApplicationsForOpportunity(
    opportunityId: string,
    params?: ApplicationFilterParams,
  ): Promise<PaginatedApplications<RecruiterCandidateApplication>> {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.search) query.set('search', params.search);
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));

    const qs = query.toString();
    return apiClient.get<PaginatedApplications<RecruiterCandidateApplication>>(
      `/industry/applications/opportunity/${opportunityId}${qs ? `?${qs}` : ''}`,
    );
  },

  /**
   * Recruiter: Deep candidate review data.
   */
  async getCandidateReview(id: string): Promise<RecruiterCandidateApplication> {
    return apiClient.get<RecruiterCandidateApplication>(`/industry/applications/${id}`);
  },

  /**
   * Recruiter: Update candidate recruitment stage.
   */
  async updateApplicationStatus(
    id: string,
    data: {
      status: ApplicationStatus;
      recruiterNotes?: string;
      rejectionReason?: string;
    },
  ): Promise<any> {
    return apiClient.patch(`/industry/applications/${id}/status`, data);
  },

  /**
   * Recruiter: Schedule interview round.
   */
  async scheduleInterview(id: string, data: any): Promise<any> {
    return apiClient.post(`/industry/applications/${id}/interviews`, data);
  },

  /**
   * Recruiter: Update interview status, notes, or rating.
   */
  async updateInterview(
    applicationId: string,
    interviewId: string,
    data: any,
  ): Promise<any> {
    return apiClient.patch(
      `/industry/applications/${applicationId}/interviews/${interviewId}`,
      data,
    );
  },
};

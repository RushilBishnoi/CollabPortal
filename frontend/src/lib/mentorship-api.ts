import { apiClient } from './api-client';
import {
  MentorProfile,
  MentorshipRequest,
  Mentorship,
  MentorshipSession,
  MentorshipGoal,
  MentorAvailabilitySlot,
  CalculatedBookingSlot,
  MentorshipAnalytics,
  MentorRoleType,
  MentorshipRequestStatus,
  MentorshipSessionStatus,
  MentorshipGoalStatus,
} from '../types/mentorship';

export interface PaginatedResponse<T> {
  items: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface QueryMentorsParams {
  search?: string;
  skillId?: string;
  careerRoleId?: string;
  mentorRoleType?: MentorRoleType;
  isAvailable?: boolean;
  page?: number;
  limit?: number;
}

export interface QuerySessionsParams {
  status?: MentorshipSessionStatus;
  search?: string;
  page?: number;
  limit?: number;
}

export interface UpsertMentorProfilePayload {
  headline: string;
  bio: string;
  designation: string;
  companyOrInstitution: string;
  yearsOfExperience?: number;
  maxMentees?: number;
  isAvailable?: boolean;
  defaultMeetingPlatform?: string;
  defaultMeetingLink?: string;
  linkedInUrl?: string;
  githubUrl?: string;
  skillIds?: string[];
  careerRoleIds?: string[];
}

export interface BookSessionPayload {
  title: string;
  description?: string;
  scheduledAt: string;
  durationMinutes?: number;
  meetingPlatform?: string;
  meetingLink?: string;
  location?: string;
  mentorshipId?: string;
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

export const mentorshipApi = {
  // ── Public / Student Discovery ──
  findMentors: (params?: QueryMentorsParams) =>
    apiClient.get<PaginatedResponse<MentorProfile>>(`/mentors${buildQueryString(params)}`),

  getMentorById: (id: string) =>
    apiClient.get<MentorProfile>(`/mentors/${id}`),

  getMentorAvailability: (id: string) =>
    apiClient.get<MentorAvailabilitySlot[]>(`/mentors/${id}/availability`),

  getAvailableSlots: (id: string, date: string) =>
    apiClient.get<CalculatedBookingSlot[]>(`/mentors/${id}/slots?date=${encodeURIComponent(date)}`),

  // ── Mentor Workspace ──
  getMyMentorProfile: () =>
    apiClient.get<MentorProfile>('/mentor/workspace/profile'),

  upsertMentorProfile: (payload: UpsertMentorProfilePayload) =>
    apiClient.put<MentorProfile>('/mentor/workspace/profile', payload),

  setAvailability: (slots: MentorAvailabilitySlot[]) =>
    apiClient.put<MentorAvailabilitySlot[]>('/mentor/workspace/availability', { slots }),

  getIncomingRequests: (status?: MentorshipRequestStatus) =>
    apiClient.get<MentorshipRequest[]>(`/mentor/workspace/requests${buildQueryString({ status })}`),

  respondToRequest: (
    requestId: string,
    payload: { action: 'ACCEPT' | 'REJECT'; rejectionReason?: string; notes?: string },
  ) =>
    apiClient.post<{ request: MentorshipRequest; mentorship: Mentorship | null }>(
      `/mentor/workspace/requests/${requestId}/respond`,
      payload,
    ),

  getMentorMentorships: () =>
    apiClient.get<Mentorship[]>('/mentor/workspace/mentorships'),

  // ── Student Workspace ──
  requestMentorship: (
    mentorProfileId: string,
    payload: {
      statementOfPurpose: string;
      targetCareerRoleId?: string;
      expectedDurationWeeks?: number;
    },
  ) =>
    apiClient.post<MentorshipRequest>(
      `/student/mentorship/mentors/${mentorProfileId}/request`,
      payload,
    ),

  getStudentRequests: () =>
    apiClient.get<MentorshipRequest[]>('/student/mentorship/requests'),

  withdrawRequest: (requestId: string) =>
    apiClient.post<MentorshipRequest>(`/student/mentorship/requests/${requestId}/withdraw`),

  getStudentMentorships: () =>
    apiClient.get<Mentorship[]>('/student/mentorship/mentorships'),

  getMentorshipById: (id: string) =>
    apiClient.get<Mentorship>(`/student/mentorship/mentorships/${id}`),

  completeMentorship: (mentorshipId: string, notes?: string) =>
    apiClient.post<Mentorship>(`/student/mentorship/mentorships/${mentorshipId}/complete`, { notes }),

  // ── Goals ──
  getGoals: (mentorshipId: string) =>
    apiClient.get<MentorshipGoal[]>(`/student/mentorship/mentorships/${mentorshipId}/goals`),

  createGoal: (
    mentorshipId: string,
    payload: {
      title: string;
      description?: string;
      targetDate?: string;
      linkedSkillId?: string;
      linkedLearningPathId?: string;
    },
  ) =>
    apiClient.post<MentorshipGoal>(
      `/student/mentorship/mentorships/${mentorshipId}/goals`,
      payload,
    ),

  updateGoal: (
    goalId: string,
    payload: {
      title?: string;
      description?: string;
      targetDate?: string;
      status?: MentorshipGoalStatus;
      linkedSkillId?: string;
      linkedLearningPathId?: string;
    },
  ) =>
    apiClient.patch<MentorshipGoal>(`/student/mentorship/goals/${goalId}`, payload),

  deleteGoal: (goalId: string) =>
    apiClient.delete<{ success: boolean; message: string }>(`/student/mentorship/goals/${goalId}`),

  // ── Sessions ──
  bookSession: (mentorProfileId: string, payload: BookSessionPayload) =>
    apiClient.post<MentorshipSession>(
      `/mentorship/sessions/mentors/${mentorProfileId}/book`,
      payload,
    ),

  getStudentSessions: (params?: QuerySessionsParams) =>
    apiClient.get<PaginatedResponse<MentorshipSession>>(
      `/mentorship/sessions/student${buildQueryString(params)}`,
    ),

  getMentorSessions: (params?: QuerySessionsParams) =>
    apiClient.get<PaginatedResponse<MentorshipSession>>(
      `/mentorship/sessions/mentor${buildQueryString(params)}`,
    ),

  getSessionById: (id: string) =>
    apiClient.get<MentorshipSession>(`/mentorship/sessions/${id}`),

  updateSession: (
    id: string,
    payload: {
      status?: MentorshipSessionStatus;
      scheduledAt?: string;
      durationMinutes?: number;
      meetingPlatform?: string;
      meetingLink?: string;
      cancellationReason?: string;
    },
  ) =>
    apiClient.patch<MentorshipSession>(`/mentorship/sessions/${id}`, payload),

  submitSessionFeedback: (
    id: string,
    payload: {
      studentRating?: number;
      studentFeedback?: string;
      mentorNotes?: string;
      studentNotes?: string;
      sharedSummary?: string;
    },
  ) =>
    apiClient.post<MentorshipSession>(`/mentorship/sessions/${id}/feedback`, payload),

  // ── Analytics ──
  getMentorshipAnalytics: () =>
    apiClient.get<MentorshipAnalytics>('/analytics/mentorship'),
};

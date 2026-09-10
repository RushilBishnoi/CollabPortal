import { apiClient } from './api-client';
import {
  Collaboration,
  CollaborationListResponse,
  CollaborationParticipation,
  ParticipationListResponse,
  CollaborationStatus,
  ParticipationStatus,
  CollaborationAnalyticsResponse,
} from '../types/collaboration';

export const collaborationApi = {
  // Public / Shared Marketplace
  getCollaborations: (params?: Record<string, any>) => {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          query.append(key, String(value));
        }
      });
    }
    const queryStr = query.toString() ? `?${query.toString()}` : '';
    return apiClient.get<CollaborationListResponse>(`/collaborations${queryStr}`);
  },

  getCollaborationById: (id: string) => {
    return apiClient.get<Collaboration>(`/collaborations/${id}`);
  },

  // Industry Authoring
  getMyIndustryCollaborations: () => {
    return apiClient.get<Collaboration[]>('/collaborations/my');
  },

  createCollaboration: (data: Partial<Collaboration>) => {
    return apiClient.post<Collaboration>('/collaborations', data);
  },

  updateCollaboration: (id: string, data: Partial<Collaboration>) => {
    return apiClient.patch<Collaboration>(`/collaborations/${id}`, data);
  },

  updateCollaborationStatus: (id: string, status: CollaborationStatus) => {
    return apiClient.patch<Collaboration>(`/collaborations/${id}/status`, { status });
  },

  deleteCollaboration: (id: string) => {
    return apiClient.delete<{ success: boolean; message: string }>(`/collaborations/${id}`);
  },

  // Faculty Workflows
  getFacultyCollaborations: (params?: Record<string, any>) => {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          query.append(key, String(value));
        }
      });
    }
    const queryStr = query.toString() ? `?${query.toString()}` : '';
    return apiClient.get<CollaborationListResponse>(`/faculty/collaborations${queryStr}`);
  },

  getMyFacultyParticipations: (params?: Record<string, any>) => {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          query.append(key, String(value));
        }
      });
    }
    const queryStr = query.toString() ? `?${query.toString()}` : '';
    return apiClient.get<ParticipationListResponse>(`/faculty/collaborations/my-participations${queryStr}`);
  },

  getMyFacultyParticipationById: (id: string) => {
    return apiClient.get<CollaborationParticipation>(`/faculty/collaborations/my-participations/${id}`);
  },

  requestFacultyParticipation: (collaborationId: string, data: { motivation?: string; relevantExperience?: string }) => {
    return apiClient.post<CollaborationParticipation>(`/faculty/collaborations/${collaborationId}/participate`, data);
  },

  withdrawFacultyParticipation: (id: string) => {
    return apiClient.patch<CollaborationParticipation>(`/faculty/collaborations/my-participations/${id}/withdraw`);
  },

  // Student Workflows
  getStudentCollaborations: (params?: Record<string, any>) => {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          query.append(key, String(value));
        }
      });
    }
    const queryStr = query.toString() ? `?${query.toString()}` : '';
    return apiClient.get<CollaborationListResponse>(`/student/collaborations${queryStr}`);
  },

  getMyStudentParticipations: (params?: Record<string, any>) => {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          query.append(key, String(value));
        }
      });
    }
    const queryStr = query.toString() ? `?${query.toString()}` : '';
    return apiClient.get<ParticipationListResponse>(`/student/collaborations/my-participations${queryStr}`);
  },

  getMyStudentParticipationById: (id: string) => {
    return apiClient.get<CollaborationParticipation>(`/student/collaborations/my-participations/${id}`);
  },

  requestStudentParticipation: (collaborationId: string, data: { motivation?: string; relevantExperience?: string }) => {
    return apiClient.post<CollaborationParticipation>(`/student/collaborations/${collaborationId}/participate`, data);
  },

  withdrawStudentParticipation: (id: string) => {
    return apiClient.patch<CollaborationParticipation>(`/student/collaborations/my-participations/${id}/withdraw`);
  },

  // Industry Participant Management
  getCollaborationParticipants: (collaborationId: string, params?: Record<string, any>) => {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          query.append(key, String(value));
        }
      });
    }
    const queryStr = query.toString() ? `?${query.toString()}` : '';
    return apiClient.get<ParticipationListResponse>(`/collaborations/${collaborationId}/participations${queryStr}`);
  },

  getCollaborationParticipantById: (collaborationId: string, participationId: string) => {
    return apiClient.get<CollaborationParticipation>(`/collaborations/${collaborationId}/participations/${participationId}`);
  },

  updateParticipationStatus: (
    collaborationId: string,
    participationId: string,
    data: {
      status: ParticipationStatus;
      industryNotes?: string;
      rejectionReason?: string;
      notes?: string;
    },
  ) => {
    return apiClient.patch<CollaborationParticipation>(
      `/collaborations/${collaborationId}/participations/${participationId}/status`,
      data,
    );
  },

  // Analytics
  getCollaborationAnalytics: (department?: string) => {
    const query = department ? `?department=${encodeURIComponent(department)}` : '';
    return apiClient.get<CollaborationAnalyticsResponse>(`/analytics/collaborations${query}`);
  },
};

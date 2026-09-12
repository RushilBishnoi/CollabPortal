import { apiClient } from './api-client';
import {
  PlacementOffer,
  Placement,
  OfferStatus,
  PlacementStatus,
  EmploymentType,
  PlacementDocumentType,
  PlacementAnalyticsResponse,
} from '../types/placement';

export interface CreatePlacementOfferPayload {
  title: string;
  designation: string;
  employmentType?: EmploymentType;
  ctcAnnual?: number;
  baseSalaryMonthly?: number;
  stipendMonthly?: number;
  currency?: string;
  joiningDate: string;
  offerExpiryDate: string;
  workLocation?: string;
  workMode?: string;
  department?: string;
  description?: string;
  termsAndConditions?: string;
  benefitsSummary?: string;
  contactPerson?: string;
  contactEmail?: string;
}

export interface QueryOffersParams {
  status?: OfferStatus;
  employmentType?: EmploymentType;
  search?: string;
  page?: number;
  limit?: number;
}

export interface QueryPlacementsParams {
  status?: PlacementStatus;
  department?: string;
  search?: string;
  page?: number;
  limit?: number;
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

export const placementApi = {
  // Industry Endpoints
  createOffer: (applicationId: string, payload: CreatePlacementOfferPayload) =>
    apiClient.post<PlacementOffer>(
      `/industry/applications/${applicationId}/offers`,
      payload,
    ),

  getIndustryOffers: (params?: QueryOffersParams) =>
    apiClient.get<PaginatedResponse<PlacementOffer>>(
      `/industry/offers${buildQueryString(params)}`,
    ),

  getIndustryOfferById: (id: string) =>
    apiClient.get<PlacementOffer>(`/industry/offers/${id}`),

  updateOffer: (id: string, payload: Partial<CreatePlacementOfferPayload>) =>
    apiClient.patch<PlacementOffer>(`/industry/offers/${id}`, payload),

  issueOffer: (id: string, notes?: string) =>
    apiClient.post<PlacementOffer>(`/industry/offers/${id}/issue`, { notes }),

  withdrawOffer: (id: string, notes?: string) =>
    apiClient.post<PlacementOffer>(`/industry/offers/${id}/withdraw`, { notes }),

  deleteOffer: (id: string) =>
    apiClient.delete<{ success: boolean; message: string }>(`/industry/offers/${id}`),

  // Student Endpoints
  getStudentOffers: (params?: QueryOffersParams) =>
    apiClient.get<PaginatedResponse<PlacementOffer>>(
      `/student/offers${buildQueryString(params)}`,
    ),

  getStudentOfferById: (id: string) =>
    apiClient.get<PlacementOffer>(`/student/offers/${id}`),

  acceptOffer: (id: string, notes?: string) =>
    apiClient.post<{ offer: PlacementOffer; placement: Placement }>(
      `/student/offers/${id}/accept`,
      { notes },
    ),

  declineOffer: (id: string, declineReason: string, notes?: string) =>
    apiClient.post<PlacementOffer>(`/student/offers/${id}/decline`, {
      declineReason,
      notes,
    }),

  getMyPlacements: () =>
    apiClient.get<Placement[]>('/student/placements/me'),

  // Institution Endpoints
  getInstitutionPlacements: (params?: QueryPlacementsParams) =>
    apiClient.get<PaginatedResponse<Placement>>(
      `/institution/placements${buildQueryString(params)}`,
    ),

  getInstitutionPlacementById: (id: string) =>
    apiClient.get<Placement>(`/institution/placements/${id}`),

  verifyPlacement: (
    id: string,
    payload: {
      nocIssued?: boolean;
      nocReferenceNumber?: string;
      verificationNotes?: string;
    },
  ) => apiClient.post<Placement>(`/institution/placements/${id}/verify`, payload),

  confirmJoining: (
    id: string,
    payload: { actualJoiningDate?: string; notes?: string },
  ) =>
    apiClient.post<Placement>(
      `/institution/placements/${id}/confirm-joining`,
      payload,
    ),

  revokePlacement: (id: string, reason: string) =>
    apiClient.post<Placement>(`/institution/placements/${id}/revoke`, { reason }),

  // Document Upload
  uploadOfferDocument: (
    offerId: string,
    payload: {
      originalFilename: string;
      mimeType: string;
      fileBase64: string;
      documentType?: PlacementDocumentType;
    },
  ) =>
    apiClient.post<{ id: string; originalFilename: string }>(
      `/placements/offers/${offerId}/documents`,
      payload,
    ),

  // Placement Analytics
  getPlacementAnalytics: (params?: Record<string, any>) =>
    apiClient.get<PlacementAnalyticsResponse>(
      `/analytics/placements${buildQueryString(params)}`,
    ),
};

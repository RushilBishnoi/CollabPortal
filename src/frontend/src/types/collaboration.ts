export type CollaborationType =
  | 'GUEST_LECTURE'
  | 'WORKSHOP'
  | 'FDP'
  | 'INDUSTRIAL_TRAINING'
  | 'RESEARCH'
  | 'CONSULTANCY'
  | 'LIVE_PROJECT';

export type CollaborationStatus =
  | 'DRAFT'
  | 'OPEN'
  | 'CLOSED'
  | 'CANCELLED'
  | 'COMPLETED';

export type ParticipationStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'WITHDRAWN'
  | 'COMPLETED'
  | 'CANCELLED';

export type CollaborationAudience = 'FACULTY' | 'STUDENT' | 'BOTH';

export type CollaborationMode = 'ONLINE' | 'IN_PERSON' | 'HYBRID';

export interface CollaborationIndustryInfo {
  id: string;
  companyName: string;
  industryType: string;
  description?: string | null;
  website?: string | null;
  headquarters?: string | null;
  isVerified?: boolean;
  contactEmail?: string | null;
  contactPhone?: string | null;
}

export interface Collaboration {
  id: string;
  industryProfileId: string;
  title: string;
  description: string;
  collaborationType: CollaborationType;
  status: CollaborationStatus;
  targetAudience: CollaborationAudience;
  mode: CollaborationMode;
  startDate?: string | null;
  endDate?: string | null;
  durationDays?: number | null;
  sessionCount?: number | null;
  location?: string | null;
  meetingLink?: string | null;
  maxParticipants?: number | null;
  eligibleDepartments: string[];
  domainTags: string[];
  stipend?: number | null;
  stipendCurrency: string;
  contactPerson?: string | null;
  contactEmail?: string | null;
  instructions?: string | null;
  deadline?: string | null;
  createdAt: string;
  updatedAt: string;
  industryProfile?: CollaborationIndustryInfo;
  _count?: {
    participations: number;
  };
}

export interface CollaborationStatusHistory {
  id: string;
  participationId: string;
  fromStatus: ParticipationStatus | null;
  toStatus: ParticipationStatus;
  changedByRole: string;
  changedById: string;
  notes?: string | null;
  createdAt: string;
}

export interface CollaborationParticipation {
  id: string;
  collaborationId: string;
  facultyProfileId?: string | null;
  studentProfileId?: string | null;
  status: ParticipationStatus;
  motivation?: string | null;
  relevantExperience?: string | null;
  industryNotes?: string | null;
  rejectionReason?: string | null;
  requestedAt: string;
  decidedAt?: string | null;
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  collaboration?: Partial<Collaboration>;
  facultyProfile?: {
    id: string;
    fullName: string;
    designation?: string | null;
    department?: string | null;
    areasOfExpertise?: string[];
    institution?: { id: string; name: string; code?: string | null } | null;
    user?: { email: string };
  };
  studentProfile?: {
    id: string;
    fullName: string;
    degree?: string | null;
    department?: string | null;
    graduationYear?: number | null;
    cgpa?: number | null;
    institution?: { id: string; name: string; code?: string | null } | null;
    user?: { email: string };
    studentSkills?: Array<{
      skill: { name: string };
    }>;
  };
  statusHistory?: CollaborationStatusHistory[];
}

export interface CollaborationListResponse {
  items: Collaboration[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ParticipationListResponse {
  items: CollaborationParticipation[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CollaborationAnalyticsResponse {
  scope: 'INSTITUTION' | 'PLATFORM';
  institution?: {
    id: string;
    name: string;
  };
  summary: {
    totalParticipations?: number;
    facultyParticipations?: number;
    studentParticipations?: number;
    approvedCount?: number;
    completedCount?: number;
    pendingCount?: number;
    activeIndustriesCount?: number;
    totalCollaborations?: number;
    activeCollaborations?: number;
    totalIndustries?: number;
  };
  byStatus?: Record<string, number>;
  byType?: Record<string, number>;
  collaborationStatus?: Record<string, number>;
  collaborationType?: Record<string, number>;
  targetAudience?: Record<string, number>;
  mode?: Record<string, number>;
  participationStatus?: Record<string, number>;
  participatingIndustries?: Array<{ companyName: string; count: number }>;
  topCollaboratingIndustries?: Array<{ companyName: string; count: number }>;
}

import { UserRole } from './api';

export type OfferStatus =
  | 'DRAFT'
  | 'ISSUED'
  | 'ACCEPTED'
  | 'DECLINED'
  | 'EXPIRED'
  | 'WITHDRAWN'
  | 'CANCELLED';

export type PlacementStatus =
  | 'PENDING_VERIFICATION'
  | 'VERIFIED'
  | 'CONFIRMED'
  | 'JOINED'
  | 'REVOKED';

export type PlacementDocumentType =
  | 'OFFER_LETTER'
  | 'JOINING_LETTER'
  | 'PAYSLIP'
  | 'NOC'
  | 'COMPLETION_CERTIFICATE'
  | 'OTHER';

export type EmploymentType =
  | 'FULL_TIME'
  | 'PART_TIME'
  | 'INTERNSHIP_TO_JOB'
  | 'CONTRACT'
  | 'INTERNSHIP';

export interface PlacementDocument {
  id: string;
  offerId?: string | null;
  placementId?: string | null;
  documentType: PlacementDocumentType;
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
  storageKey: string;
  uploadedByRole: UserRole;
  uploadedByUserId: string;
  createdAt: string;
}

export interface OfferStatusHistoryItem {
  id: string;
  offerId: string;
  fromStatus?: OfferStatus | null;
  toStatus: OfferStatus;
  changedByRole: string;
  changedById: string;
  notes?: string | null;
  createdAt: string;
}

export interface PlacementStatusHistoryItem {
  id: string;
  placementId: string;
  fromStatus?: PlacementStatus | null;
  toStatus: PlacementStatus;
  changedByRole: string;
  changedById: string;
  notes?: string | null;
  createdAt: string;
}

export interface PlacementOffer {
  id: string;
  applicationId: string;
  opportunityId: string;
  studentProfileId: string;
  industryProfileId: string;

  title: string;
  designation: string;
  employmentType: EmploymentType;
  status: OfferStatus;

  ctcAnnual?: number | null;
  baseSalaryMonthly?: number | null;
  stipendMonthly?: number | null;
  currency: string;

  joiningDate: string;
  offerExpiryDate: string;
  workLocation: string;
  workMode: string;
  department?: string | null;

  description?: string | null;
  termsAndConditions?: string | null;
  benefitsSummary?: string | null;

  contactPerson?: string | null;
  contactEmail?: string | null;

  studentResponseAt?: string | null;
  studentDeclineReason?: string | null;
  studentNotes?: string | null;

  issuedAt?: string | null;
  createdAt: string;
  updatedAt: string;

  opportunity?: {
    id: string;
    title: string;
    opportunityType: string;
  } | null;

  industryProfile?: {
    id: string;
    companyName: string;
    website?: string | null;
    industryType?: string | null;
  } | null;

  studentProfile?: {
    id: string;
    fullName: string;
    department?: string | null;
    degree?: string | null;
    graduationYear?: number | null;
    cgpa?: number | null;
    avatarUrl?: string | null;
    user?: {
      email: string;
    };
    institution?: {
      id: string;
      name: string;
      code?: string | null;
    } | null;
  } | null;

  placement?: Placement | null;
  documents?: PlacementDocument[];
  statusHistory?: OfferStatusHistoryItem[];
}

export interface Placement {
  id: string;
  offerId: string;
  studentProfileId: string;
  institutionId?: string | null;
  industryProfileId: string;

  status: PlacementStatus;

  verifiedByUserId?: string | null;
  verifiedAt?: string | null;
  verificationNotes?: string | null;
  nocIssued: boolean;
  nocReferenceNumber?: string | null;

  joiningConfirmed: boolean;
  joiningConfirmedAt?: string | null;
  actualJoiningDate?: string | null;

  annualCtcSnapshot?: number | null;
  companyNameSnapshot: string;
  jobTitleSnapshot: string;

  createdAt: string;
  updatedAt: string;

  offer?: PlacementOffer | null;
  studentProfile?: {
    id: string;
    fullName: string;
    department?: string | null;
    degree?: string | null;
    graduationYear?: number | null;
    cgpa?: number | null;
    user?: {
      email: string;
    };
  } | null;

  industryProfile?: {
    id: string;
    companyName: string;
    website?: string | null;
  } | null;

  documents?: PlacementDocument[];
  statusHistory?: PlacementStatusHistoryItem[];
}

export interface PlacementAnalyticsSummary {
  totalPlacements: number;
  pendingVerificationCount: number;
  verifiedCount: number;
  confirmedCount: number;
  joinedCount: number;
  revokedCount: number;
  totalOffers: number;
  issuedOffers: number;
  acceptedOffers: number;
  declinedOffers: number;
  expiredOffers: number;
  offerAcceptanceRate: number;
  averageCtcLpa: number;
  highestCtcLpa: number;
}

export interface DepartmentPlacementMetric {
  department: string;
  placedCount: number;
  averageCtcLpa: number;
}

export interface PlacementAnalyticsResponse {
  summary: PlacementAnalyticsSummary;
  departmentBreakdown: DepartmentPlacementMetric[];
}

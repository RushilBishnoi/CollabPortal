export type ApplicationStatus =
  | 'SAVED'
  | 'APPLIED'
  | 'UNDER_REVIEW'
  | 'SHORTLISTED'
  | 'INTERVIEW_SCHEDULED'
  | 'SELECTED'
  | 'REJECTED'
  | 'WITHDRAWN';

export type DocumentType = 'RESUME' | 'TRANSCRIPT' | 'CERTIFICATE' | 'OTHER';
export type InterviewMode = 'ONLINE_MEETING' | 'IN_PERSON' | 'TELEPHONIC';
export type InterviewStatus = 'SCHEDULED' | 'COMPLETED' | 'RESCHEDULED' | 'CANCELLED';

export interface ApplicationDocumentBrief {
  id: string;
  documentType: DocumentType;
  originalFilename: string;
  sizeBytes: number;
  mimeType?: string;
  createdAt: string;
}

export interface InterviewBrief {
  id: string;
  title: string;
  scheduledAt: string;
  durationMins: number;
  mode: InterviewMode;
  meetingLink?: string | null;
  interviewer?: string | null;
  instructions?: string | null;
  status: InterviewStatus;
  recruiterNotes?: string | null; // Only in recruiter responses
  rating?: number | null; // Only in recruiter responses
}

export interface ApplicationStatusHistoryBrief {
  id: string;
  fromStatus: ApplicationStatus | null;
  toStatus: ApplicationStatus;
  changedByRole?: string;
  changedById?: string;
  notes?: string | null;
  createdAt: string;
}

export interface StudentApplicationItem {
  id: string;
  status: ApplicationStatus;
  submittedAt: string;
  reviewedAt?: string | null;
  decidedAt?: string | null;
  matchScore: number;
  matchBreakdown?: any;
  coverLetter?: string | null;
  opportunity: {
    id: string;
    title: string;
    slug: string;
    opportunityType: string;
    location: string;
    isRemote: boolean;
    stipend?: number | null;
    stipendPeriod?: string;
    industryProfile: {
      id?: string;
      companyName: string;
      industryType?: string;
      website?: string | null;
      headquarters?: string | null;
      isVerified: boolean;
    };
    careerRole?: {
      id: string;
      title: string;
      category: string;
    } | null;
  };
  documents: ApplicationDocumentBrief[];
  interviews: InterviewBrief[];
  statusHistory: ApplicationStatusHistoryBrief[];
}

export interface RecruiterCandidateApplication {
  id: string;
  opportunityId: string;
  studentProfileId: string;
  status: ApplicationStatus;
  coverLetter?: string | null;
  matchScoreSnapshot: number;
  matchBreakdownSnapshot: any;
  recruiterNotes?: string | null;
  rejectionReason?: string | null;
  submittedAt: string;
  reviewedAt?: string | null;
  decidedAt?: string | null;
  studentProfile: {
    id: string;
    fullName: string;
    phoneNumber?: string | null;
    degree?: string | null;
    department?: string | null;
    graduationYear?: number | null;
    cgpa?: number | null;
    careerInterests?: string[];
    preferredRoles?: string[];
    user?: { email: string; createdAt: string };
    institution?: { id: string; name: string; code?: string | null } | null;
    studentSkills?: Array<{
      id?: string;
      skillId: string;
      proficiency: string;
      verificationStatus: string;
      skill: { id: string; name: string; category?: { name: string } };
    }>;
    experiences?: any[];
    projects?: any[];
    certifications?: any[];
  };
  opportunity?: {
    id: string;
    title: string;
    slug: string;
    opportunityType: string;
    status: string;
    positionsCount: number;
    skills?: any[];
  };
  documents: ApplicationDocumentBrief[];
  interviews: InterviewBrief[];
  statusHistory: ApplicationStatusHistoryBrief[];
}

export interface PaginatedApplications<T> {
  opportunity?: {
    id: string;
    title: string;
    slug: string;
    opportunityType: string;
    status: string;
    positionsCount: number;
  };
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

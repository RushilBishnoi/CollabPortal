import { UserRole } from './api';

export type MentorRoleType = 'INDUSTRY' | 'FACULTY';

export type MentorshipRequestStatus =
  | 'PENDING'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'WITHDRAWN'
  | 'CANCELLED';

export type MentorshipStatus = 'ACTIVE' | 'COMPLETED' | 'TERMINATED';

export type MentorshipSessionStatus =
  | 'SCHEDULED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'RESCHEDULED'
  | 'NO_SHOW';

export type MentorshipGoalStatus =
  | 'PENDING'
  | 'IN_PROGRESS'
  | 'ACHIEVED'
  | 'CANCELLED';

export interface MentorSkillBrief {
  id: string;
  skillId: string;
  skill: {
    id: string;
    name: string;
    category?: { id: string; name: string };
  };
}

export interface MentorCareerRoleBrief {
  id: string;
  careerRoleId: string;
  careerRole: {
    id: string;
    title: string;
    slug: string;
    category?: string;
  };
}

export interface MentorAvailabilitySlot {
  id?: string;
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  startTime: string; // "14:00"
  endTime: string; // "18:00"
  slotDurationMins: number;
  isRecurring?: boolean;
}

export interface CalculatedBookingSlot {
  startTime: string;
  endTime: string;
  scheduledAt: string;
  durationMinutes: number;
  isBooked: boolean;
}

export interface MentorProfile {
  id: string;
  userId: string;
  mentorRoleType: MentorRoleType;
  headline: string;
  bio: string;
  designation: string;
  companyOrInstitution: string;
  yearsOfExperience: number;
  maxMentees: number;
  isAvailable: boolean;
  defaultMeetingPlatform: string;
  defaultMeetingLink?: string | null;
  linkedInUrl?: string | null;
  githubUrl?: string | null;
  totalSessionsCompleted: number;
  averageRating: number;
  ratingCount: number;
  createdAt: string;
  updatedAt: string;
  user?: {
    email: string;
    avatarUrl?: string | null;
  };
  skills?: MentorSkillBrief[];
  careerRoles?: MentorCareerRoleBrief[];
  availabilities?: MentorAvailabilitySlot[];
  _count?: {
    mentorships?: number;
    mentorshipRequests?: number;
    sessions?: number;
  };
}

export interface MentorshipRequest {
  id: string;
  mentorProfileId: string;
  studentProfileId: string;
  status: MentorshipRequestStatus;
  statementOfPurpose: string;
  targetCareerRoleId?: string | null;
  expectedDurationWeeks: number;
  rejectionReason?: string | null;
  mentorResponseNotes?: string | null;
  respondedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  mentorProfile?: MentorProfile;
  studentProfile?: {
    id: string;
    fullName: string;
    user?: { email: string; avatarUrl?: string | null };
    institution?: { name: string };
  };
  targetCareerRole?: {
    id: string;
    title: string;
  } | null;
  mentorship?: Mentorship | null;
}

export interface MentorshipGoal {
  id: string;
  mentorshipId: string;
  title: string;
  description?: string | null;
  targetDate?: string | null;
  status: MentorshipGoalStatus;
  linkedSkillId?: string | null;
  linkedLearningPathId?: string | null;
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  linkedSkill?: { id: string; name: string } | null;
  linkedLearningPath?: { id: string; title: string; slug: string } | null;
}

export interface MentorshipSession {
  id: string;
  mentorshipId?: string | null;
  mentorProfileId: string;
  studentProfileId: string;
  title: string;
  description?: string | null;
  scheduledAt: string;
  durationMinutes: number;
  status: MentorshipSessionStatus;
  meetingPlatform: string;
  meetingLink?: string | null;
  location?: string | null;
  mentorNotes?: string | null;
  studentNotes?: string | null;
  sharedSummary?: string | null;
  studentRating?: number | null;
  studentFeedback?: string | null;
  cancellationReason?: string | null;
  cancelledByRole?: UserRole | null;
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  mentorProfile?: MentorProfile;
  studentProfile?: {
    id: string;
    fullName: string;
    user?: { email: string; avatarUrl?: string | null };
  };
  mentorship?: Mentorship | null;
}

export interface Mentorship {
  id: string;
  requestId: string;
  mentorProfileId: string;
  studentProfileId: string;
  status: MentorshipStatus;
  startDate: string;
  endDate?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  mentorProfile?: MentorProfile;
  studentProfile?: {
    id: string;
    fullName: string;
    user?: { email: string; avatarUrl?: string | null };
    institution?: { name: string };
  };
  goals?: MentorshipGoal[];
  sessions?: MentorshipSession[];
}

export interface MentorshipAnalytics {
  summary: {
    totalMentors: number;
    industryMentors: number;
    facultyMentors: number;
    activeMentorships: number;
    completedMentorships: number;
    totalSessions: number;
    completedSessions: number;
    cancelledSessions: number;
    noShowSessions: number;
    sessionCompletionRate: number;
    averageMentorRating: number;
  };
  topMentorshipSkills: Array<{
    skillId: string;
    name: string;
    count: number;
  }>;
}

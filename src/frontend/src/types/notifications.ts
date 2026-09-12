export type NotificationPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

export type NotificationType =
  // Identity & Auth
  | 'WELCOME'
  | 'ACCOUNT_STATUS_CHANGED'
  | 'PASSWORD_RESET_REQUESTED'
  // Profile & Verification
  | 'PROFILE_UPDATED'
  | 'PROFILE_VERIFIED'
  | 'INSTITUTION_VERIFIED'
  // Opportunities & Applications
  | 'OPPORTUNITY_PUBLISHED'
  | 'APPLICATION_SUBMITTED'
  | 'APPLICATION_STATUS_CHANGED'
  | 'APPLICATION_SHORTLISTED'
  | 'APPLICATION_SELECTED'
  | 'APPLICATION_REJECTED'
  // Assessments & Skill Gap
  | 'ASSESSMENT_ASSIGNED'
  | 'ASSESSMENT_COMPLETED'
  | 'SKILL_GAP_ANALYZED'
  | 'LEARNING_PATH_RECOMMENDED'
  // Interviews
  | 'INTERVIEW_SCHEDULED'
  | 'INTERVIEW_UPDATED'
  | 'INTERVIEW_CANCELLED'
  | 'INTERVIEW_FEEDBACK_SUBMITTED'
  // Placements & Offers
  | 'PLACEMENT_OFFER_ISSUED'
  | 'PLACEMENT_OFFER_ACCEPTED'
  | 'PLACEMENT_OFFER_DECLINED'
  | 'PLACEMENT_VERIFIED'
  | 'PLACEMENT_CONFIRMED'
  | 'PLACEMENT_JOINED'
  | 'PLACEMENT_REVOKED'
  | 'PLACEMENT_VERIFICATION_REQUIRED'
  // Collaborations
  | 'COLLABORATION_PUBLISHED'
  | 'COLLABORATION_PARTICIPATION_REQUESTED'
  | 'COLLABORATION_PARTICIPATION_APPROVED'
  | 'COLLABORATION_PARTICIPATION_REJECTED'
  | 'COLLABORATION_STATUS_CHANGED'
  | 'COLLABORATION_PROGRESS_UPDATED'
  // Mentorship
  | 'MENTOR_REQUEST_RECEIVED'
  | 'MENTOR_REQUEST_ACCEPTED'
  | 'MENTOR_REQUEST_REJECTED'
  | 'MENTORSHIP_STARTED'
  | 'MENTORSHIP_SESSION_SCHEDULED'
  | 'MENTORSHIP_SESSION_RESCHEDULED'
  | 'MENTORSHIP_SESSION_CANCELLED'
  | 'MENTORSHIP_SESSION_COMPLETED'
  | 'MENTORSHIP_FEEDBACK_RECEIVED'
  // Learning & Credentials
  | 'LEARNING_PATH_ENROLLED'
  | 'LEARNING_PATH_COMPLETED'
  // System Announcements
  | 'SYSTEM_ANNOUNCEMENT';

export interface Notification {
  id: string;
  recipientUserId: string;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  entityType?: string | null;
  entityId?: string | null;
  actionUrl?: string | null;
  metadata?: Record<string, unknown> | null;
  isRead: boolean;
  readAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationPreference {
  id?: string;
  userId?: string;
  notificationType: NotificationType;
  inAppEnabled: boolean;
  isMandatory: boolean;
  defaultPriority: NotificationPriority;
}

export interface NotificationPreferenceItem {
  notificationType: NotificationType;
  inAppEnabled: boolean;
}

export interface QueryNotificationsParams {
  page?: number;
  limit?: number;
  unreadOnly?: boolean;
  type?: NotificationType;
  priority?: NotificationPriority;
}

export interface NotificationsListResponse {
  items: Notification[];
  total: number;
  unreadCount: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface UnreadCountResponse {
  unreadCount: number;
}

export interface CreateAnnouncementPayload {
  title: string;
  message: string;
  priority?: NotificationPriority;
  targetRole?: string;
  actionUrl?: string;
}

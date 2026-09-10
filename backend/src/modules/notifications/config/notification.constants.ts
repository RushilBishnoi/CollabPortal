import { NotificationType, NotificationPriority } from '@prisma/client';

export const MANDATORY_NOTIFICATION_TYPES: ReadonlySet<NotificationType> = new Set([
  NotificationType.PLACEMENT_OFFER_ISSUED,
  NotificationType.PLACEMENT_VERIFIED,
  NotificationType.PLACEMENT_REVOKED,
  NotificationType.INTERVIEW_SCHEDULED,
  NotificationType.APPLICATION_SELECTED,
  NotificationType.MENTORSHIP_SESSION_CANCELLED,
  NotificationType.SYSTEM_ANNOUNCEMENT,
]);

export const DEFAULT_NOTIFICATION_PRIORITIES: Record<NotificationType, NotificationPriority> = {
  // Recruitment & Applications
  [NotificationType.APPLICATION_SUBMITTED]: NotificationPriority.NORMAL,
  [NotificationType.APPLICATION_STATUS_CHANGED]: NotificationPriority.NORMAL,
  [NotificationType.APPLICATION_SHORTLISTED]: NotificationPriority.HIGH,
  [NotificationType.APPLICATION_SELECTED]: NotificationPriority.URGENT,
  [NotificationType.APPLICATION_REJECTED]: NotificationPriority.NORMAL,
  [NotificationType.INTERVIEW_SCHEDULED]: NotificationPriority.HIGH,
  [NotificationType.INTERVIEW_UPDATED]: NotificationPriority.HIGH,
  [NotificationType.OPPORTUNITY_PUBLISHED]: NotificationPriority.LOW,

  // Collaboration
  [NotificationType.COLLABORATION_PARTICIPATION_REQUESTED]: NotificationPriority.NORMAL,
  [NotificationType.COLLABORATION_PARTICIPATION_APPROVED]: NotificationPriority.HIGH,
  [NotificationType.COLLABORATION_PARTICIPATION_REJECTED]: NotificationPriority.NORMAL,
  [NotificationType.COLLABORATION_STATUS_CHANGED]: NotificationPriority.NORMAL,

  // Learning
  [NotificationType.LEARNING_PATH_ENROLLED]: NotificationPriority.LOW,
  [NotificationType.LEARNING_PATH_COMPLETED]: NotificationPriority.NORMAL,
  [NotificationType.SKILL_GAP_REMEDIATION_AVAILABLE]: NotificationPriority.NORMAL,

  // Placement
  [NotificationType.PLACEMENT_OFFER_ISSUED]: NotificationPriority.URGENT,
  [NotificationType.PLACEMENT_OFFER_ACCEPTED]: NotificationPriority.HIGH,
  [NotificationType.PLACEMENT_OFFER_DECLINED]: NotificationPriority.NORMAL,
  [NotificationType.PLACEMENT_VERIFICATION_REQUIRED]: NotificationPriority.HIGH,
  [NotificationType.PLACEMENT_VERIFIED]: NotificationPriority.HIGH,
  [NotificationType.PLACEMENT_CONFIRMED]: NotificationPriority.HIGH,
  [NotificationType.PLACEMENT_JOINED]: NotificationPriority.HIGH,
  [NotificationType.PLACEMENT_REVOKED]: NotificationPriority.URGENT,

  // Mentorship
  [NotificationType.MENTOR_REQUEST_RECEIVED]: NotificationPriority.HIGH,
  [NotificationType.MENTOR_REQUEST_ACCEPTED]: NotificationPriority.HIGH,
  [NotificationType.MENTOR_REQUEST_REJECTED]: NotificationPriority.NORMAL,
  [NotificationType.MENTORSHIP_STARTED]: NotificationPriority.HIGH,
  [NotificationType.MENTORSHIP_SESSION_SCHEDULED]: NotificationPriority.HIGH,
  [NotificationType.MENTORSHIP_SESSION_RESCHEDULED]: NotificationPriority.HIGH,
  [NotificationType.MENTORSHIP_SESSION_CANCELLED]: NotificationPriority.URGENT,
  [NotificationType.MENTORSHIP_SESSION_COMPLETED]: NotificationPriority.NORMAL,

  // System
  [NotificationType.SYSTEM_ANNOUNCEMENT]: NotificationPriority.HIGH,
};

export const NOTIFICATION_PAGINATION_DEFAULTS = {
  PAGE: 1,
  LIMIT: 20,
  MAX_LIMIT: 100,
} as const;

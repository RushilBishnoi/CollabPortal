import {
  MentorshipRequestStatus,
  MentorshipStatus,
  MentorshipSessionStatus,
  MentorshipGoalStatus,
} from '@prisma/client';

export const MENTORSHIP_PAGINATION_DEFAULTS = {
  PAGE: 1,
  LIMIT: 10,
  MAX_LIMIT: 50,
} as const;

export const MENTORSHIP_VALIDATION_LIMITS = {
  MIN_MINUTES_IN_FUTURE: 15, // Sessions must be scheduled at least 15 mins in future
  DEFAULT_SLOT_DURATION_MINS: 45,
  MIN_SLOT_DURATION_MINS: 15,
  MAX_SLOT_DURATION_MINS: 180,
  DEFAULT_MAX_MENTEES: 5,
  MAX_MAX_MENTEES: 50,
  MIN_RATING: 1,
  MAX_RATING: 5,
} as const;

export const VALID_REQUEST_TRANSITIONS: Record<
  MentorshipRequestStatus,
  MentorshipRequestStatus[]
> = {
  [MentorshipRequestStatus.PENDING]: [
    MentorshipRequestStatus.ACCEPTED,
    MentorshipRequestStatus.REJECTED,
    MentorshipRequestStatus.WITHDRAWN,
    MentorshipRequestStatus.CANCELLED,
  ],
  [MentorshipRequestStatus.ACCEPTED]: [],
  [MentorshipRequestStatus.REJECTED]: [],
  [MentorshipRequestStatus.WITHDRAWN]: [],
  [MentorshipRequestStatus.CANCELLED]: [],
};

export const VALID_MENTORSHIP_TRANSITIONS: Record<
  MentorshipStatus,
  MentorshipStatus[]
> = {
  [MentorshipStatus.ACTIVE]: [
    MentorshipStatus.COMPLETED,
    MentorshipStatus.TERMINATED,
  ],
  [MentorshipStatus.COMPLETED]: [],
  [MentorshipStatus.TERMINATED]: [],
};

export const VALID_SESSION_TRANSITIONS: Record<
  MentorshipSessionStatus,
  MentorshipSessionStatus[]
> = {
  [MentorshipSessionStatus.SCHEDULED]: [
    MentorshipSessionStatus.COMPLETED,
    MentorshipSessionStatus.CANCELLED,
    MentorshipSessionStatus.RESCHEDULED,
    MentorshipSessionStatus.NO_SHOW,
  ],
  [MentorshipSessionStatus.RESCHEDULED]: [
    MentorshipSessionStatus.COMPLETED,
    MentorshipSessionStatus.CANCELLED,
    MentorshipSessionStatus.NO_SHOW,
  ],
  [MentorshipSessionStatus.COMPLETED]: [],
  [MentorshipSessionStatus.CANCELLED]: [],
  [MentorshipSessionStatus.NO_SHOW]: [],
};

export const VALID_GOAL_TRANSITIONS: Record<
  MentorshipGoalStatus,
  MentorshipGoalStatus[]
> = {
  [MentorshipGoalStatus.PENDING]: [
    MentorshipGoalStatus.IN_PROGRESS,
    MentorshipGoalStatus.ACHIEVED,
    MentorshipGoalStatus.CANCELLED,
  ],
  [MentorshipGoalStatus.IN_PROGRESS]: [
    MentorshipGoalStatus.ACHIEVED,
    MentorshipGoalStatus.CANCELLED,
  ],
  [MentorshipGoalStatus.ACHIEVED]: [],
  [MentorshipGoalStatus.CANCELLED]: [],
};

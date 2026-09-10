import { CollaborationStatus, ParticipationStatus } from '@prisma/client';

export const COLLABORATION_STATUS_TRANSITIONS: Record<CollaborationStatus, CollaborationStatus[]> = {
  [CollaborationStatus.DRAFT]: [CollaborationStatus.OPEN, CollaborationStatus.CANCELLED],
  [CollaborationStatus.OPEN]: [CollaborationStatus.CLOSED, CollaborationStatus.CANCELLED],
  [CollaborationStatus.CLOSED]: [CollaborationStatus.COMPLETED, CollaborationStatus.CANCELLED],
  [CollaborationStatus.COMPLETED]: [],
  [CollaborationStatus.CANCELLED]: [],
};

export const PARTICIPATION_STATUS_TRANSITIONS: Record<ParticipationStatus, ParticipationStatus[]> = {
  [ParticipationStatus.PENDING]: [
    ParticipationStatus.APPROVED,
    ParticipationStatus.REJECTED,
    ParticipationStatus.WITHDRAWN,
  ],
  [ParticipationStatus.APPROVED]: [
    ParticipationStatus.COMPLETED,
    ParticipationStatus.CANCELLED,
    ParticipationStatus.WITHDRAWN,
  ],
  [ParticipationStatus.REJECTED]: [],
  [ParticipationStatus.WITHDRAWN]: [],
  [ParticipationStatus.COMPLETED]: [],
  [ParticipationStatus.CANCELLED]: [],
};

export const COLLABORATION_PAGINATION_DEFAULTS = {
  PAGE: 1,
  LIMIT: 10,
  MAX_LIMIT: 100,
};

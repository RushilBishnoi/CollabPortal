import { OfferStatus, PlacementStatus } from '@prisma/client';

export const ALLOWED_OFFER_TRANSITIONS: Record<OfferStatus, OfferStatus[]> = {
  [OfferStatus.DRAFT]: [OfferStatus.ISSUED, OfferStatus.CANCELLED],
  [OfferStatus.ISSUED]: [
    OfferStatus.ACCEPTED,
    OfferStatus.DECLINED,
    OfferStatus.EXPIRED,
    OfferStatus.WITHDRAWN,
  ],
  [OfferStatus.ACCEPTED]: [],   // Terminal offer state -> triggers Placement creation
  [OfferStatus.DECLINED]: [],   // Terminal state
  [OfferStatus.EXPIRED]: [],    // Terminal state
  [OfferStatus.WITHDRAWN]: [],  // Terminal state
  [OfferStatus.CANCELLED]: [],  // Terminal state
};

export const ALLOWED_PLACEMENT_TRANSITIONS: Record<PlacementStatus, PlacementStatus[]> = {
  [PlacementStatus.PENDING_VERIFICATION]: [
    PlacementStatus.VERIFIED,
    PlacementStatus.CONFIRMED,
    PlacementStatus.REVOKED,
  ],
  [PlacementStatus.VERIFIED]: [
    PlacementStatus.CONFIRMED,
    PlacementStatus.JOINED,
    PlacementStatus.REVOKED,
  ],
  [PlacementStatus.CONFIRMED]: [
    PlacementStatus.JOINED,
    PlacementStatus.REVOKED,
  ],
  [PlacementStatus.JOINED]: [
    PlacementStatus.REVOKED,
  ],
  [PlacementStatus.REVOKED]: [], // Terminal state
};

export const PLACEMENT_DOCUMENT_CONFIG = {
  MAX_FILE_SIZE_BYTES: 5 * 1024 * 1024, // 5 MB
  ALLOWED_MIME_TYPES: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ],
  ALLOWED_EXTENSIONS: ['.pdf', '.doc', '.docx'],
} as const;

export const PLACEMENT_PAGINATION_DEFAULTS = {
  PAGE: 1,
  LIMIT: 20,
  MAX_LIMIT: 100,
} as const;

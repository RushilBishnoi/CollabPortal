import { SetMetadata } from '@nestjs/common';

export interface RateLimitOptions {
  points: number; // Max requests allowed
  durationSeconds: number; // Sliding window duration in seconds
  errorMessage?: string; // Custom error message
}

export const RATE_LIMIT_KEY = 'rate_limit';

export const RateLimit = (options: RateLimitOptions) =>
  SetMetadata(RATE_LIMIT_KEY, options);

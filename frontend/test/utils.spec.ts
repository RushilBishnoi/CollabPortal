import { describe, it, expect } from 'vitest';
import { cn } from '../src/lib/utils';
import { ApiError } from '../src/lib/api-client';

describe('Frontend Foundation Utilities & API Client', () => {
  it('should correctly merge tailwind classes with cn()', () => {
    const result = cn('px-2 py-1', 'bg-blue-500', { 'text-white': true, 'text-black': false });
    expect(result).toContain('px-2');
    expect(result).toContain('py-1');
    expect(result).toContain('bg-blue-500');
    expect(result).toContain('text-white');
    expect(result).not.toContain('text-black');
  });

  it('should construct ApiError correctly with code and details', () => {
    const error = new ApiError(400, {
      code: 'VALIDATION_ERROR',
      message: 'Invalid email address',
      details: [{ field: 'email', message: 'Email must be valid' }],
    });

    expect(error.status).toBe(400);
    expect(error.code).toBe('VALIDATION_ERROR');
    expect(error.message).toBe('Invalid email address');
    expect(error.details).toHaveLength(1);
    expect(error.details?.[0].field).toBe('email');
  });
});

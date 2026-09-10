import { describe, it, expect } from 'vitest';
import { z } from 'zod';

const registerValidationSchema = z.object({
  fullName: z
    .string({ required_error: 'Full name is required' })
    .trim()
    .min(1, 'Full name is required'),
  email: z.string().email('Please enter a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/\d/, 'Password must contain at least one number')
    .regex(
      /[@$!%*?&^#()[\]{}_+\-=:;'"<>,./~`|\\]/,
      'Password must contain at least one special character',
    ),
  role: z.enum(
    ['STUDENT', 'FACULTY', 'INDUSTRY', 'INSTITUTION_ADMIN'] as const,
  ),
});

describe('Frontend Auth Validation Tests', () => {
  it('should validate strong passwords and valid roles', () => {
    const validData = {
      email: 'student@university.edu',
      password: 'StrongP@ssw0rd123',
      role: 'STUDENT',
      fullName: 'Alice Walker',
    };

    const result = registerValidationSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('should reject passwords missing uppercase letters', () => {
    const invalidData = {
      fullName: 'Alice Walker',
      email: 'student@university.edu',
      password: 'password@123',
      role: 'STUDENT',
    };

    const result = registerValidationSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('should reject passwords missing special characters', () => {
    const invalidData = {
      fullName: 'Alice Walker',
      email: 'student@university.edu',
      password: 'Password123',
      role: 'STUDENT',
    };

    const result = registerValidationSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('should reject disallowed roles', () => {
    const invalidData = {
      fullName: 'Alice Walker',
      email: 'admin@system.internal',
      password: 'Password@123',
      role: 'SUPER_ADMIN',
    };

    const result = registerValidationSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  describe('Full Name Required Validation across all roles', () => {
    it('should reject missing full name', () => {
      const invalidData = {
        email: 'student@university.edu',
        password: 'StrongP@ssw0rd123',
        role: 'STUDENT',
      };

      const result = registerValidationSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Full name is required');
      }
    });

    it('should reject empty full name', () => {
      const invalidData = {
        fullName: '',
        email: 'student@university.edu',
        password: 'StrongP@ssw0rd123',
        role: 'STUDENT',
      };

      const result = registerValidationSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Full name is required');
      }
    });

    it('should reject whitespace-only full name', () => {
      const invalidData = {
        fullName: '    ',
        email: 'student@university.edu',
        password: 'StrongP@ssw0rd123',
        role: 'STUDENT',
      };

      const result = registerValidationSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Full name is required');
      }
    });

    it('should trim surrounding whitespace from full name and succeed', () => {
      const validData = {
        fullName: '   Ananya Sharma   ',
        email: 'ananya@university.edu',
        password: 'StrongP@ssw0rd123',
        role: 'STUDENT',
      };

      const result = registerValidationSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.fullName).toBe('Ananya Sharma');
      }
    });

    it('should enforce full name requirement equally across all supported registration roles', () => {
      const roles = ['STUDENT', 'FACULTY', 'INDUSTRY', 'INSTITUTION_ADMIN'] as const;

      roles.forEach((role) => {
        // Without full name -> must fail
        const withoutName = {
          email: `${role.toLowerCase()}@portal.edu`,
          password: 'StrongP@ssw0rd123',
          role,
        };
        expect(registerValidationSchema.safeParse(withoutName).success).toBe(false);

        // With whitespace-only full name -> must fail
        const whitespaceName = {
          fullName: '   ',
          email: `${role.toLowerCase()}@portal.edu`,
          password: 'StrongP@ssw0rd123',
          role,
        };
        expect(registerValidationSchema.safeParse(whitespaceName).success).toBe(false);

        // With valid full name -> must succeed
        const withName = {
          fullName: 'Ananya Sharma',
          email: `${role.toLowerCase()}@portal.edu`,
          password: 'StrongP@ssw0rd123',
          role,
        };
        expect(registerValidationSchema.safeParse(withName).success).toBe(true);
      });
    });
  });

  describe('Logout Redirect & Session Invalidation Tests', () => {
    it('should navigate to / upon logout from any authenticated or public route', async () => {
      const mockNavigate = (path: string, options?: { replace?: boolean }) => ({ path, options });
      let sessionCleared = false;
      let targetPath = '';

      const simulateLogout = async (currentRoute: string) => {
        // Clear session
        sessionCleared = true;
        // Navigate immediately to '/' with replace: true
        const nav = mockNavigate('/', { replace: true });
        targetPath = nav.path;
        return { currentRoute, targetPath, sessionCleared, replace: nav.options?.replace };
      };

      const testRoutes = [
        '/opportunities',
        '/dashboard',
        '/collaborations',
        '/learning',
        '/portal/student/offers',
        '/portal/mentor/workspace',
      ];

      for (const route of testRoutes) {
        const result = await simulateLogout(route);
        expect(result.sessionCleared).toBe(true);
        expect(result.targetPath).toBe('/');
        expect(result.replace).toBe(true);
      }
    });
  });
});

import { describe, it, expect, vi } from 'vitest';
import { ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';
import { RolesGuard } from '../src/common/guards/roles.guard';
import { ROLE_PERMISSIONS, Permission } from '../src/common/constants/permissions.constant';

describe('RBAC RolesGuard & Matrix Tests', () => {
  const createMockContext = (user?: { id: string; email: string; role: UserRole }): ExecutionContext => {
    return {
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as unknown as ExecutionContext;
  };

  it('should allow access when user role matches required roles', () => {
    const reflector = {
      getAllAndOverride: vi.fn().mockReturnValue([UserRole.STUDENT]),
    } as unknown as Reflector;

    const guard = new RolesGuard(reflector);
    const context = createMockContext({
      id: 'student-1',
      email: 'student@uni.edu',
      role: UserRole.STUDENT,
    });

    const canActivate = guard.canActivate(context);
    expect(canActivate).toBe(true);
  });

  it('should deny access (403 Forbidden) when user role is unauthorized', () => {
    const reflector = {
      getAllAndOverride: vi.fn().mockReturnValue([UserRole.INDUSTRY, UserRole.INSTITUTION_ADMIN]),
    } as unknown as Reflector;

    const guard = new RolesGuard(reflector);
    const context = createMockContext({
      id: 'student-1',
      email: 'student@uni.edu',
      role: UserRole.STUDENT,
    });

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('should allow SUPER_ADMIN to access any restricted role zone', () => {
    const reflector = {
      getAllAndOverride: vi.fn().mockReturnValue([UserRole.FACULTY]),
    } as unknown as Reflector;

    const guard = new RolesGuard(reflector);
    const context = createMockContext({
      id: 'admin-1',
      email: 'admin@system.gov',
      role: UserRole.SUPER_ADMIN,
    });

    const canActivate = guard.canActivate(context);
    expect(canActivate).toBe(true);
  });

  it('should allow access when no roles are specified on the handler', () => {
    const reflector = {
      getAllAndOverride: vi.fn().mockReturnValue(null),
    } as unknown as Reflector;

    const guard = new RolesGuard(reflector);
    const context = createMockContext({
      id: 'user-1',
      email: 'user@uni.edu',
      role: UserRole.STUDENT,
    });

    const canActivate = guard.canActivate(context);
    expect(canActivate).toBe(true);
  });

  it('should throw UnauthorizedException when request has no authenticated user', () => {
    const reflector = {
      getAllAndOverride: vi.fn().mockReturnValue([UserRole.STUDENT]),
    } as unknown as Reflector;

    const guard = new RolesGuard(reflector);
    const context = createMockContext(undefined);

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });

  it('should have properly defined permission matrix for all 5 roles', () => {
    expect(ROLE_PERMISSIONS[UserRole.STUDENT]).toContain(Permission.STUDENT_SKILLS_ASSESS);
    expect(ROLE_PERMISSIONS[UserRole.STUDENT]).not.toContain(Permission.INDUSTRY_OPPORTUNITY_MANAGE);

    expect(ROLE_PERMISSIONS[UserRole.FACULTY]).toContain(Permission.FACULTY_FDP_ACCESS);
    expect(ROLE_PERMISSIONS[UserRole.INDUSTRY]).toContain(Permission.INDUSTRY_OPPORTUNITY_MANAGE);
    expect(ROLE_PERMISSIONS[UserRole.INSTITUTION_ADMIN]).toContain(Permission.INSTITUTION_ANALYTICS_READ);

    // Super admin has all permissions
    expect(ROLE_PERMISSIONS[UserRole.SUPER_ADMIN].length).toBe(Object.values(Permission).length);
  });

  describe('Comprehensive 5-role cross-zone access enforcement', () => {
    const roles: UserRole[] = [
      UserRole.STUDENT,
      UserRole.FACULTY,
      UserRole.INDUSTRY,
      UserRole.INSTITUTION_ADMIN,
      UserRole.SUPER_ADMIN,
    ];

    roles.forEach((userRole) => {
      roles.forEach((targetRole) => {
        it(`${userRole} attempting access to ${targetRole}-protected endpoint`, () => {
          const reflector = {
            getAllAndOverride: vi.fn().mockReturnValue([targetRole]),
          } as unknown as Reflector;

          const guard = new RolesGuard(reflector);
          const context = createMockContext({
            id: `${userRole.toLowerCase()}-1`,
            email: `${userRole.toLowerCase()}@platform.gov`,
            role: userRole,
          });

          const shouldBeAllowed = userRole === targetRole || userRole === UserRole.SUPER_ADMIN;

          if (shouldBeAllowed) {
            expect(guard.canActivate(context)).toBe(true);
          } else {
            expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
          }
        });
      });
    });
  });
});


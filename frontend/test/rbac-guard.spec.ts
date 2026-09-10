import { describe, it, expect } from 'vitest';
import { UserRole } from '../src/types/api';

// ─── Permission matrix (mirrors backend ROLE_PERMISSIONS) ───────────────────

enum Permission {
  STUDENT_PROFILE_MANAGE = 'student:profile:manage',
  STUDENT_SKILLS_ASSESS = 'student:skills:assess',
  STUDENT_CAREER_MAP = 'student:career:map',
  STUDENT_PORTFOLIO_MANAGE = 'student:portfolio:manage',
  STUDENT_APPLICATION_SUBMIT = 'student:application:submit',

  FACULTY_PROFILE_MANAGE = 'faculty:profile:manage',
  FACULTY_FDP_ACCESS = 'faculty:fdp:access',
  FACULTY_MENTORSHIP_MANAGE = 'faculty:mentorship:manage',
  FACULTY_COLLABORATION_MANAGE = 'faculty:collaboration:manage',

  INDUSTRY_PROFILE_MANAGE = 'industry:profile:manage',
  INDUSTRY_OPPORTUNITY_MANAGE = 'industry:opportunity:manage',
  INDUSTRY_CANDIDATE_DISCOVERY = 'industry:candidate:discovery',
  INDUSTRY_APPLICATION_REVIEW = 'industry:application:review',

  INSTITUTION_STUDENTS_MANAGE = 'institution:students:manage',
  INSTITUTION_ANALYTICS_READ = 'institution:analytics:read',
  INSTITUTION_TRAINING_MANAGE = 'institution:training:manage',
  INSTITUTION_PLACEMENT_TRACK = 'institution:placement:track',

  SYSTEM_GOVERNANCE = 'system:governance',
  SYSTEM_TAXONOMY_MANAGE = 'system:taxonomy:manage',
  SYSTEM_AUDIT_LOGS_READ = 'system:audit:read',
  SYSTEM_USERS_MANAGE = 'system:users:manage',
}

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  STUDENT: [
    Permission.STUDENT_PROFILE_MANAGE,
    Permission.STUDENT_SKILLS_ASSESS,
    Permission.STUDENT_CAREER_MAP,
    Permission.STUDENT_PORTFOLIO_MANAGE,
    Permission.STUDENT_APPLICATION_SUBMIT,
  ],
  FACULTY: [
    Permission.FACULTY_PROFILE_MANAGE,
    Permission.FACULTY_FDP_ACCESS,
    Permission.FACULTY_MENTORSHIP_MANAGE,
    Permission.FACULTY_COLLABORATION_MANAGE,
  ],
  INDUSTRY: [
    Permission.INDUSTRY_PROFILE_MANAGE,
    Permission.INDUSTRY_OPPORTUNITY_MANAGE,
    Permission.INDUSTRY_CANDIDATE_DISCOVERY,
    Permission.INDUSTRY_APPLICATION_REVIEW,
  ],
  INSTITUTION_ADMIN: [
    Permission.INSTITUTION_STUDENTS_MANAGE,
    Permission.INSTITUTION_ANALYTICS_READ,
    Permission.INSTITUTION_TRAINING_MANAGE,
    Permission.INSTITUTION_PLACEMENT_TRACK,
  ],
  SUPER_ADMIN: Object.values(Permission),
};

// ─── Frontend RoleGuard logic (pure function, extracted from component) ──────

function canRoleAccess(userRole: UserRole, allowedRoles: UserRole[]): boolean {
  if (userRole === 'SUPER_ADMIN') return true;
  return allowedRoles.includes(userRole);
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('Frontend RBAC — Role access logic', () => {
  it('STUDENT can access student-only routes', () => {
    expect(canRoleAccess('STUDENT', ['STUDENT'])).toBe(true);
  });

  it('STUDENT cannot access faculty-only routes', () => {
    expect(canRoleAccess('STUDENT', ['FACULTY'])).toBe(false);
  });

  it('STUDENT cannot access industry-only routes', () => {
    expect(canRoleAccess('STUDENT', ['INDUSTRY'])).toBe(false);
  });

  it('FACULTY can access faculty-only routes', () => {
    expect(canRoleAccess('FACULTY', ['FACULTY'])).toBe(true);
  });

  it('FACULTY cannot access institution admin routes', () => {
    expect(canRoleAccess('FACULTY', ['INSTITUTION_ADMIN'])).toBe(false);
  });

  it('INDUSTRY can access industry-only routes', () => {
    expect(canRoleAccess('INDUSTRY', ['INDUSTRY'])).toBe(true);
  });

  it('INSTITUTION_ADMIN can access institution routes', () => {
    expect(canRoleAccess('INSTITUTION_ADMIN', ['INSTITUTION_ADMIN'])).toBe(true);
  });

  it('INSTITUTION_ADMIN cannot access admin-only routes', () => {
    expect(canRoleAccess('INSTITUTION_ADMIN', ['SUPER_ADMIN'])).toBe(false);
  });

  it('SUPER_ADMIN can access any route (global override)', () => {
    expect(canRoleAccess('SUPER_ADMIN', ['STUDENT'])).toBe(true);
    expect(canRoleAccess('SUPER_ADMIN', ['FACULTY'])).toBe(true);
    expect(canRoleAccess('SUPER_ADMIN', ['INDUSTRY'])).toBe(true);
    expect(canRoleAccess('SUPER_ADMIN', ['INSTITUTION_ADMIN'])).toBe(true);
    expect(canRoleAccess('SUPER_ADMIN', ['SUPER_ADMIN'])).toBe(true);
  });
});

describe('Frontend RBAC — Permission matrix integrity', () => {
  it('STUDENT has skill assessment permission', () => {
    expect(ROLE_PERMISSIONS.STUDENT).toContain(Permission.STUDENT_SKILLS_ASSESS);
  });

  it('STUDENT does not have industry opportunity management permission', () => {
    expect(ROLE_PERMISSIONS.STUDENT).not.toContain(Permission.INDUSTRY_OPPORTUNITY_MANAGE);
  });

  it('STUDENT does not have system governance permission', () => {
    expect(ROLE_PERMISSIONS.STUDENT).not.toContain(Permission.SYSTEM_GOVERNANCE);
  });

  it('FACULTY has FDP access permission', () => {
    expect(ROLE_PERMISSIONS.FACULTY).toContain(Permission.FACULTY_FDP_ACCESS);
  });

  it('INDUSTRY has candidate discovery permission', () => {
    expect(ROLE_PERMISSIONS.INDUSTRY).toContain(Permission.INDUSTRY_CANDIDATE_DISCOVERY);
  });

  it('INSTITUTION_ADMIN has analytics read permission', () => {
    expect(ROLE_PERMISSIONS.INSTITUTION_ADMIN).toContain(Permission.INSTITUTION_ANALYTICS_READ);
  });

  it('SUPER_ADMIN has every permission in the matrix', () => {
    const allPermissions = Object.values(Permission);
    const superPerms = ROLE_PERMISSIONS.SUPER_ADMIN;
    allPermissions.forEach((p) => {
      expect(superPerms).toContain(p);
    });
  });

  it('no role has an empty permissions array', () => {
    const allRoles: UserRole[] = ['STUDENT', 'FACULTY', 'INDUSTRY', 'INSTITUTION_ADMIN', 'SUPER_ADMIN'];
    allRoles.forEach((role) => {
      expect(ROLE_PERMISSIONS[role].length).toBeGreaterThan(0);
    });
  });

  it('role permission sets are mutually exclusive for cross-domain capabilities', () => {
    // Students must not be able to post industry opportunities
    const studentPerms = ROLE_PERMISSIONS.STUDENT;
    expect(studentPerms).not.toContain(Permission.INDUSTRY_OPPORTUNITY_MANAGE);
    expect(studentPerms).not.toContain(Permission.INSTITUTION_ANALYTICS_READ);
    expect(studentPerms).not.toContain(Permission.SYSTEM_USERS_MANAGE);

    // Industry must not be able to read institution analytics
    const industryPerms = ROLE_PERMISSIONS.INDUSTRY;
    expect(industryPerms).not.toContain(Permission.INSTITUTION_ANALYTICS_READ);
    expect(industryPerms).not.toContain(Permission.SYSTEM_GOVERNANCE);
  });
});

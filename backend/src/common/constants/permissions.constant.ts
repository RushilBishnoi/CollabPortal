import { UserRole } from '@prisma/client';

export enum Permission {
  // Student Capabilities
  STUDENT_PROFILE_MANAGE = 'student:profile:manage',
  STUDENT_SKILLS_ASSESS = 'student:skills:assess',
  STUDENT_CAREER_MAP = 'student:career:map',
  STUDENT_PORTFOLIO_MANAGE = 'student:portfolio:manage',
  STUDENT_APPLICATION_SUBMIT = 'student:application:submit',

  // Faculty Capabilities
  FACULTY_PROFILE_MANAGE = 'faculty:profile:manage',
  FACULTY_FDP_ACCESS = 'faculty:fdp:access',
  FACULTY_MENTORSHIP_MANAGE = 'faculty:mentorship:manage',
  FACULTY_COLLABORATION_MANAGE = 'faculty:collaboration:manage',

  // Industry Capabilities
  INDUSTRY_PROFILE_MANAGE = 'industry:profile:manage',
  INDUSTRY_OPPORTUNITY_MANAGE = 'industry:opportunity:manage',
  INDUSTRY_CANDIDATE_DISCOVERY = 'industry:candidate:discovery',
  INDUSTRY_APPLICATION_REVIEW = 'industry:application:review',

  // Institution Admin Capabilities
  INSTITUTION_STUDENTS_MANAGE = 'institution:students:manage',
  INSTITUTION_ANALYTICS_READ = 'institution:analytics:read',
  INSTITUTION_TRAINING_MANAGE = 'institution:training:manage',
  INSTITUTION_PLACEMENT_TRACK = 'institution:placement:track',

  // Super Admin Capabilities
  SYSTEM_GOVERNANCE = 'system:governance',
  SYSTEM_TAXONOMY_MANAGE = 'system:taxonomy:manage',
  SYSTEM_AUDIT_LOGS_READ = 'system:audit:read',
  SYSTEM_USERS_MANAGE = 'system:users:manage',
}

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.STUDENT]: [
    Permission.STUDENT_PROFILE_MANAGE,
    Permission.STUDENT_SKILLS_ASSESS,
    Permission.STUDENT_CAREER_MAP,
    Permission.STUDENT_PORTFOLIO_MANAGE,
    Permission.STUDENT_APPLICATION_SUBMIT,
  ],
  [UserRole.FACULTY]: [
    Permission.FACULTY_PROFILE_MANAGE,
    Permission.FACULTY_FDP_ACCESS,
    Permission.FACULTY_MENTORSHIP_MANAGE,
    Permission.FACULTY_COLLABORATION_MANAGE,
  ],
  [UserRole.INDUSTRY]: [
    Permission.INDUSTRY_PROFILE_MANAGE,
    Permission.INDUSTRY_OPPORTUNITY_MANAGE,
    Permission.INDUSTRY_CANDIDATE_DISCOVERY,
    Permission.INDUSTRY_APPLICATION_REVIEW,
  ],
  [UserRole.INSTITUTION_ADMIN]: [
    Permission.INSTITUTION_STUDENTS_MANAGE,
    Permission.INSTITUTION_ANALYTICS_READ,
    Permission.INSTITUTION_TRAINING_MANAGE,
    Permission.INSTITUTION_PLACEMENT_TRACK,
  ],
  [UserRole.SUPER_ADMIN]: Object.values(Permission),
};

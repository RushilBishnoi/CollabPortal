import { UserRole, UserProfile } from './api';

export interface UserPermissionsData {
  user: UserProfile;
  role: UserRole;
  permissions: string[];
  accessiblePortals: {
    student: boolean;
    faculty: boolean;
    industry: boolean;
    institution: boolean;
    admin: boolean;
  };
}

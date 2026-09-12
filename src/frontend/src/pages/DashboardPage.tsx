import React from 'react';
import { LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { StudentPortalPage } from './portals/StudentPortalPage';
import { FacultyPortalPage } from './portals/FacultyPortalPage';
import { IndustryPortalPage } from './portals/IndustryPortalPage';
import { InstitutionPortalPage } from './portals/InstitutionPortalPage';
import { AdminPortalPage } from './portals/AdminPortalPage';
import { UserRole } from '../types/api';

/**
 * DashboardPage — authenticated landing page.
 *
 * Renders the correct role-specific portal component based on the JWT-issued user.role.
 * Access is already enforced at two layers:
 *  1. Backend: JwtAuthGuard + RolesGuard on every /api/v1/rbac/* route.
 *  2. Frontend: ProtectedRoute (auth check) + per-portal RoleGuard (role check).
 *
 * This component is the third layer — it dynamically selects the portal UI so that
 * each user sees only their relevant workspace.
 */
export const DashboardPage: React.FC = () => {
  const { user, logout } = useAuth();

  const renderPortal = (role: UserRole | undefined): React.ReactElement => {
    switch (role) {
      case 'STUDENT':
        return <StudentPortalPage />;
      case 'FACULTY':
        return <FacultyPortalPage />;
      case 'INDUSTRY':
        return <IndustryPortalPage />;
      case 'INSTITUTION_ADMIN':
        return <InstitutionPortalPage />;
      case 'SUPER_ADMIN':
        return <AdminPortalPage />;
      default:
        return <AdminPortalPage />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top bar: user identity + sign-out */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-0.5">
            Logged in as
          </p>
          <p className="text-sm font-semibold text-slate-700">{user?.email}</p>
        </div>
        <button
          onClick={() => logout()}
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
        >
          <LogOut className="w-4 h-4" aria-hidden="true" />
          Sign Out
        </button>
      </div>

      {/* Role-specific portal */}
      {renderPortal(user?.role)}
    </div>
  );
};

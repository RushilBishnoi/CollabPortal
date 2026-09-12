import React, { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types/api';
import { LoadingSpinner } from './LoadingSpinner';
import { ForbiddenPage } from '../../pages/ForbiddenPage';

interface RoleGuardProps {
  /** Roles permitted to access the wrapped content */
  allowedRoles: UserRole[];
  children: ReactNode;
}

/**
 * RoleGuard — enforces role-based access on the frontend.
 *
 * Behaviour:
 *  - Unauthenticated users → redirect to /login (preserving intended destination)
 *  - Authenticated users with an insufficient role → render the 403 ForbiddenPage inline
 *  - Authorised users → render children
 *
 * Note: this is a UX-layer guard only. The authoritative access control always lives
 * server-side in NestJS RolesGuard / JwtAuthGuard.
 */
export const RoleGuard: React.FC<RoleGuardProps> = ({ allowedRoles, children }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-[500px] flex items-center justify-center">
        <LoadingSpinner text="Checking permissions…" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // SUPER_ADMIN has universal access
  if (user.role === 'SUPER_ADMIN' || allowedRoles.includes(user.role)) {
    return <>{children}</>;
  }

  return <ForbiddenPage requiredRoles={allowedRoles} />;
};

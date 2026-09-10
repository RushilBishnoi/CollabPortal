import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types/api';

const ROLE_LABELS: Record<UserRole, string> = {
  STUDENT: 'Student',
  FACULTY: 'Faculty',
  INDUSTRY: 'Industry Partner',
  INSTITUTION_ADMIN: 'Institution Admin',
  SUPER_ADMIN: 'Super Administrator',
};

interface ForbiddenPageProps {
  requiredRoles?: UserRole[];
}

export const ForbiddenPage: React.FC<ForbiddenPageProps> = ({ requiredRoles }) => {
  const { user } = useAuth();

  const currentRoleLabel = user?.role ? (ROLE_LABELS[user.role] ?? user.role) : 'Guest';
  const requiredRoleLabels = requiredRoles?.map((r) => ROLE_LABELS[r] ?? r).join(' or ');

  return (
    <div className="min-h-[500px] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-2xl border border-amber-200 shadow-sm p-8 text-center space-y-5">

        {/* Icon */}
        <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto shadow-sm" aria-hidden="true">
          <ShieldAlert className="w-7 h-7" />
        </div>

        {/* Heading */}
        <div>
          <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
            403 — Access Denied
          </span>
          <h1 className="text-2xl font-bold text-slate-900 mt-3">
            Portal Restricted
          </h1>
          <p className="text-sm text-slate-600 mt-2 leading-relaxed">
            Your account role{' '}
            <span className="font-semibold text-slate-800">({currentRoleLabel})</span>{' '}
            is not authorised to access this portal.
          </p>
          {requiredRoleLabels && (
            <p className="text-xs text-slate-500 mt-1">
              Required:{' '}
              <span className="font-semibold text-slate-700">{requiredRoleLabels}</span>
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Link
            to="/dashboard"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
          >
            <LayoutDashboard className="w-4 h-4" aria-hidden="true" />
            My Dashboard
          </Link>
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            Back to Home
          </Link>
        </div>

        {/* Support note */}
        <p className="text-xs text-slate-400">
          If you believe this is an error, please contact your platform administrator.
        </p>
      </div>
    </div>
  );
};

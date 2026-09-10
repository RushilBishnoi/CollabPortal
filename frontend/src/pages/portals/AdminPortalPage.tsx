import React from 'react';
import {
  ShieldCheck,
  BookMarked,
  ScrollText,
  Activity,
  Building2,
  Globe,
  ArrowRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';

const quickActions = [
  {
    label: 'Global Platform Analytics',
    description: 'National overview of academic institutions, corporate recruiters, and global placement rates.',
    icon: Globe,
    color: 'bg-indigo-50 text-indigo-600',
    href: '/analytics/platform',
  },
  {
    label: 'Academia–Industry Collaborations',
    description: 'Monitor all industry-academic workshops, faculty development programs, and live projects.',
    icon: Building2,
    color: 'bg-blue-50 text-blue-600',
    href: '/collaborations',
  },
  {
    label: 'Global Skill Taxonomy',
    description: 'Manage the canonical skill tree — view, add, merge, and version skill nodes.',
    icon: BookMarked,
    color: 'bg-violet-50 text-violet-600',
    href: '/profile/student/skills',
  },
  {
    label: 'Audit & Compliance Oversight',
    description: 'Review system configuration and platform security readiness.',
    icon: ScrollText,
    color: 'bg-rose-50 text-rose-600',
    href: '/status',
  },
  {
    label: 'System Health',
    description: 'Monitor API response times, database connectivity, and service uptime metrics.',
    icon: Activity,
    color: 'bg-emerald-50 text-emerald-600',
    href: '/status',
  },
];

export const AdminPortalPage: React.FC = () => {
  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="bg-gradient-to-r from-slate-700 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-md">
        <div className="flex items-center gap-4 mb-3">
          <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Super Administrator Portal</h1>
          </div>
        </div>
        <p className="text-slate-300 text-sm leading-relaxed max-w-xl">
          Full platform governance: manage users, institutions, and industry partners, maintain the
          global skill taxonomy, and review platform-wide health metrics.
        </p>
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="text-base font-bold text-slate-900 mb-4">Governance Tools</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.label}
                to={action.href}
                className="group bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:border-slate-400 hover:shadow-md transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${action.color}`}>
                    <Icon className="w-5 h-5" aria-hidden="true" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-sm font-bold text-slate-900">{action.label}</h3>
                      <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 transition-colors" aria-hidden="true" />
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">{action.description}</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
        <p className="text-xs text-slate-700 font-medium">
          <span className="font-bold">Role Verification:</span> Role{' '}
          <code className="bg-slate-200 px-1.5 py-0.5 rounded text-slate-900 font-mono">SUPER_ADMIN</code>{' '}
          is enforced server-side. This account has global access override across all role zones.
        </p>
      </div>
    </div>
  );
};

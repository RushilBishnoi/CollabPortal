import React from 'react';
import {
  Building2,
  BarChart3,
  Users,
  GraduationCap,
  TrendingUp,
  ArrowRight,
  Award,
} from 'lucide-react';
import { Link } from 'react-router-dom';

const quickActions = [
  {
    label: 'Institutional & Placement Analytics',
    description: 'Real-time dashboard with student readiness, recruitment funnels, and department placement rates.',
    icon: TrendingUp,
    href: '/analytics/institution',
  },
  {
    label: 'Student Readiness Overview',
    description: 'View aggregate skill readiness levels, verified credentials, and assessment pass rates.',
    icon: GraduationCap,
    href: '/analytics/institution',
  },
  {
    label: 'Skill Gap & Demand Analytics',
    description: "Compare your students' skill profiles against live industry demand for targeted curriculum updates.",
    icon: BarChart3,
    href: '/analytics/institution',
  },
  {
    label: 'Placement Funnel Tracker',
    description: 'Monitor applications, interview stages, offers, and final placements institution-wide.',
    icon: Users,
    href: '/analytics/institution',
  },
  {
    label: 'Industry Collaborations & FDPs',
    description: 'Explore active industry workshops, research partnerships, and faculty development engagements.',
    icon: Building2,
    href: '/collaborations',
  },
  {
    label: 'TPO Placement Oversight & NOC',
    description: 'Verify official student placements, issue institutional NOC certificates, and track department CTC metrics.',
    icon: Award,
    href: '/portal/institution/placements',
  },
];

export const InstitutionPortalPage: React.FC = () => {
  return (
    <div className="space-y-8">
      {/* Workspace Header */}
      <div className="saas-card p-6 sm:p-7">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-200/60 text-amber-700 flex items-center justify-center shrink-0">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">Institution Management Hub</h1>
                <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                  Institution Admin &amp; TPO
                </span>
              </div>
            </div>
          </div>

          <div>
            <Link
              to="/profile/institution"
              className="btn-secondary text-xs"
            >
              <Building2 className="w-3.5 h-3.5" /> Manage Institution Profile
            </Link>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-3xl mt-4 pt-4 border-t border-slate-100">
          Gain institution-wide visibility into student skill readiness, identify curriculum gaps
          versus industry demand, and track your placement funnel from application to offer.
        </p>
      </div>

      {/* Quick actions */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Institutional Operations &amp; Intelligence
          </h2>
          <span className="text-xs text-slate-500 font-medium">
            {quickActions.length} Workflows Available
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.label}
                to={action.href}
                className="saas-card-interactive p-4 sm:p-5 flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-9 h-9 rounded-lg bg-slate-50 border border-slate-200/80 group-hover:bg-amber-50 group-hover:border-amber-200 text-slate-700 group-hover:text-amber-700 flex items-center justify-center transition-colors shrink-0">
                      <Icon className="w-4 h-4" aria-hidden="true" />
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600 group-hover:translate-x-0.5 transition-all shrink-0" aria-hidden="true" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 mb-1 group-hover:text-amber-700 transition-colors">
                    {action.label}
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {action.description}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="saas-panel-muted border border-slate-200/80">
        <p className="text-xs text-slate-600 font-medium leading-relaxed">
          <span className="font-bold text-slate-900">Security &amp; Scope:</span> Role{' '}
          <code className="bg-white px-1.5 py-0.5 rounded border border-slate-200 text-slate-800 font-mono text-[11px]">INSTITUTION_ADMIN</code>{' '}
          is verified server-side. Data access is strictly scoped to your institution and blocked across tenant boundaries.
        </p>
      </div>
    </div>
  );
};

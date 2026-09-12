import React from 'react';
import {
  BookOpen,
  Users,
  Presentation,
  FlaskConical,
  ArrowRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';

const quickActions = [
  {
    label: 'Faculty Collaborations Marketplace',
    description: 'Discover and enrol in industry-sponsored FDPs, workshops, research, and consultancy.',
    icon: Presentation,
    path: '/collaborations',
  },
  {
    label: 'My Faculty Participations',
    description: 'Track your participation requests and enrollment across industry programs.',
    icon: FlaskConical,
    path: '/faculty/collaborations/my',
  },
  {
    label: 'Learning Curation Studio',
    description: 'Publish curated learning resources, tutorials, and structured roadmaps for students.',
    icon: BookOpen,
    path: '/learning/manage',
  },
  {
    label: 'Student Mentorship & Live Projects',
    description: 'Supervise industry-driven live projects and academic collaboration engagements.',
    icon: Users,
    path: '/collaborations',
  },
  {
    label: 'Faculty Mentor Workspace & Availability',
    description: 'Configure academic mentoring slots, guide student mentees, and host 1-on-1 sessions.',
    icon: Users,
    path: '/portal/mentor/workspace',
  },
];

export const FacultyPortalPage: React.FC = () => {
  return (
    <div className="space-y-8">
      {/* Workspace Header */}
      <div className="saas-card p-6 sm:p-7">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-200/60 text-emerald-700 flex items-center justify-center shrink-0">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">Faculty Workspace</h1>
                <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Academic Leader
                </span>
              </div>
            </div>
          </div>

          <div>
            <Link
              to="/profile/faculty"
              className="btn-secondary text-xs"
            >
              <BookOpen className="w-3.5 h-3.5" /> Manage Faculty Profile
            </Link>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-3xl mt-4 pt-4 border-t border-slate-100">
          Engage with industry-sponsored Faculty Development Programmes, manage student
          mentorship, and discover collaborative research &amp; consultancy opportunities with leading enterprise partners.
        </p>
      </div>

      {/* Quick actions */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Faculty Workflows &amp; Programmes
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
                to={action.path}
                className="saas-card-interactive p-4 sm:p-5 flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-9 h-9 rounded-lg bg-slate-50 border border-slate-200/80 group-hover:bg-emerald-50 group-hover:border-emerald-200 text-slate-700 group-hover:text-emerald-700 flex items-center justify-center transition-colors shrink-0">
                      <Icon className="w-4 h-4" aria-hidden="true" />
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all shrink-0" aria-hidden="true" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 mb-1 group-hover:text-emerald-700 transition-colors">
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
    </div>
  );
};

import React from 'react';
import {
  Briefcase,
  PlusCircle,
  Users,
  Search,
  ArrowRight,
  Award,
} from 'lucide-react';
import { Link } from 'react-router-dom';

const quickActions = [
  {
    label: 'Post an Opportunity',
    description: 'Publish internship or placement listings visible to matched student profiles.',
    icon: PlusCircle,
    href: '/portal/industry/opportunities/new',
  },
  {
    label: 'Manage Opportunities',
    description: 'Review corporate postings, configure required skills, and update statuses.',
    icon: Briefcase,
    href: '/portal/industry/opportunities',
  },
  {
    label: 'Candidate Discovery',
    description: 'Search and filter verified student profiles by skill, GPA, and branch.',
    icon: Search,
    href: '/portal/industry/opportunities',
  },
  {
    label: 'Applicant Pipeline',
    description: 'Review applications, shortlist candidates, manage interviews, and select placement outcomes.',
    icon: Users,
    href: '/portal/industry/opportunities',
  },
  {
    label: 'Industry Collaborations & FDPs',
    description: 'Publish workshops, FDPs, industrial training, live projects, and manage academic enrollments.',
    icon: Briefcase,
    href: '/industry/collaborations',
  },
  {
    label: 'Publish Learning Programs & Resources',
    description: 'Provide company-standard tech roadmaps, documentation, and practice specs for students.',
    icon: PlusCircle,
    href: '/learning/manage',
  },
  {
    label: 'Placement & Offer Pipeline',
    description: 'Formulate compensation offers, issue formal appointment contracts, and track candidate acceptances.',
    icon: Award,
    href: '/portal/industry/placements',
  },
  {
    label: 'Mentor Workspace & 1-on-1 Sessions',
    description: 'Manage your mentor profile, availability schedule, incoming mentee requests, and hosted 1-on-1 sessions.',
    icon: Users,
    href: '/portal/mentor/workspace',
  },
];

export const IndustryPortalPage: React.FC = () => {
  return (
    <div className="space-y-8">
      {/* Workspace Header */}
      <div className="saas-card p-6 sm:p-7">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-indigo-50 border border-indigo-200/60 text-indigo-700 flex items-center justify-center shrink-0">
              <Briefcase className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">Industry Talent Hub</h1>
                <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  Corporate Recruiter
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              to="/profile/industry"
              className="btn-secondary text-xs"
            >
              <Briefcase className="w-3.5 h-3.5" /> Company Profile
            </Link>
            <Link
              to="/portal/industry/opportunities/new"
              className="btn-primary text-xs"
            >
              <PlusCircle className="w-3.5 h-3.5" /> Post Opportunity
            </Link>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-3xl mt-4 pt-4 border-t border-slate-100">
          Publish internship and job opportunities, discover skill-matched candidates across
          verified campus profiles, and manage your end-to-end recruitment pipeline with transparent metrics.
        </p>
      </div>

      {/* Quick actions */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Recruitment &amp; Collaboration Tools
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
                    <div className="w-9 h-9 rounded-lg bg-slate-50 border border-slate-200/80 group-hover:bg-indigo-50 group-hover:border-indigo-200 text-slate-700 group-hover:text-indigo-700 flex items-center justify-center transition-colors shrink-0">
                      <Icon className="w-4 h-4" aria-hidden="true" />
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all shrink-0" aria-hidden="true" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 mb-1 group-hover:text-indigo-700 transition-colors">
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

import React from 'react';
import {
  GraduationCap,
  BarChart3,
  Briefcase,
  Star,
  ArrowRight,
  User,
  Clock,
  Sparkles,
  Award,
  Users,
} from 'lucide-react';
import { Link } from 'react-router-dom';

const quickActions = [
  {
    label: 'My Applications',
    description: 'Track submitted applications, recruitment stages, interview schedules, and placement outcomes.',
    icon: Clock,
    href: '/applications',
    category: 'Applications & Opportunities',
  },
  {
    label: 'Browse Opportunities',
    description: 'Discover internships and placements matched to your skill profile with explainable scores.',
    icon: Briefcase,
    href: '/opportunities',
    category: 'Applications & Opportunities',
  },
  {
    label: 'Skill Gap & Readiness',
    description: 'View your personalised industry-demand vs skill-readiness gap analysis and upgrade deficits.',
    icon: BarChart3,
    href: '/skill-gaps',
    category: 'Skills & Profiling',
  },
  {
    label: 'Career Recommendations',
    description: 'Discover career roles matching your skills, interests, and background with explainable scores.',
    icon: Briefcase,
    href: '/career-recommendations',
    category: 'Skills & Profiling',
  },
  {
    label: 'Skill Assessments',
    description: 'Take timed skill assessments to earn official Verified Skill badges.',
    icon: Star,
    href: '/assessments',
    category: 'Skills & Profiling',
  },
  {
    label: 'My Skill Profile',
    description: 'Manage your canonical skills, select proficiency levels, and explore domain taxonomies.',
    icon: Star,
    href: '/profile/student/skills',
    category: 'Skills & Profiling',
  },
  {
    label: 'My Learning & Guided Paths',
    description: 'Track course enrollments, bookmarked study resources, and complete step-by-step career curricula.',
    icon: GraduationCap,
    href: '/learning/my-learning',
    category: 'Learning & Growth',
  },
  {
    label: 'Skill Gap Remediation',
    description: 'Bridge your identified skill deficits with deterministic curated modules and linked assessments.',
    icon: Sparkles,
    href: '/learning/remediation',
    category: 'Learning & Growth',
  },
  {
    label: 'Industry Collaborations & Projects',
    description: 'Enrol in industry-led workshops, live project sprints, and collaborative training programs.',
    icon: Briefcase,
    href: '/collaborations',
    category: 'Applications & Opportunities',
  },
  {
    label: 'My Placement Offers & NOC',
    description: 'Review formal corporate compensation offers, accept/decline packages, and view institutional NOC certificates.',
    icon: Award,
    href: '/portal/student/offers',
    category: 'Applications & Opportunities',
  },
  {
    label: 'Mentorship & 1-on-1 Guidance',
    description: 'Connect with qualified industry and faculty mentors, track career milestones, and schedule 1-on-1 sessions.',
    icon: Users,
    href: '/portal/student/mentorship',
    category: 'Learning & Growth',
  },
];

export const StudentPortalPage: React.FC = () => {
  return (
    <div className="space-y-8">
      {/* Workspace Header */}
      <div className="saas-card p-6 sm:p-7">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-brand-50 border border-brand-200/60 text-brand-700 flex items-center justify-center shrink-0">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">Student Workspace</h1>
                <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                  Active Learner
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              to="/profile/student"
              className="btn-secondary text-xs"
            >
              <User className="w-3.5 h-3.5" /> Manage Profile
            </Link>
            <Link
              to="/profile/student/skills"
              className="btn-primary text-xs"
            >
              <Star className="w-3.5 h-3.5" /> Skills Inventory
            </Link>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-3xl mt-4 pt-4 border-t border-slate-100">
          Standardized skill profiling against live industry demand, personalized learning pathways, explainable opportunity matching, and verified placement management.
        </p>
      </div>

      {/* Quick Actions Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Workspace Modules &amp; Tools
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
                aria-label={action.label}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-9 h-9 rounded-lg bg-slate-50 border border-slate-200/80 group-hover:bg-brand-50 group-hover:border-brand-200 text-slate-700 group-hover:text-brand-600 flex items-center justify-center transition-colors shrink-0">
                      <Icon className="w-4 h-4" aria-hidden="true" />
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-brand-600 group-hover:translate-x-0.5 transition-all shrink-0" aria-hidden="true" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 mb-1 group-hover:text-brand-600 transition-colors">
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

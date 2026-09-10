import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Users,
  Search,
  ArrowLeft,
  Eye,
  CheckCircle2,
  Clock,
  Calendar,
  Award,
  XCircle,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';
import { applicationApi } from '../../lib/application-api';
import {
  RecruiterCandidateApplication,
  ApplicationStatus,
} from '../../types/applications';

const STATUS_FILTERS: { label: string; value: string }[] = [
  { label: 'All Candidates', value: 'ALL' },
  { label: 'Applied', value: 'APPLIED' },
  { label: 'Under Review', value: 'UNDER_REVIEW' },
  { label: 'Shortlisted', value: 'SHORTLISTED' },
  { label: 'Interview Scheduled', value: 'INTERVIEW_SCHEDULED' },
  { label: 'Selected', value: 'SELECTED' },
  { label: 'Rejected', value: 'REJECTED' },
  { label: 'Withdrawn', value: 'WITHDRAWN' },
];

export const OpportunityApplicationsPage: React.FC = () => {
  const { opportunityId } = useParams<{ opportunityId: string }>();

  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  const {
    data: applicationsResult,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['recruiter-opportunity-applications', opportunityId, selectedStatus, search],
    queryFn: () =>
      applicationApi.getApplicationsForOpportunity(opportunityId!, {
        status: selectedStatus !== 'ALL' ? (selectedStatus as ApplicationStatus) : undefined,
        search: search.trim() || undefined,
        limit: 50,
      }),
    enabled: !!opportunityId,
  });

  const applications: RecruiterCandidateApplication[] = applicationsResult?.data || [];
  const opportunity = applicationsResult?.opportunity;

  const totalCount = applications.length;
  const underReviewCount = applications.filter((a) => a.status === 'UNDER_REVIEW' || a.status === 'APPLIED').length;
  const shortlistedCount = applications.filter((a) => a.status === 'SHORTLISTED').length;
  const interviewCount = applications.filter((a) => a.status === 'INTERVIEW_SCHEDULED').length;
  const selectedCount = applications.filter((a) => a.status === 'SELECTED').length;

  const getStatusBadge = (status: ApplicationStatus) => {
    switch (status) {
      case 'SELECTED':
        return { label: 'Selected', color: 'bg-emerald-50 text-emerald-800 border-emerald-300', icon: Award };
      case 'INTERVIEW_SCHEDULED':
        return { label: 'Interview', color: 'bg-indigo-50 text-indigo-800 border-indigo-300', icon: Calendar };
      case 'SHORTLISTED':
        return { label: 'Shortlisted', color: 'bg-blue-50 text-blue-800 border-blue-300', icon: CheckCircle2 };
      case 'UNDER_REVIEW':
        return { label: 'Under Review', color: 'bg-amber-50 text-amber-800 border-amber-300', icon: Clock };
      case 'APPLIED':
        return { label: 'Applied', color: 'bg-slate-100 text-slate-800 border-slate-300', icon: CheckCircle2 };
      case 'WITHDRAWN':
        return { label: 'Withdrawn', color: 'bg-slate-100 text-slate-500 border-slate-200', icon: XCircle };
      case 'REJECTED':
        return { label: 'Rejected', color: 'bg-red-50 text-red-700 border-red-200', icon: XCircle };
      default:
        return { label: status, color: 'bg-slate-100 text-slate-700 border-slate-200', icon: Clock };
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-500">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="text-sm font-medium">Loading candidate applications pipeline...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-3xl p-8 text-center max-w-lg mx-auto my-12">
        <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
        <h3 className="text-sm font-bold text-red-900">Failed to load candidates</h3>
        <p className="text-xs text-red-600 mt-1">
          Please verify you are authenticated as the recruiter owning this opportunity.
        </p>
        <Link
          to="/portal/industry/opportunities"
          className="inline-flex items-center gap-1.5 mt-4 text-xs font-bold text-blue-600 hover:underline"
        >
          <ArrowLeft className="w-4 h-4" /> Back to My Opportunities
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Back link */}
      <div>
        <Link
          to="/portal/industry/opportunities"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to My Opportunities
        </Link>
      </div>

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-semibold">
            <Users className="w-3.5 h-3.5" /> Candidate Recruitment Funnel
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {opportunity?.title || 'Opportunity Applications'}
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm max-w-xl leading-relaxed">
            Review applicant profiles, evaluate skill proficiencies &amp; fit match scores, schedule interviews, and finalize hiring outcomes.
          </p>
        </div>

        {/* Funnel Metrics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-8 pt-6 border-t border-white/10 text-center sm:text-left">
          <div className="bg-white/5 backdrop-blur rounded-2xl p-3.5 border border-white/10">
            <p className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">Total Applied</p>
            <p className="text-xl font-bold text-white mt-0.5">{totalCount}</p>
          </div>
          <div className="bg-white/5 backdrop-blur rounded-2xl p-3.5 border border-white/10">
            <p className="text-[10px] font-bold text-amber-300 uppercase tracking-wider">Reviewing</p>
            <p className="text-xl font-bold text-white mt-0.5">{underReviewCount}</p>
          </div>
          <div className="bg-white/5 backdrop-blur rounded-2xl p-3.5 border border-white/10">
            <p className="text-[10px] font-bold text-blue-300 uppercase tracking-wider">Shortlisted</p>
            <p className="text-xl font-bold text-white mt-0.5">{shortlistedCount}</p>
          </div>
          <div className="bg-white/5 backdrop-blur rounded-2xl p-3.5 border border-white/10">
            <p className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider">Interviewing</p>
            <p className="text-xl font-bold text-white mt-0.5">{interviewCount}</p>
          </div>
          <div className="bg-white/5 backdrop-blur rounded-2xl p-3.5 border border-white/10">
            <p className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider">Selected</p>
            <p className="text-xl font-bold text-white mt-0.5">{selectedCount}</p>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search candidates by name, degree, or department..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
            />
          </div>
        </div>

        {/* Status Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-2 border-t border-slate-100">
          {STATUS_FILTERS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setSelectedStatus(tab.value)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedStatus === tab.value
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Candidates Table */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
        {applications.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <Users className="w-12 h-12 mx-auto mb-2 opacity-40" />
            <h3 className="text-sm font-bold text-slate-700">No candidate applications found</h3>
            <p className="text-xs text-slate-500 mt-1">No applicants matching the current filter criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold">
                  <th className="py-3 px-4 rounded-l-xl">Candidate</th>
                  <th className="py-3 px-4">Education / Batch</th>
                  <th className="py-3 px-4">Compatibility</th>
                  <th className="py-3 px-4">Verified Skills</th>
                  <th className="py-3 px-4">Current Stage</th>
                  <th className="py-3 px-4 text-right rounded-r-xl">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {applications.map((app) => {
                  const badge = getStatusBadge(app.status);
                  const BadgeIcon = badge.icon;
                  const profile = app.studentProfile;
                  const verifiedSkillsCount = (profile.studentSkills || []).filter(
                    (s) => s.verificationStatus === 'VERIFIED',
                  ).length;

                  return (
                    <tr key={app.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-4 px-4">
                        <p className="font-bold text-slate-900 text-sm">{profile.fullName}</p>
                        <p className="text-[11px] text-slate-400">{profile.user?.email || 'Student'}</p>
                      </td>
                      <td className="py-4 px-4 text-slate-600">
                        <p className="font-semibold text-slate-800">{profile.degree || profile.department || 'Undergraduate'}</p>
                        <p className="text-[11px] text-slate-400">
                          {profile.graduationYear ? `Batch of ${profile.graduationYear}` : ''}
                          {profile.cgpa ? ` • CGPA: ${profile.cgpa}/10` : ''}
                        </p>
                      </td>
                      <td className="py-4 px-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          <Sparkles className="w-3 h-3" /> {app.matchScoreSnapshot}% Match
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          {verifiedSkillsCount} Verified
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-bold border ${badge.color}`}
                        >
                          <BadgeIcon className="w-3 h-3" /> {badge.label}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <Link
                          to={`/portal/industry/applications/${app.id}`}
                          className="inline-flex items-center gap-1 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-colors shadow-sm"
                        >
                          <Eye className="w-3.5 h-3.5" /> Review Candidate
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

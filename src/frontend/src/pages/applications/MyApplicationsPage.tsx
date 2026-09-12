import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Briefcase,
  Building2,
  MapPin,
  Clock,
  CheckCircle2,
  XCircle,
  Calendar,
  Award,
  ArrowRight,
  Sparkles,
  AlertTriangle,
} from 'lucide-react';
import { applicationApi } from '../../lib/application-api';
import { StudentApplicationItem, ApplicationStatus } from '../../types/applications';

const STATUS_FILTERS: { label: string; value: string }[] = [
  { label: 'All Applications', value: 'ALL' },
  { label: 'Applied', value: 'APPLIED' },
  { label: 'Under Review', value: 'UNDER_REVIEW' },
  { label: 'Shortlisted', value: 'SHORTLISTED' },
  { label: 'Interview Scheduled', value: 'INTERVIEW_SCHEDULED' },
  { label: 'Selected', value: 'SELECTED' },
  { label: 'Withdrawn', value: 'WITHDRAWN' },
  { label: 'Concluded', value: 'REJECTED' },
];

export const MyApplicationsPage: React.FC = () => {
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  const {
    data: applicationsData,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['my-applications', selectedStatus],
    queryFn: () =>
      applicationApi.getMyApplications({
        status: selectedStatus !== 'ALL' ? (selectedStatus as ApplicationStatus) : undefined,
        limit: 50,
      }),
  });

  const applications: StudentApplicationItem[] = applicationsData?.data || [];

  const getStatusBadge = (status: ApplicationStatus) => {
    switch (status) {
      case 'SELECTED':
        return {
          label: 'Selected / Placed',
          color: 'bg-emerald-50 text-emerald-800 border-emerald-300',
          icon: Award,
        };
      case 'INTERVIEW_SCHEDULED':
        return {
          label: 'Interview Scheduled',
          color: 'bg-indigo-50 text-indigo-800 border-indigo-300',
          icon: Calendar,
        };
      case 'SHORTLISTED':
        return {
          label: 'Shortlisted',
          color: 'bg-blue-50 text-blue-800 border-blue-300',
          icon: CheckCircle2,
        };
      case 'UNDER_REVIEW':
        return {
          label: 'Under Review',
          color: 'bg-amber-50 text-amber-800 border-amber-300',
          icon: Clock,
        };
      case 'APPLIED':
        return {
          label: 'Applied',
          color: 'bg-slate-100 text-slate-800 border-slate-300',
          icon: CheckCircle2,
        };
      case 'WITHDRAWN':
        return {
          label: 'Withdrawn',
          color: 'bg-slate-100 text-slate-500 border-slate-200',
          icon: XCircle,
        };
      case 'REJECTED':
        return {
          label: 'Not Selected',
          color: 'bg-red-50 text-red-700 border-red-200',
          icon: XCircle,
        };
      default:
        return {
          label: status,
          color: 'bg-slate-100 text-slate-700 border-slate-200',
          icon: Clock,
        };
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-violet-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" /> Recruitment &amp; Placement Pipeline
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              My Opportunity Applications
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm max-w-xl leading-relaxed">
              Track real-time recruitment progression, scheduled interview rounds, and official placement outcomes.
            </p>
          </div>

          <Link
            to="/opportunities"
            className="inline-flex items-center gap-2 px-5 py-3 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl border border-white/20 transition-colors self-start sm:self-auto"
          >
            <Briefcase className="w-4 h-4 text-blue-300" /> Browse More Opportunities
          </Link>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {STATUS_FILTERS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setSelectedStatus(tab.value)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
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

      {/* Loading & Error States */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center min-h-[300px] text-slate-500">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-3"></div>
          <p className="text-sm font-medium">Loading your applications...</p>
        </div>
      )}

      {isError && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center max-w-lg mx-auto">
          <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-red-900">Failed to load applications</h3>
          <p className="text-xs text-red-600 mt-1">Please ensure your login session is active.</p>
        </div>
      )}

      {/* Applications List */}
      {!isLoading && !isError && (
        <>
          {applications.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center text-slate-400">
              <Briefcase className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <h3 className="text-sm font-bold text-slate-700">No applications found</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                You haven't submitted applications matching the selected status filter.
              </p>
              <Link
                to="/opportunities"
                className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl shadow-sm hover:bg-blue-700 transition-colors"
              >
                Discover Opportunities <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {applications.map((app) => {
                const badge = getStatusBadge(app.status);
                const BadgeIcon = badge.icon;

                return (
                  <div
                    key={app.id}
                    className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm hover:border-blue-300 hover:shadow-md transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-6"
                  >
                    <div className="space-y-3 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
                          {app.opportunity.opportunityType.replace('_', ' ')}
                        </span>
                        {app.opportunity.isRemote && (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                            Remote
                          </span>
                        )}
                        <span className="text-xs text-slate-400">•</span>
                        <span className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          {app.opportunity.industryProfile?.companyName || 'Enterprise'}
                        </span>
                      </div>

                      <div>
                        <h3 className="text-lg font-bold text-slate-900">{app.opportunity.title}</h3>
                        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mt-1">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" /> {app.opportunity.location}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-slate-400" /> Applied:{' '}
                            {new Date(app.submittedAt).toLocaleDateString()}
                          </span>
                          {app.matchScore !== undefined && (
                            <span className="font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                              Match: {app.matchScore}%
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Status Badge & View Detail Button */}
                    <div className="flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-end justify-between gap-3 min-w-[200px] border-t lg:border-t-0 lg:border-l border-slate-100 pt-4 lg:pt-0 lg:pl-6">
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${badge.color}`}
                        >
                          <BadgeIcon className="w-3.5 h-3.5" />
                          {badge.label}
                        </span>
                      </div>

                      <Link
                        to={`/applications/${app.id}`}
                        className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-blue-600 text-white text-xs font-bold rounded-xl shadow-sm transition-colors w-full sm:w-auto"
                      >
                        View Timeline &amp; Status <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
};

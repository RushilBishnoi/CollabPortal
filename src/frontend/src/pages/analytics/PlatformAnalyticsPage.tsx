import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Globe,
  AlertTriangle,
} from 'lucide-react';
import { analyticsApi } from '../../lib/analytics-api';
import { PlatformAnalyticsOverview } from '../../types/analytics';

export const PlatformAnalyticsPage: React.FC = () => {
  const { data: overview, isLoading, isError } = useQuery<PlatformAnalyticsOverview>({
    queryKey: ['platform-analytics-overview'],
    queryFn: () => analyticsApi.getPlatformOverview(),
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-500">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="text-sm font-medium">Aggregating global platform intelligence...</p>
      </div>
    );
  }

  if (isError || !overview) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-3xl p-8 text-center max-w-lg mx-auto my-12">
        <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
        <h3 className="text-sm font-bold text-red-900">Failed to load platform analytics</h3>
        <p className="text-xs text-red-600 mt-1">Super Administrator privileges required.</p>
      </div>
    );
  }

  const { summary } = overview;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-semibold">
            <Globe className="w-3.5 h-3.5" /> Platform Intelligence
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Global Academia–Industry Platform Analytics
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm max-w-xl leading-relaxed">
            National aggregate metrics for CollabPortal across participating academic institutions, corporate recruiters, and student cohorts.
          </p>
        </div>
      </div>

      {/* Global Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-2">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Partner Institutions</span>
          <p className="text-3xl font-black text-slate-900">{summary.totalInstitutions}</p>
          <p className="text-xs text-slate-500">Registered Universities &amp; Colleges</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-2">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Industry Recruiters</span>
          <p className="text-3xl font-black text-slate-900">{summary.totalIndustries}</p>
          <p className="text-xs text-slate-500">Active Corporate Partners</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-2">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Students</span>
          <p className="text-3xl font-black text-slate-900">{summary.totalStudents}</p>
          <p className="text-xs text-slate-500">Registered Student Cohort</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-2">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Global Placements</span>
          <p className="text-3xl font-black text-emerald-600">{summary.selectedApplications}</p>
          <p className="text-xs text-slate-500">{summary.globalPlacementRate}% Overall Placement Rate</p>
        </div>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-2">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Active Opportunities</span>
          <p className="text-2xl font-bold text-slate-900">{summary.totalOpportunities}</p>
          <p className="text-xs text-slate-500">Internships &amp; Placements Published</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-2">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Applications</span>
          <p className="text-2xl font-bold text-slate-900">{summary.totalApplications}</p>
          <p className="text-xs text-slate-500">Processed Recruitment Applications</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-2">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Skill Assessments</span>
          <p className="text-2xl font-bold text-slate-900">{summary.totalAssessments}</p>
          <p className="text-xs text-slate-500">Standardized Assessment Tests</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-2">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Industry Collaborations</span>
          <p className="text-2xl font-bold text-slate-900">Active</p>
          <p className="text-xs text-slate-500">FDPs, Workshops &amp; Live Projects</p>
        </div>
      </div>
    </div>
  );
};

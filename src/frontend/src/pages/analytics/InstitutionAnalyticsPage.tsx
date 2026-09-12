import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Building2,
  GraduationCap,
  Award,
  TrendingUp,
  Briefcase,
  CheckCircle2,
  Download,
  Filter,
  AlertTriangle,
  Building,
  Target,
} from 'lucide-react';
import { analyticsApi } from '../../lib/analytics-api';
import { InstitutionAnalyticsOverview } from '../../types/analytics';

export const InstitutionAnalyticsPage: React.FC = () => {
  const [selectedDept, setSelectedDept] = useState<string>('');
  const [selectedBatch, setSelectedBatch] = useState<string>('');

  const {
    data: overview,
    isLoading,
    isError,
    error,
  } = useQuery<InstitutionAnalyticsOverview>({
    queryKey: ['institution-analytics-overview', selectedDept, selectedBatch],
    queryFn: () =>
      analyticsApi.getInstitutionOverview({
        department: selectedDept || undefined,
        graduationYear: selectedBatch ? Number(selectedBatch) : undefined,
      }),
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-500">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="text-sm font-medium">Computing institutional intelligence &amp; placement analytics...</p>
      </div>
    );
  }

  if (isError || !overview) {
    const errorStatus = (error as any)?.response?.status || (error as any)?.status;
    const isAuthError = errorStatus === 401 || errorStatus === 403;
    const isNotFound = errorStatus === 404;

    return (
      <div className="bg-red-50 border border-red-200 rounded-3xl p-8 text-center max-w-lg mx-auto my-12">
        <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
        <h3 className="text-sm font-bold text-red-900">Failed to load analytics</h3>
        <p className="text-xs text-red-600 mt-1">
          {isAuthError
            ? 'Please verify you are logged in as an authorized Institution Administrator.'
            : isNotFound
            ? 'Institutional analytics data is currently unavailable for this account.'
            : 'Unable to connect to the analytics service. Please try again later.'}
        </p>
      </div>
    );
  }

  const { institution, summary, funnel, topSkills, topHiringCompanies, departmentAnalytics, batchTrends } =
    overview;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="saas-card p-6 sm:p-7">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-amber-50 border border-amber-200/60 text-amber-800 text-[11px] font-semibold">
              <Building2 className="w-3.5 h-3.5" /> Institutional &amp; Placement Intelligence
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">{institution.name}</h1>
            <p className="text-slate-500 text-xs sm:text-sm max-w-2xl leading-relaxed">
              Real-time deterministic reporting across student skill readiness, industry applications, recruitment funnels, and department placement rates.
            </p>
          </div>

          {/* Export Report CTA */}
          <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-auto">
            <a
              href="/api/v1/analytics/institution/export?type=departments"
              className="btn-secondary text-xs"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" /> Export Department CSV
            </a>
            <a
              href="/api/v1/analytics/institution/export?type=placements"
              className="btn-primary text-xs"
            >
              <Download className="w-3.5 h-3.5" /> Placement Summary Report
            </a>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="saas-card p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
          <Filter className="w-3.5 h-3.5 text-brand-600" /> Analytics Filters:
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          >
            <option value="">All Departments</option>
            {departmentAnalytics.map((d) => (
              <option key={d.department} value={d.department}>
                {d.department}
              </option>
            ))}
          </select>

          <select
            value={selectedBatch}
            onChange={(e) => setSelectedBatch(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          >
            <option value="">All Graduation Batches</option>
            {batchTrends.map((b) => (
              <option key={b.graduationYear} value={b.graduationYear}>
                Batch of {b.graduationYear}
              </option>
            ))}
          </select>

          {(selectedDept || selectedBatch) && (
            <button
              onClick={() => {
                setSelectedDept('');
                setSelectedBatch('');
              }}
              className="text-xs font-semibold text-brand-600 hover:underline px-2 py-1"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Core KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Students & Placement Rate */}
        <div className="saas-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Placement Rate</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900">{summary.placementRate}%</p>
            <p className="text-xs text-slate-500 mt-1">
              <span className="font-bold text-emerald-700">{summary.placedStudentsCount}</span> of{' '}
              <span className="font-bold text-slate-700">{summary.totalStudents}</span> students placed
            </p>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div className="bg-emerald-600 h-full rounded-full" style={{ width: `${summary.placementRate}%` }} />
          </div>
        </div>

        {/* Skill Verification Rate */}
        <div className="saas-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Skill Verification</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900">{summary.skillVerificationRate}%</p>
            <p className="text-xs text-slate-500 mt-1">
              <span className="font-bold text-blue-700">{summary.totalVerifiedSkills}</span> verified of{' '}
              <span className="font-bold text-slate-700">{summary.totalSkillsRecorded}</span> total
            </p>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div className="bg-brand-600 h-full rounded-full" style={{ width: `${summary.skillVerificationRate}%` }} />
          </div>
        </div>

        {/* Applications & Conversion */}
        <div className="saas-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Application Funnel</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center justify-center">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900">{summary.totalApplications}</p>
            <p className="text-xs text-slate-500 mt-1">
              <span className="font-bold text-indigo-700">{summary.selectedCount}</span> hired (
              {summary.applicationConversionRate}% conversion)
            </p>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-indigo-600 h-full rounded-full"
              style={{ width: `${summary.applicationConversionRate}%` }}
            />
          </div>
        </div>

        {/* Assessment Pass Rate */}
        <div className="saas-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Assessment Readiness</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 border border-purple-200 flex items-center justify-center">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900">{summary.assessmentPassRate}%</p>
            <p className="text-xs text-slate-500 mt-1">
              Avg Score: <span className="font-bold text-purple-700">{summary.averageAssessmentScore}%</span> across{' '}
              {summary.totalAssessmentAttempts} attempts
            </p>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div className="bg-purple-600 h-full rounded-full" style={{ width: `${summary.assessmentPassRate}%` }} />
          </div>
        </div>
      </div>

      {/* Recruitment Pipeline Funnel Visualizer */}
      <div className="saas-card p-6 space-y-4">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-brand-600" /> Student Recruitment &amp; Placement Funnel
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-lg text-center space-y-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">1. Applied</p>
            <p className="text-xl font-bold text-slate-900">{funnel.applied}</p>
            <p className="text-[10px] text-slate-500">100% Submissions</p>
          </div>
          <div className="p-3.5 bg-amber-50/50 border border-amber-200/80 rounded-lg text-center space-y-1">
            <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">2. In Review</p>
            <p className="text-xl font-bold text-amber-950">{funnel.underReview}</p>
            <p className="text-[10px] text-amber-700">Recruiter Screening</p>
          </div>
          <div className="p-3.5 bg-blue-50/50 border border-blue-200/80 rounded-lg text-center space-y-1">
            <p className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">3. Shortlisted</p>
            <p className="text-xl font-bold text-blue-950">{funnel.shortlisted}</p>
            <p className="text-[10px] text-blue-700">Advancing Profiles</p>
          </div>
          <div className="p-3.5 bg-indigo-50/50 border border-indigo-200/80 rounded-lg text-center space-y-1">
            <p className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider">4. Interviewing</p>
            <p className="text-xl font-bold text-indigo-950">{funnel.interviewScheduled}</p>
            <p className="text-[10px] text-indigo-700">Technical &amp; HR</p>
          </div>
          <div className="p-3.5 bg-emerald-50/70 border border-emerald-300 rounded-lg text-center space-y-1">
            <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">5. Placed</p>
            <p className="text-xl font-bold text-emerald-950">{funnel.selected}</p>
            <p className="text-[10px] text-emerald-700 font-bold">{summary.applicationConversionRate}% Selected</p>
          </div>
        </div>
      </div>

      {/* Department Breakdown Table */}
      <div className="saas-card overflow-hidden space-y-0">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-brand-600" /> Department Readiness &amp; Placement Breakdown
          </h2>
          <span className="text-xs text-slate-500 font-medium">{departmentAnalytics.length} Departments</span>
        </div>

        <div className="overflow-x-auto">
          <table className="saas-table">
            <thead>
              <tr>
                <th className="saas-th">Department</th>
                <th className="saas-th">Students</th>
                <th className="saas-th">Placed</th>
                <th className="saas-th">Placement Rate</th>
                <th className="saas-th">Avg CGPA</th>
                <th className="saas-th">Applications</th>
                <th className="saas-th text-right">Verified Skills</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {departmentAnalytics.map((dept) => (
                <tr key={dept.department} className="hover:bg-slate-50/70 transition-colors">
                  <td className="saas-td font-semibold text-slate-900">{dept.department}</td>
                  <td className="saas-td text-slate-600">{dept.totalStudents}</td>
                  <td className="saas-td font-semibold text-emerald-700">{dept.placedStudents}</td>
                  <td className="saas-td">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold text-blue-700 bg-blue-50 border border-blue-100">
                      {dept.placementRate}%
                    </span>
                  </td>
                  <td className="saas-td text-slate-600 font-medium">{dept.averageCgpa || 'N/A'}</td>
                  <td className="saas-td text-slate-600">{dept.applicationCount}</td>
                  <td className="saas-td text-right font-semibold text-slate-900">{dept.verifiedSkillCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Skills & Hiring Industry Partners */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Skills in Cohort */}
        <div className="saas-card p-6 space-y-4">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-brand-600" /> Top Student Skills &amp; Verification Ratio
          </h2>

          <div className="space-y-3">
            {topSkills.map((sk) => {
              const verifiedPercentage = sk.count > 0 ? Math.round((sk.verified / sk.count) * 100) : 0;
              return (
                <div key={sk.name} className="space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-800">{sk.name}</span>
                    <span className="text-slate-500 text-[11px]">
                      {sk.verified} verified / {sk.count} students ({verifiedPercentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-brand-600 h-full rounded-full transition-all"
                      style={{ width: `${verifiedPercentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Hiring Industry Partners */}
        <div className="saas-card p-6 space-y-4">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Building className="w-4 h-4 text-indigo-600" /> Top Recruiting Corporate Partners
          </h2>

          <div className="space-y-2.5">
            {topHiringCompanies.map((comp) => (
              <div
                key={comp.companyName}
                className="p-3 bg-slate-50 rounded-lg border border-slate-200/80 flex items-center justify-between text-xs"
              >
                <div>
                  <p className="font-bold text-slate-900">{comp.companyName}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">{comp.applicationCount} student application(s)</p>
                </div>

                <span className="px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {comp.selectedCount} Hires
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Academia–Industry Collaboration & Engagement Section */}
      <div className="saas-card p-6 sm:p-7 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Building2 className="w-4 h-4 text-brand-600" />
              Academia–Industry Collaborations &amp; Engagement
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Faculty Development Programs, Industrial Training, Live Projects, and Workshops.
            </p>
          </div>
          <a
            href="/collaborations"
            className="text-xs font-semibold text-brand-600 hover:text-brand-700"
          >
            Explore All Collaborations →
          </a>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200/80">
            <span className="text-[11px] font-bold text-slate-500 block uppercase tracking-wider">Faculty FDPs</span>
            <span className="text-lg font-bold text-slate-800 mt-1 block">Active</span>
            <p className="text-[11px] text-slate-400 mt-0.5">Industry-sponsored</p>
          </div>
          <div className="p-3.5 bg-emerald-50/50 rounded-lg border border-emerald-200/70">
            <span className="text-[11px] font-bold text-emerald-700 block uppercase tracking-wider">Live Projects</span>
            <span className="text-lg font-bold text-emerald-950 mt-1 block">Multi-Department</span>
            <p className="text-[11px] text-emerald-600 mt-0.5">Hands-on learning</p>
          </div>
          <div className="p-3.5 bg-blue-50/50 rounded-lg border border-blue-200/70">
            <span className="text-[11px] font-bold text-blue-700 block uppercase tracking-wider">Workshops</span>
            <span className="text-lg font-bold text-blue-950 mt-1 block">Skill Mapping</span>
            <p className="text-[11px] text-blue-600 mt-0.5">Verified cohorts</p>
          </div>
          <div className="p-3.5 bg-purple-50/50 rounded-lg border border-purple-200/70">
            <span className="text-[11px] font-bold text-purple-700 block uppercase tracking-wider">Consultancy</span>
            <span className="text-lg font-bold text-purple-950 mt-1 block">Faculty Led</span>
            <p className="text-[11px] text-purple-600 mt-0.5">Co-innovation</p>
          </div>
        </div>
      </div>
    </div>
  );
};

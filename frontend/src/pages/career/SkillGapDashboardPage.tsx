import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  ShieldCheck,
  AlertTriangle,
  HelpCircle,
  Briefcase,
  ChevronRight,
  ArrowUpRight,
  CheckCircle2,
  Sparkles,
  Award,
} from 'lucide-react';
import { careerApi } from '../../lib/career-api';
import { StudentReadinessOverview, CareerMatchResult } from '../../types/career-roles';

export const SkillGapDashboardPage: React.FC = () => {
  const {
    data: overview,
    isLoading,
    isError,
  } = useQuery<StudentReadinessOverview>({
    queryKey: ['student-readiness-overview'],
    queryFn: () => careerApi.getReadinessOverview(),
  });

  // IMPORTANT: useMemo MUST be called here — before any early returns — to satisfy
  // React's Rules of Hooks. Hook call count/order must be identical on every render.
  // When isLoading or isError, overview is undefined so topRecommendations falls back to [].
  const scoredRecommendations = useMemo(
    () =>
      (overview?.topRecommendations ?? []).map((rec: CareerMatchResult) => {
        const score = rec.overallScore;
        const badgeColor =
          score >= 75
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
            : score >= 50
            ? 'bg-amber-50 text-amber-700 border-amber-200'
            : 'bg-slate-50 text-slate-700 border-slate-200';
        const progressBg = score >= 75 ? 'bg-emerald-500' : score >= 50 ? 'bg-amber-500' : 'bg-slate-500';
        return { rec, score, badgeColor, progressBg };
      }),
    [overview?.topRecommendations],
  );

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-500">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="text-sm font-medium">Analyzing your skills and career opportunities...</p>
      </div>
    );
  }

  if (isError || !overview) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center max-w-lg mx-auto my-12">
        <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
        <h3 className="text-sm font-bold text-red-900">Failed to load Skill Gap Analysis</h3>
        <p className="text-xs text-red-600 mt-1">Please try refreshing the page or checking your connection.</p>
      </div>
    );
  }

  const { profileSummary, verifiedSkills, skillsToImprove, missingCriticalSkills } = overview;

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" /> Deterministic Skill Mapping
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Skill Gap &amp; Readiness Dashboard
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
              Real-time explainable comparison between your verified academic skills and current industry career role standards.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/learning/remediation"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow transition-colors"
            >
              <Sparkles className="w-4 h-4 text-amber-300" /> Bridge Skill Gaps
            </Link>
            <Link
              to="/career-recommendations"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow transition-colors"
            >
              <Briefcase className="w-4 h-4" /> Explore All Roles
            </Link>
            <Link
              to="/assessments"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl border border-white/20 transition-colors"
            >
              <Award className="w-4 h-4" /> Take Skill Assessments
            </Link>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-6 border-t border-white/10">
          <div className="bg-white/5 backdrop-blur rounded-2xl p-4 border border-white/10">
            <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Acquired Skills</p>
            <p className="text-2xl font-bold text-white mt-1">{profileSummary.totalAcquiredSkills}</p>
          </div>
          <div className="bg-white/5 backdrop-blur rounded-2xl p-4 border border-white/10">
            <p className="text-[11px] font-medium text-emerald-400 uppercase tracking-wider flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Verified Skills
            </p>
            <p className="text-2xl font-bold text-emerald-300 mt-1">{profileSummary.verifiedSkillsCount}</p>
          </div>
          <div className="bg-white/5 backdrop-blur rounded-2xl p-4 border border-white/10">
            <p className="text-[11px] font-medium text-amber-400 uppercase tracking-wider flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" /> Skills to Upgrade
            </p>
            <p className="text-2xl font-bold text-amber-300 mt-1">{skillsToImprove.length}</p>
          </div>
          <div className="bg-white/5 backdrop-blur rounded-2xl p-4 border border-white/10">
            <p className="text-[11px] font-medium text-blue-400 uppercase tracking-wider flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" /> Profile Readiness
            </p>
            <p className="text-2xl font-bold text-blue-300 mt-1">{profileSummary.profileCompleteness}%</p>
          </div>
        </div>
      </div>

      {/* Top Career Recommendations Preview */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-blue-600" />
              Top Career Matches for You
            </h2>
            <p className="text-xs text-slate-500">
              Ranked deterministically using skill coverage (50%), verified tests (15%), interests (15%), academic standing (10%), &amp; projects (10%).
            </p>
          </div>
          <Link
            to="/career-recommendations"
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            View all <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {scoredRecommendations.map(({ rec, score, badgeColor, progressBg }, index) => {
            return (
              <div
                key={rec.careerRole.id}
                className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      #{index + 1} Match
                    </span>
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-extrabold border ${badgeColor}`}
                    >
                      {score}% Match
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 mb-1">
                    {rec.careerRole.title}
                  </h3>
                  <p className="text-xs font-medium text-slate-500 mb-3">{rec.careerRole.category}</p>

                  {/* Compatibility Bar */}
                  <div className="w-full bg-slate-100 rounded-full h-2 mb-4 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${progressBg}`}
                      style={{ width: `${score}%` }}
                    />
                  </div>

                  {/* Quick skill breakdown pills */}
                  <div className="grid grid-cols-3 gap-2 text-center text-[11px] mb-4">
                    <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-2">
                      <p className="font-bold text-emerald-700">{rec.skillsSummary.satisfiedCount}</p>
                      <p className="text-[10px] text-emerald-600">Satisfied</p>
                    </div>
                    <div className="bg-amber-50 border border-amber-100 rounded-xl p-2">
                      <p className="font-bold text-amber-700">{rec.skillsSummary.deficitCount}</p>
                      <p className="text-[10px] text-amber-600">Deficits</p>
                    </div>
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-2">
                      <p className="font-bold text-slate-700">{rec.skillsSummary.missingCount}</p>
                      <p className="text-[10px] text-slate-500">Missing</p>
                    </div>
                  </div>
                </div>

                <Link
                  to={`/career-roles/${rec.careerRole.slug}`}
                  className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 px-4 bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 hover:border-blue-200 rounded-xl text-xs font-bold transition-colors"
                >
                  Analyze Requirements <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3-Column Skills Analysis Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Verified Skills */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Verified Competencies
            </h3>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
              {verifiedSkills.length} Verified
            </span>
          </div>

          {verifiedSkills.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <HelpCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-xs">No skills verified yet.</p>
              <Link
                to="/assessments"
                className="inline-block mt-3 text-xs font-bold text-blue-600 hover:underline"
              >
                Take a Skill Assessment →
              </Link>
            </div>
          ) : (
            <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
              {verifiedSkills.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-emerald-50/60 border border-emerald-100"
                >
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                      {s.name}
                    </h4>
                    <p className="text-[10px] text-slate-500 mt-0.5">{s.category || 'General'}</p>
                  </div>
                  <div className="text-right">
                    <span className="inline-block px-2 py-0.5 bg-emerald-200/70 text-emerald-800 text-[10px] font-bold rounded">
                      {s.proficiency}
                    </span>
                    {s.score !== undefined && s.score !== null && (
                      <p className="text-[10px] text-emerald-700 font-semibold mt-0.5">
                        Score: {s.score}%
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Skills Needing Improvement (Deficits) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              Skills to Upgrade
            </h3>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
              {skillsToImprove.length} Deficits
            </span>
          </div>

          {skillsToImprove.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-500 opacity-60" />
              <p className="text-xs">No active proficiency deficits detected for your top career tracks.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
              {skillsToImprove.map((item, idx) => (
                <div
                  key={`${item.skillId}-${idx}`}
                  className="p-3 rounded-xl bg-amber-50/60 border border-amber-100"
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <h4 className="text-xs font-bold text-slate-900">{item.skillName}</h4>
                    <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                      Gap: {item.gapLevels} level{item.gapLevels > 1 ? 's' : ''}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 mb-2">
                    Current: <span className="font-semibold text-slate-700">{item.currentProficiency}</span> → Required:{' '}
                    <span className="font-semibold text-amber-800">{item.targetProficiency}</span> ({item.roleTitle})
                  </p>
                  <Link
                    to="/assessments"
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-800"
                  >
                    Take Assessment to Prove Level →
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Critical Missing Skills */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-slate-600" />
              Missing Career Skills
            </h3>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-800">
              {missingCriticalSkills.length} Missing
            </span>
          </div>

          {missingCriticalSkills.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-500 opacity-60" />
              <p className="text-xs">You have acquired all foundational skills for your top roles.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
              {missingCriticalSkills.map((item, idx) => (
                <div
                  key={`${item.skillId}-${idx}`}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-200"
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h4 className="text-xs font-bold text-slate-900">{item.skillName}</h4>
                    <span className="text-[10px] font-bold text-slate-600 bg-slate-200 px-1.5 py-0.5 rounded">
                      Req: {item.targetProficiency}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 mb-2">Required for {item.roleTitle}</p>
                  <Link
                    to="/profile/student/skills"
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-800"
                  >
                    Add to Skill Inventory →
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

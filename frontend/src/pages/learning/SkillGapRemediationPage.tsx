import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Sparkles,
  ArrowLeft,
  Clock,
  Briefcase,
  AlertTriangle,
  GraduationCap,
} from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { learningApi } from '../../lib/learning-api';
import { careerApi } from '../../lib/career-api';
import { SkillRemediationCard } from '../../components/learning/SkillRemediationCard';
import { LearningPathCard } from '../../components/learning/LearningPathCard';
import {
  CareerRemediationPlan,
  SkillRemediationItem,
  LearningPath,
} from '../../types/learning';
import { CareerMatchResult } from '../../types/career-roles';

export const SkillGapRemediationPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const roleParam = searchParams.get('role');

  const [selectedRoleSlug, setSelectedRoleSlug] = useState<string>(roleParam || '');

  // Fetch recommended career roles for selector
  const { data: recommendedRolesData } = useQuery<CareerMatchResult[]>({
    queryKey: ['recommended-career-roles'],
    queryFn: () => careerApi.getRecommendedRoles() as any,
  });

  const recommendedRoles: CareerMatchResult[] = recommendedRolesData || [];

  // Determine active role slug
  const activeRoleSlug =
    selectedRoleSlug ||
    (recommendedRoles.length > 0 ? recommendedRoles[0].careerRole.slug : '');

  // Fetch remediation plan
  const { data: plan, isLoading, error } = useQuery<CareerRemediationPlan>({
    queryKey: ['skill-remediation-plan', activeRoleSlug],
    queryFn: () => learningApi.getRoleRemediation(activeRoleSlug),
    enabled: !!activeRoleSlug,
  });

  const handleRoleChange = (slug: string) => {
    setSelectedRoleSlug(slug);
    setSearchParams({ role: slug });
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Breadcrumb / Back Link */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <Link
          to="/skill-gaps"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Skill Gap Dashboard</span>
        </Link>
        <Link
          to="/learning/my-learning"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 hover:text-brand-800 transition-colors"
        >
          <GraduationCap className="w-4 h-4" />
          <span>My Learning Dashboard</span>
        </Link>
      </div>

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-brand-950 to-slate-900 rounded-3xl p-8 text-white mb-8 shadow-lg relative overflow-hidden">
        <div className="max-w-3xl relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/30 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            Deterministic Skill-Gap Remediation
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2">
            Bridge Your Skill Deficits
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed mb-6">
            Our deterministic remediation engine compares your evaluated proficiency against
            industry requirements and maps out the exact curated resources and assessments to bridge your gaps.
          </p>

          {/* Role selector dropdown */}
          {recommendedRoles.length > 0 && (
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-xs font-semibold text-slate-300">Target Role:</span>
              <div className="flex gap-2 flex-wrap">
                {recommendedRoles.slice(0, 4).map((rec: CareerMatchResult) => {
                  const isSelected = activeRoleSlug === rec.careerRole.slug;
                  return (
                    <button
                      key={rec.careerRole.id}
                      onClick={() => handleRoleChange(rec.careerRole.slug)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                        isSelected
                          ? 'bg-brand-500 text-white shadow-md'
                          : 'bg-white/10 text-slate-300 hover:bg-white/20'
                      }`}
                    >
                      {rec.careerRole.title} ({rec.overallScore}%)
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      {isLoading ? (
        <div className="animate-pulse space-y-6">
          <div className="h-28 bg-white rounded-2xl border border-slate-100" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-48 bg-white rounded-2xl border border-slate-100" />
            ))}
          </div>
        </div>
      ) : error || !plan ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
          <h3 className="font-bold text-slate-800 text-base mb-1">
            Unable to load remediation plan
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
            Please make sure you have target career roles selected or browse available learning paths directly.
          </p>
          <Link
            to="/learning"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold"
          >
            <span>Explore Catalog</span>
          </Link>
        </div>
      ) : (
        <div>
          {/* Remediation Summary Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-8 shadow-sm">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-600 font-bold">
                  <Briefcase className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-slate-500 uppercase">Target Role</p>
                  <p className="text-sm font-bold text-slate-900">{plan.careerRole.title}</p>
                  <span className="text-[11px] text-brand-600 font-semibold">
                    {plan.overallCompatibilityScore}% Compatible
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 font-bold">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-slate-500 uppercase">Deficit Skills</p>
                  <p className="text-sm font-bold text-slate-900">
                    {plan.totalDeficitSkillsCount} Skills to Bridge
                  </p>
                  <span className="text-[11px] text-slate-500">
                    {plan.skillRemediations.filter((r: SkillRemediationItem) => r.status === 'MISSING').length} missing,{' '}
                    {plan.skillRemediations.filter((r: SkillRemediationItem) => r.status === 'DEFICIT').length} below target
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 font-bold">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-slate-500 uppercase">Estimated Effort</p>
                  <p className="text-sm font-bold text-slate-900">
                    ~{plan.totalEstimatedRemediationHours} Hours Study
                  </p>
                  <span className="text-[11px] text-purple-700 font-semibold">
                    To reach 100% role readiness
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Skill Remediations List */}
          <div className="mb-10">
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-brand-600" />
              Prioritized Skill-by-Skill Action Plan
            </h2>

            {plan.skillRemediations.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {plan.skillRemediations.map((item: SkillRemediationItem) => (
                  <SkillRemediationCard key={item.skillId} remediation={item} />
                ))}
              </div>
            ) : (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-8 text-center text-emerald-900">
                <p className="font-bold text-base mb-1">🎉 Zero Skill Deficits!</p>
                <p className="text-xs text-emerald-700">
                  You satisfy all required competencies for {plan.careerRole.title} at or above target levels.
                </p>
              </div>
            )}
          </div>

          {/* Recommended Structured Paths */}
          {plan.recommendedPaths.length > 0 && (
            <div>
              <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-brand-600" />
                Curated Roadmaps for {plan.careerRole.title}
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {plan.recommendedPaths.map((p: LearningPath) => (
                  <LearningPathCard key={p.id} path={p} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

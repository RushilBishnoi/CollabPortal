import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Briefcase,
  ShieldCheck,
  AlertTriangle,
  HelpCircle,
  CheckCircle2,
  ArrowLeft,
  Award,
  BookOpen,
  TrendingUp,
  UserCheck,
  Code2,
} from 'lucide-react';
import { careerApi } from '../../lib/career-api';
import { CareerMatchResult, EvaluatedSkillRequirement } from '../../types/career-roles';

export const CareerRoleDetailPage: React.FC = () => {
  const { idOrSlug } = useParams<{ idOrSlug: string }>();

  const {
    data: matchResult,
    isLoading,
    isError,
  } = useQuery<CareerMatchResult>({
    queryKey: ['career-role-match', idOrSlug],
    queryFn: () => careerApi.getRoleMatch(idOrSlug!),
    enabled: !!idOrSlug,
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-500">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="text-sm font-medium">Evaluating career role requirements and skill gaps...</p>
      </div>
    );
  }

  if (isError || !matchResult) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center max-w-lg mx-auto my-12">
        <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
        <h3 className="text-sm font-bold text-red-900">Career Role Not Found</h3>
        <p className="text-xs text-red-600 mt-1">Unable to load the requested career role skill mapping.</p>
        <Link
          to="/career-recommendations"
          className="inline-flex items-center gap-1.5 mt-4 text-xs font-bold text-blue-600 hover:underline"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Recommendations
        </Link>
      </div>
    );
  }

  const { careerRole, overallScore, breakdown, skillsSummary, skillRequirements } = matchResult;

  const scoreBadgeColor =
    overallScore >= 75
      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
      : overallScore >= 50
      ? 'bg-amber-50 text-amber-700 border-amber-200'
      : 'bg-slate-50 text-slate-700 border-slate-200';

  const progressBg =
    overallScore >= 75 ? 'bg-emerald-500' : overallScore >= 50 ? 'bg-amber-500' : 'bg-slate-500';

  return (
    <div className="space-y-8">
      {/* Back Link */}
      <div>
        <Link
          to="/career-recommendations"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Career Recommendations
        </Link>
      </div>

      {/* Role Header Banner */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100">
                {careerRole.category}
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs text-slate-500 font-medium">
                Min Industry Experience: {careerRole.minExperienceYears} year(s)
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              {careerRole.title}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 max-w-3xl leading-relaxed">
              {careerRole.description ||
                'This career role requires demonstrated competency across canonical industry skills and frameworks.'}
            </p>
          </div>

          {/* Overall Compatibility Score Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 min-w-[260px] text-center">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
              Role Compatibility
            </p>
            <div className="flex items-center justify-center gap-2">
              <span className="text-4xl font-extrabold text-slate-900">{overallScore}%</span>
            </div>
            <span
              className={`inline-block px-3 py-0.5 rounded-full text-xs font-bold border mt-2 ${scoreBadgeColor}`}
            >
              {overallScore >= 75
                ? 'High Readiness'
                : overallScore >= 50
                ? 'Moderate Gap'
                : 'Needs Skill Foundation'}
            </span>
            <div className="w-full bg-slate-200 rounded-full h-2 mt-4 overflow-hidden">
              <div className={`h-full rounded-full ${progressBg}`} style={{ width: `${overallScore}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Explainable 5-Factor Score Breakdown */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="mb-6">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            Explainable 5-Factor Score Breakdown
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Transparent deterministic calculation summing exactly to {overallScore} / 100 points without AI/ML black boxes.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Factor 1: Skill Compatibility */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Code2 className="w-4 h-4 text-blue-600" />
                  1. Skill Proficiency (50%)
                </span>
                <span className="text-xs font-extrabold text-blue-700">
                  {breakdown.skillCompatibility.score} / {breakdown.skillCompatibility.max}
                </span>
              </div>
              <p className="text-[11px] text-slate-600 mb-3 leading-relaxed">
                {breakdown.skillCompatibility.explanation}
              </p>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-blue-600 h-full rounded-full"
                style={{ width: `${breakdown.skillCompatibility.percentage}%` }}
              />
            </div>
          </div>

          {/* Factor 2: Verification Confidence */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  2. Verified Tests (15%)
                </span>
                <span className="text-xs font-extrabold text-emerald-700">
                  {breakdown.verificationConfidence.score} / {breakdown.verificationConfidence.max}
                </span>
              </div>
              <p className="text-[11px] text-slate-600 mb-3 leading-relaxed">
                {breakdown.verificationConfidence.explanation}
              </p>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-emerald-600 h-full rounded-full"
                style={{ width: `${breakdown.verificationConfidence.percentage}%` }}
              />
            </div>
          </div>

          {/* Factor 3: Career Interest */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Briefcase className="w-4 h-4 text-indigo-600" />
                  3. Career Interest (15%)
                </span>
                <span className="text-xs font-extrabold text-indigo-700">
                  {breakdown.careerInterest.score} / {breakdown.careerInterest.max}
                </span>
              </div>
              <p className="text-[11px] text-slate-600 mb-3 leading-relaxed">
                {breakdown.careerInterest.explanation}
              </p>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-indigo-600 h-full rounded-full"
                style={{ width: `${breakdown.careerInterest.percentage}%` }}
              />
            </div>
          </div>

          {/* Factor 4: Academic Readiness */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-violet-600" />
                  4. Academic Readiness (10%)
                </span>
                <span className="text-xs font-extrabold text-violet-700">
                  {breakdown.academicReadiness.score} / {breakdown.academicReadiness.max}
                </span>
              </div>
              <p className="text-[11px] text-slate-600 mb-3 leading-relaxed">
                {breakdown.academicReadiness.explanation}
              </p>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-violet-600 h-full rounded-full"
                style={{ width: `${breakdown.academicReadiness.percentage}%` }}
              />
            </div>
          </div>

          {/* Factor 5: Practical Experience */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-amber-600" />
                  5. Projects &amp; Work (10%)
                </span>
                <span className="text-xs font-extrabold text-amber-700">
                  {breakdown.practicalExperience.score} / {breakdown.practicalExperience.max}
                </span>
              </div>
              <p className="text-[11px] text-slate-600 mb-3 leading-relaxed">
                {breakdown.practicalExperience.explanation}
              </p>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-amber-600 h-full rounded-full"
                style={{ width: `${breakdown.practicalExperience.percentage}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Skill Requirements Matrix Table */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Award className="w-5 h-5 text-blue-600" />
              Skill Requirements &amp; Gap Matrix ({skillsSummary.totalRequired} Skills)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Comparison between role requirements and your current profile.
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5" /> {skillsSummary.satisfiedCount} Satisfied
            </span>
            <span className="flex items-center gap-1 font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
              <AlertTriangle className="w-3.5 h-3.5" /> {skillsSummary.deficitCount} Deficits
            </span>
            <span className="flex items-center gap-1 font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
              <HelpCircle className="w-3.5 h-3.5" /> {skillsSummary.missingCount} Missing
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-600 font-bold">
                <th className="py-3 px-4 rounded-l-xl">Skill Name</th>
                <th className="py-3 px-4">Domain Category</th>
                <th className="py-3 px-4">Required Level</th>
                <th className="py-3 px-4">Your Level</th>
                <th className="py-3 px-4">Verification</th>
                <th className="py-3 px-4">Gap Status</th>
                <th className="py-3 px-4 text-right rounded-r-xl">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {skillRequirements.map((req: EvaluatedSkillRequirement) => {
                let statusBadge = (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3" /> Satisfied
                  </span>
                );

                if (req.status === 'DEFICIT') {
                  statusBadge = (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                      <AlertTriangle className="w-3 h-3" /> Deficit ({req.gapLevels} lvl)
                    </span>
                  );
                } else if (req.status === 'MISSING') {
                  statusBadge = (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                      <HelpCircle className="w-3 h-3" /> Missing
                    </span>
                  );
                }

                return (
                  <tr key={req.skillId} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {req.skillName}
                      {req.isMandatory && (
                        <span className="ml-1.5 text-[10px] font-extrabold text-blue-600 bg-blue-50 px-1.5 py-0.2 rounded">
                          Mandatory
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 font-medium">
                      {req.categoryName || 'General'}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-800">
                      <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-800">
                        {req.requiredProficiency}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {req.studentProficiency ? (
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-800 font-bold rounded">
                          {req.studentProficiency}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Not Added</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      {req.isVerified ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                          <ShieldCheck className="w-3.5 h-3.5" /> Verified
                        </span>
                      ) : req.studentProficiency ? (
                        <span className="text-[11px] text-slate-500 font-medium">Self-Reported</span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">{statusBadge}</td>
                    <td className="py-3.5 px-4 text-right">
                      {req.status === 'MISSING' ? (
                        <Link
                          to="/profile/student/skills"
                          className="text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          Add Skill
                        </Link>
                      ) : !req.isVerified ? (
                        <Link
                          to="/assessments"
                          className="text-xs font-bold text-emerald-600 hover:text-emerald-800 hover:underline"
                        >
                          Verify via Assessment
                        </Link>
                      ) : (
                        <span className="text-[11px] font-semibold text-emerald-600">✓ Completed</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Briefcase,
  MapPin,
  Clock,
  Building2,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowLeft,
  Award,
  Globe,
  DollarSign,
  TrendingUp,
  UserCheck,
  Code2,
  Send,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { opportunityApi } from '../../lib/opportunity-api';
import { ApplyModal } from '../../components/applications/ApplyModal';
import {
  OpportunityMatchResult,
  OpportunityBrief,
  OpportunityCompanyInfo,
  EvaluatedOpportunitySkill,
} from '../../types/opportunities';

/** Resolve company info from either shape (matched result or public brief) */
function resolveCompany(data: OpportunityMatchResult['opportunity'] | OpportunityBrief): OpportunityCompanyInfo {
  if ('company' in data && data.company) return data.company as OpportunityCompanyInfo;
  if ('industryProfile' in data) return (data as OpportunityBrief).industryProfile;
  return { id: '', name: '', companyName: '', industryType: '', headquarters: null, website: null, isVerified: false };
}

/** Resolve skills from either shape */
function resolveSkills(data: OpportunityMatchResult['opportunity'] | OpportunityBrief): any[] {
  return (data as any).skills || [];
}

export const OpportunityDetailPage: React.FC = () => {
  const { idOrSlug } = useParams<{ idOrSlug: string }>();
  const { user, isAuthenticated } = useAuth();
  const isStudent = isAuthenticated && user?.role === 'STUDENT';
  const [isApplyModalOpen, setIsApplyModalOpen] = React.useState(false);

  const {
    data: matchData,
    isLoading: isLoadingMatch,
    isError: isErrorMatch,
  } = useQuery<OpportunityMatchResult>({
    queryKey: ['opportunity-match-detail', idOrSlug],
    queryFn: () => opportunityApi.getSingleMatchEvaluation(idOrSlug!),
    enabled: !!idOrSlug && isStudent,
  });

  const {
    data: publicData,
    isLoading: isLoadingPublic,
    isError: isErrorPublic,
  } = useQuery<OpportunityBrief>({
    queryKey: ['opportunity-public-detail', idOrSlug],
    queryFn: () => opportunityApi.getOpportunityByIdOrSlug(idOrSlug!),
    enabled: !!idOrSlug && !isStudent,
  });

  const isLoading = isStudent ? isLoadingMatch : isLoadingPublic;
  const isError = isStudent ? isErrorMatch : isErrorPublic;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-500">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="text-sm font-medium">Evaluating opportunity requirements and eligibility...</p>
      </div>
    );
  }

  if (isError || (!matchData && !publicData)) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center max-w-lg mx-auto my-12">
        <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
        <h3 className="text-sm font-bold text-red-900">Opportunity Not Found</h3>
        <p className="text-xs text-red-600 mt-1">Unable to load the requested opportunity posting.</p>
        <Link
          to="/opportunities"
          className="inline-flex items-center gap-1.5 mt-4 text-xs font-bold text-blue-600 hover:underline"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Marketplace
        </Link>
      </div>
    );
  }

  // Resolve display data from whichever source is available
  const oppBase: OpportunityMatchResult['opportunity'] | OpportunityBrief =
    isStudent && matchData ? matchData.opportunity : publicData!;

  const score = isStudent && matchData ? matchData.overallScore : null;
  const eligibility = isStudent && matchData ? matchData.eligibility : null;
  const breakdown = isStudent && matchData ? matchData.breakdown : null;
  const skillRequirements = isStudent && matchData ? matchData.skillRequirements : null;

  const company = resolveCompany(oppBase);
  const skills = resolveSkills(isStudent && matchData ? (publicData || oppBase) : oppBase);

  return (
    <div className="space-y-8">
      {/* Back nav */}
      <div>
        <Link
          to="/opportunities"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Opportunities Marketplace
        </Link>
      </div>

      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100">
                {oppBase.opportunityType.replace('_', ' ')}
              </span>
              {oppBase.isRemote && (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                  100% Remote
                </span>
              )}
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                {company.companyName || company.name || 'Enterprise Partner'}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">{oppBase.title}</h1>

            <div className="flex flex-wrap items-center gap-5 text-xs text-slate-600 pt-1">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-slate-400" /> {oppBase.location}
              </span>
              {oppBase.stipend !== null && oppBase.stipend !== undefined && (
                <span className="flex items-center gap-1.5 font-bold text-slate-800">
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                  ₹{oppBase.stipend.toLocaleString()} / {oppBase.stipendPeriod.toLowerCase()}
                </span>
              )}
              {oppBase.deadline && (
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-slate-400" /> Application Deadline:{' '}
                  {new Date(oppBase.deadline).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>

          {/* Student Score & Eligibility Card */}
          {isStudent && score !== null && eligibility && (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 min-w-[280px] text-center space-y-3">
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Opportunity Compatibility
                </p>
                <p className="text-3xl font-extrabold text-slate-900 mt-1">{score}%</p>
              </div>

              <div>
                {eligibility.isEligible ? (
                  <div className="space-y-2">
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100/80 px-3 py-1 rounded-full border border-emerald-200">
                      <CheckCircle2 className="w-4 h-4" /> Eligible to Apply
                    </span>
                    <button
                      onClick={() => setIsApplyModalOpen(true)}
                      className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-colors text-xs flex items-center justify-center gap-1.5 mt-2"
                    >
                      <Send className="w-3.5 h-3.5" /> Apply for Position
                    </button>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-800 bg-amber-100 px-3 py-1 rounded-full border border-amber-200">
                      <XCircle className="w-4 h-4 text-amber-600" /> Ineligible for Role
                    </span>
                    {eligibility.failureReasons.length > 0 && (
                      <p className="text-[10px] text-amber-700 font-medium leading-tight">
                        {eligibility.failureReasons[0]}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Hard Eligibility Checklist (Student View) */}
      {isStudent && eligibility && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-blue-600" />
            Academic &amp; Prerequisite Eligibility Verification
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            {/* CGPA Check */}
            <div
              className={`p-4 rounded-xl border flex flex-col justify-between ${
                eligibility.checks.cgpa.passed
                  ? 'bg-emerald-50/60 border-emerald-200'
                  : 'bg-amber-50/60 border-amber-200'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className="font-bold text-slate-900">Minimum CGPA</span>
                {eligibility.checks.cgpa.passed ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                ) : (
                  <XCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                )}
              </div>
              <p className="text-[11px] text-slate-600">{eligibility.checks.cgpa.message}</p>
            </div>

            {/* Graduation Year Check */}
            <div
              className={`p-4 rounded-xl border flex flex-col justify-between ${
                eligibility.checks.graduationYear.passed
                  ? 'bg-emerald-50/60 border-emerald-200'
                  : 'bg-amber-50/60 border-amber-200'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className="font-bold text-slate-900">Graduation Batch</span>
                {eligibility.checks.graduationYear.passed ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                ) : (
                  <XCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                )}
              </div>
              <p className="text-[11px] text-slate-600">{eligibility.checks.graduationYear.message}</p>
            </div>

            {/* Department Check */}
            <div
              className={`p-4 rounded-xl border flex flex-col justify-between ${
                eligibility.checks.department.passed
                  ? 'bg-emerald-50/60 border-emerald-200'
                  : 'bg-amber-50/60 border-amber-200'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className="font-bold text-slate-900">Eligible Department</span>
                {eligibility.checks.department.passed ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                ) : (
                  <XCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                )}
              </div>
              <p className="text-[11px] text-slate-600">{eligibility.checks.department.message}</p>
            </div>
          </div>
        </div>
      )}

      {/* 5-Factor Score Breakdown (Student View) */}
      {isStudent && breakdown && score !== null && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="mb-5">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              Explainable Compatibility Score Breakdown ({score}% Total)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Deterministic calculation without AI black-boxes. Sums exactly to {score} points.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs font-bold mb-1">
                  <span className="text-slate-800 flex items-center gap-1">
                    <Code2 className="w-3.5 h-3.5 text-blue-600" /> Skill Match
                  </span>
                  <span className="text-blue-700">{breakdown.skillCompatibility.score}/50</span>
                </div>
                <p className="text-[10px] text-slate-500 leading-tight mb-2">
                  {breakdown.skillCompatibility.explanation}
                </p>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-1 overflow-hidden">
                <div className="bg-blue-600 h-full" style={{ width: `${breakdown.skillCompatibility.percentage}%` }} />
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs font-bold mb-1">
                  <span className="text-slate-800 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Verified
                  </span>
                  <span className="text-emerald-700">{breakdown.verificationConfidence.score}/15</span>
                </div>
                <p className="text-[10px] text-slate-500 leading-tight mb-2">
                  {breakdown.verificationConfidence.explanation}
                </p>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-1 overflow-hidden">
                <div className="bg-emerald-600 h-full" style={{ width: `${breakdown.verificationConfidence.percentage}%` }} />
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs font-bold mb-1">
                  <span className="text-slate-800 flex items-center gap-1">
                    <Briefcase className="w-3.5 h-3.5 text-indigo-600" /> Interest
                  </span>
                  <span className="text-indigo-700">{breakdown.careerInterest.score}/15</span>
                </div>
                <p className="text-[10px] text-slate-500 leading-tight mb-2">
                  {breakdown.careerInterest.explanation}
                </p>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-1 overflow-hidden">
                <div className="bg-indigo-600 h-full" style={{ width: `${breakdown.careerInterest.percentage}%` }} />
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs font-bold mb-1">
                  <span className="text-slate-800 flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5 text-violet-600" /> Academic
                  </span>
                  <span className="text-violet-700">{breakdown.academicReadiness.score}/10</span>
                </div>
                <p className="text-[10px] text-slate-500 leading-tight mb-2">
                  {breakdown.academicReadiness.explanation}
                </p>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-1 overflow-hidden">
                <div className="bg-violet-600 h-full" style={{ width: `${breakdown.academicReadiness.percentage}%` }} />
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs font-bold mb-1">
                  <span className="text-slate-800 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-amber-600" /> Location
                  </span>
                  <span className="text-amber-700">{breakdown.locationPreference.score}/10</span>
                </div>
                <p className="text-[10px] text-slate-500 leading-tight mb-2">
                  {breakdown.locationPreference.explanation}
                </p>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-1 overflow-hidden">
                <div className="bg-amber-600 h-full" style={{ width: `${breakdown.locationPreference.percentage}%` }} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Skill Requirements Matrix Table */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-4">
          <Award className="w-5 h-5 text-blue-600" />
          Required Skills &amp; Proficiencies
        </h2>

        {isStudent && skillRequirements ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold">
                  <th className="py-3 px-4 rounded-l-xl">Skill</th>
                  <th className="py-3 px-4">Domain</th>
                  <th className="py-3 px-4">Required</th>
                  <th className="py-3 px-4">Your Level</th>
                  <th className="py-3 px-4">Verification</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right rounded-r-xl">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {skillRequirements.map((req: EvaluatedOpportunitySkill) => (
                  <tr key={req.skillId} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {req.skillName}
                      {req.isMandatory && (
                        <span className="ml-1.5 text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                          Mandatory
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">{req.categoryName || 'General'}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-800">{req.requiredProficiency}</td>
                    <td className="py-3.5 px-4">
                      {req.studentProficiency ? (
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-800 font-bold rounded">
                          {req.studentProficiency}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Not in profile</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      {req.isVerified ? (
                        <span className="text-emerald-700 font-bold flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5" /> Verified
                        </span>
                      ) : req.studentProficiency ? (
                        <span className="text-slate-500 font-medium">Self-reported</span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      {req.status === 'SATISFIED' ? (
                        <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          ✓ Satisfied
                        </span>
                      ) : req.status === 'DEFICIT' ? (
                        <span className="text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          ⚠ Deficit ({req.gapLevels} lvl)
                        </span>
                      ) : (
                        <span className="text-slate-600 font-bold bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          ✗ Missing
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {req.status === 'MISSING' ? (
                        <Link
                          to="/profile/student/skills"
                          className="text-blue-600 font-bold hover:underline"
                        >
                          Add Skill
                        </Link>
                      ) : !req.isVerified ? (
                        <Link to="/assessments" className="text-emerald-600 font-bold hover:underline">
                          Verify Test
                        </Link>
                      ) : (
                        <span className="text-emerald-600 font-semibold">Done</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {skills.map((sReq: any) => (
              <div key={sReq.skillId || sReq.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <p className="font-bold text-xs text-slate-900">{sReq.skill?.name || 'Skill'}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Required Level:{' '}
                  <span className="font-semibold text-slate-700">{sReq.requiredProficiency}</span>
                </p>
              </div>
            ))}
            {skills.length === 0 && (
              <p className="text-xs text-slate-400 italic col-span-3">No specific skill requirements listed.</p>
            )}
          </div>
        )}
      </div>

      {/* Description & Company Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-900">About the Opportunity &amp; Responsibilities</h2>
          <div className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line">
            {oppBase.description}
          </div>
        </div>

        {/* Company Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-blue-600" />
            Company Overview
          </h3>
          <div className="space-y-2 text-xs">
            <p className="font-bold text-slate-800 text-sm">
              {company.companyName || company.name}
            </p>
            <p className="text-slate-600">
              Industry: <span className="font-semibold">{company.industryType}</span>
            </p>
            {company.headquarters && (
              <p className="text-slate-600">
                Headquarters: <span className="font-semibold">{company.headquarters}</span>
              </p>
            )}
            {company.website && (
              <a
                href={company.website}
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 font-bold hover:underline flex items-center gap-1 pt-1"
              >
                <Globe className="w-3.5 h-3.5" /> Visit Company Website
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Apply Modal */}
      {isStudent && (
        <ApplyModal
          opportunity={{
            id: oppBase.id,
            title: oppBase.title,
            slug: oppBase.slug,
            opportunityType: oppBase.opportunityType,
            location: oppBase.location,
            companyName: company.companyName || company.name || 'Company',
          }}
          eligibility={eligibility}
          matchScore={score}
          isOpen={isApplyModalOpen}
          onClose={() => setIsApplyModalOpen(false)}
        />
      )}
    </div>
  );
};

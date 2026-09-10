import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Briefcase,
  Search,
  MapPin,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Building2,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Plus,
  Edit,
  Users,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { opportunityApi, OpportunityFilterParams } from '../../lib/opportunity-api';
import {
  OpportunityType,
  OpportunityBrief,
  OpportunityMatchResult,
} from '../../types/opportunities';

const OPPORTUNITY_TYPES: { label: string; value: string }[] = [
  { label: 'All Opportunities', value: 'ALL' },
  { label: 'Internships', value: 'INTERNSHIP' },
  { label: 'Full-Time Jobs', value: 'JOB' },
  { label: 'Apprenticeships', value: 'APPRENTICESHIP' },
  { label: 'Live Projects', value: 'LIVE_PROJECT' },
];

const FACULTY_OPPORTUNITY_TYPES: { label: string; value: string }[] = [
  { label: 'All Opportunities', value: 'ALL' },
  { label: 'Industry Internship / Training', value: 'INTERNSHIP' },
  { label: 'Professional Opportunities', value: 'JOB' },
  { label: 'Apprenticeship / Industry Training', value: 'APPRENTICESHIP' },
  { label: 'Research & Industry Projects', value: 'LIVE_PROJECT' },
];

const INSTITUTION_OPPORTUNITY_TYPES: { label: string; value: string }[] = [
  { label: 'All Opportunities', value: 'ALL' },
  { label: 'Internships', value: 'INTERNSHIP' },
  { label: 'Campus Hiring', value: 'JOB' },
  { label: 'Apprenticeships', value: 'APPRENTICESHIP' },
  { label: 'Live Projects', value: 'LIVE_PROJECT' },
];

const FACULTY_TYPE_BADGES: Record<string, string> = {
  INTERNSHIP: 'Industry Internship / Training',
  JOB: 'Professional Opportunity',
  APPRENTICESHIP: 'Apprenticeship / Industry Training',
  LIVE_PROJECT: 'Research / Industry Project',
};

const INDUSTRY_STATUS_FILTERS: { label: string; value: string }[] = [
  { label: 'All Statuses', value: 'ALL' },
  { label: 'Published', value: 'PUBLISHED' },
  { label: 'Draft', value: 'DRAFT' },
  { label: 'Closed', value: 'CLOSED' },
  { label: 'Archived', value: 'ARCHIVED' },
];

export const OpportunityMarketplacePage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const isStudent = isAuthenticated && user?.role === 'STUDENT';
  const isFaculty = isAuthenticated && user?.role === 'FACULTY';
  const isIndustry = isAuthenticated && user?.role === 'INDUSTRY';
  const isInstitution = isAuthenticated && user?.role === 'INSTITUTION_ADMIN';

  const filterTypes = isInstitution
    ? INSTITUTION_OPPORTUNITY_TYPES
    : isFaculty
    ? FACULTY_OPPORTUNITY_TYPES
    : OPPORTUNITY_TYPES;

  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [isRemoteOnly, setIsRemoteOnly] = useState(false);
  const [eligibleOnly, setEligibleOnly] = useState(false);
  const [page] = useState(1);

  // Memoize filterParams to prevent unnecessary query key churn on unrelated renders
  const filterParams: OpportunityFilterParams = useMemo(() => ({
    search: search || undefined,
    opportunityType: selectedType !== 'ALL' ? (selectedType as OpportunityType) : undefined,
    isRemote: isRemoteOnly ? true : undefined,
    eligibleOnly: isStudent && eligibleOnly ? true : undefined,
    page,
    limit: 20,
  }), [search, selectedType, isRemoteOnly, eligibleOnly, isStudent, page]);

  // Student query: personalized matched opportunities
  const {
    data: matchedData,
    isLoading: isLoadingMatched,
    isError: isErrorMatched,
  } = useQuery({
    queryKey: ['opportunities-matched', filterParams],
    queryFn: () => opportunityApi.getMatchedOpportunitiesForMe(filterParams),
    enabled: isStudent,
  });

  // Industry query: authenticated recruiter/organization opportunities
  const {
    data: industryData = [],
    isLoading: isLoadingIndustry,
    isError: isErrorIndustry,
  } = useQuery<OpportunityBrief[]>({
    queryKey: ['my-industry-postings'],
    queryFn: () => opportunityApi.getMyPostings(),
    enabled: isIndustry,
  });

  // Public query: catalog for faculty and unauthenticated visitors
  const {
    data: publicData,
    isLoading: isLoadingPublic,
    isError: isErrorPublic,
  } = useQuery({
    queryKey: ['opportunities-public', filterParams],
    queryFn: () => opportunityApi.getPublishedOpportunities(filterParams),
    enabled: !isStudent && !isIndustry,
  });

  const isLoading = isStudent ? isLoadingMatched : isIndustry ? isLoadingIndustry : isLoadingPublic;
  const isError = isStudent ? isErrorMatched : isIndustry ? isErrorIndustry : isErrorPublic;

  // Filter industry postings client-side for search, type, status, and remote criteria
  const filteredIndustryPostings = useMemo(() => {
    if (!isIndustry || !industryData) return [];
    return industryData.filter((opp) => {
      if (search) {
        const s = search.toLowerCase();
        const titleMatch = opp.title.toLowerCase().includes(s);
        const locationMatch = opp.location?.toLowerCase().includes(s);
        const typeMatch = opp.opportunityType.toLowerCase().includes(s);
        const companyMatch = (opp.company?.name || opp.company?.companyName || opp.industryProfile?.companyName || '').toLowerCase().includes(s);
        const skillMatch = opp.skills?.some((sk: any) =>
          (sk.skillName || sk.skill?.name || '').toLowerCase().includes(s)
        );
        if (!titleMatch && !locationMatch && !typeMatch && !companyMatch && !skillMatch) return false;
      }
      if (selectedType !== 'ALL' && opp.opportunityType !== selectedType) {
        return false;
      }
      if (selectedStatus !== 'ALL' && opp.status !== selectedStatus) {
        return false;
      }
      if (isRemoteOnly && !opp.isRemote) {
        return false;
      }
      return true;
    });
  }, [isIndustry, industryData, search, selectedType, selectedStatus, isRemoteOnly]);

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-violet-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-semibold">
              {isIndustry ? (
                <>
                  <Building2 className="w-3.5 h-3.5" /> My Industry Opportunities
                </>
              ) : isInstitution ? (
                <>
                  <Building2 className="w-3.5 h-3.5" /> Industry Opportunities
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />{' '}
                  {isFaculty ? 'Industry–Academia Opportunities' : 'Industry Opportunities Marketplace'}
                </>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {isIndustry
                ? 'Manage Your Industry Opportunities'
                : isInstitution
                ? 'Institution Opportunity Hub'
                : isFaculty
                ? 'Industry Engagement & Professional Opportunities'
                : 'Internships, Jobs & Industry Projects'}
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
              {isIndustry
                ? 'Create, publish, and manage internships, jobs, apprenticeships, and industry projects while connecting with students and academic talent.'
                : isInstitution
                ? 'Discover industry opportunities for your institution and coordinate relevant internships, placements, apprenticeships, and live projects for eligible students.'
                : isFaculty
                ? 'Explore industry-led opportunities for faculty development, professional engagement, collaborative projects, research, and industry–academia collaboration.'
                : 'Explore live industry postings matched deterministically against your verified skill profile and academic eligibility.'}
            </p>
          </div>

          {isIndustry && (
            <Link
              to="/portal/industry/opportunities/new"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-lg transition-colors self-start md:self-auto"
            >
              <Plus className="w-4 h-4" /> Post New Opportunity
            </Link>
          )}

          {isStudent && (
            <Link
              to="/skill-gaps"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl border border-white/20 transition-colors self-start md:self-auto"
            >
              <TrendingUp className="w-4 h-4 text-blue-300" /> Skill Gap Dashboard
            </Link>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
        {/* Search row */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={
                isIndustry
                  ? 'Search your opportunities by title, skill, type, or location...'
                  : isInstitution
                  ? 'Search by opportunity, organization, skill, or location...'
                  : isFaculty
                  ? 'Search by opportunity, organization, expertise, or location...'
                  : 'Search by role title, company name, skill, or location...'
              }
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
            />
          </div>
        </div>

        {/* Filter Controls Row */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-100">
          {/* Opportunity Type Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {filterTypes.map((t) => (
              <button
                key={t.value}
                onClick={() => setSelectedType(t.value)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                  selectedType === t.value
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Additional Status Filters & Remote Toggles */}
          <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-700">
            {isIndustry && (
              <div className="flex items-center gap-1 overflow-x-auto">
                <span className="text-slate-400 font-normal mr-1">Status:</span>
                {INDUSTRY_STATUS_FILTERS.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => setSelectedStatus(s.value)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                      selectedStatus === s.value
                        ? 'bg-slate-800 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            )}

            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isRemoteOnly}
                onChange={(e) => setIsRemoteOnly(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
              />
              <span>{isInstitution ? 'Remote Opportunities Only' : '100% Remote Only'}</span>
            </label>

            {isStudent && (
              <label className="flex items-center gap-2 cursor-pointer select-none text-emerald-700">
                <input
                  type="checkbox"
                  checked={eligibleOnly}
                  onChange={(e) => setEligibleOnly(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                />
                <span>Eligible Roles Only</span>
              </label>
            )}
          </div>
        </div>
      </div>

      {/* Loading & Error States */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center min-h-[300px] text-slate-500">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-3"></div>
          <p className="text-sm font-medium">
            {isIndustry ? 'Loading your industry opportunities...' : 'Loading opportunities...'}
          </p>
        </div>
      )}

      {isError && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center max-w-lg mx-auto">
          <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-red-900">Failed to load opportunities</h3>
          <p className="text-xs text-red-600 mt-1">Please refresh the page to retry.</p>
        </div>
      )}

      {/* Opportunity Cards List */}
      {!isLoading && !isError && (
        <>
          {/* Industry Empty State */}
          {isIndustry && filteredIndustryPostings.length === 0 && (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400">
              <Briefcase className="w-12 h-12 mx-auto mb-3 opacity-40 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-700">No opportunities published yet</h3>
              <p className="text-xs text-slate-500 mt-1">
                Create or publish an opportunity to start connecting with students and academic talent.
              </p>
              <Link
                to="/portal/industry/opportunities/new"
                className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-sm hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" /> Post Opportunity
              </Link>
            </div>
          )}

          {/* Student Empty State */}
          {isStudent && matchedData && matchedData.data.length === 0 && (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400">
              <Briefcase className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <h3 className="text-sm font-bold text-slate-700">No matching opportunities found</h3>
              <p className="text-xs text-slate-500 mt-1">
                Try widening your filter criteria or unchecking "Eligible Roles Only".
              </p>
            </div>
          )}

          {/* Public / Faculty / Institution Empty State */}
          {!isStudent && !isIndustry && publicData && publicData.data.length === 0 && (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400">
              <Briefcase className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <h3 className="text-sm font-bold text-slate-700">
                {isInstitution
                  ? 'No institutional opportunities found'
                  : isFaculty
                  ? 'No engagement opportunities found'
                  : 'No opportunities found'}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {isInstitution || isFaculty
                  ? 'Try adjusting your search or opportunity type filters.'
                  : 'Try adjusting your keyword or domain filters.'}
              </p>
            </div>
          )}

          {/* Render Industry Postings (for Industry Users) */}
          {isIndustry && filteredIndustryPostings.length > 0 && (
            <div className="space-y-4">
              {filteredIndustryPostings.map((opp: OpportunityBrief) => (
                <div
                  key={opp.id}
                  className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm hover:border-blue-300 hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-6"
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
                        {opp.opportunityType.replace('_', ' ')}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                          opp.status === 'PUBLISHED'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : opp.status === 'DRAFT'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        {opp.status}
                      </span>
                      {opp.isRemote && (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                          Remote
                        </span>
                      )}
                      <span className="text-xs text-slate-400">•</span>
                      <span className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />{' '}
                        {opp.company?.name || opp.company?.companyName || opp.industryProfile?.companyName || 'Your Organization'}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-slate-900">{opp.title}</h3>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" /> {opp.location}
                      </span>
                      {opp.stipend !== null && opp.stipend !== undefined && (
                        <span className="font-semibold text-slate-700">
                          ₹{opp.stipend.toLocaleString()} / {opp.stipendPeriod?.toLowerCase() || 'month'}
                        </span>
                      )}
                      {opp.deadline && (
                        <span className="flex items-center gap-1 text-slate-500">
                          <Clock className="w-3.5 h-3.5 text-slate-400" /> Deadline:{' '}
                          {new Date(opp.deadline).toLocaleDateString()}
                        </span>
                      )}
                    </div>

                    {opp.skills && opp.skills.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        {opp.skills.slice(0, 5).map((s: any) => (
                          <span
                            key={s.id || s.skillId}
                            className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200"
                          >
                            {s.skillName || s.skill?.name || 'Skill'}
                          </span>
                        ))}
                        {opp.skills.length > 5 && (
                          <span className="text-[10px] text-slate-400 font-medium">
                            +{opp.skills.length - 5} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
                    <Link
                      to={`/portal/industry/opportunities/${opp.id}/applications`}
                      className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold rounded-xl transition-colors"
                      title="View Candidate Applications"
                    >
                      <Users className="w-3.5 h-3.5" /> Candidates
                    </Link>
                    <Link
                      to={`/portal/industry/opportunities/${opp.id}/edit`}
                      className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
                      title="Edit Opportunity"
                    >
                      <Edit className="w-3.5 h-3.5" /> Edit
                    </Link>
                    <Link
                      to={`/opportunities/${opp.slug}`}
                      className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm transition-colors"
                      title="View Public Posting"
                    >
                      View Posting <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Render Matched Opportunities (for Students) */}
          {isStudent && matchedData && (
            <div className="space-y-4">
              {matchedData.data.map((match: OpportunityMatchResult) => {
                const opp = match.opportunity;
                const score = match.overallScore;
                const isEligible = match.eligibility.isEligible;

                const scoreBadgeColor =
                  score >= 75
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : score >= 50
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : 'bg-slate-50 text-slate-700 border-slate-200';

                const progressBg =
                  score >= 75 ? 'bg-emerald-500' : score >= 50 ? 'bg-amber-500' : 'bg-slate-500';

                return (
                  <div
                    key={opp.id}
                    className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm hover:border-blue-300 hover:shadow-md transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-6"
                  >
                    <div className="flex-1 space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
                          {opp.opportunityType.replace('_', ' ')}
                        </span>
                        {opp.isRemote && (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                            Remote
                          </span>
                        )}
                        <span className="text-xs text-slate-400">•</span>
                        <span className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" /> {opp.company?.name || 'Enterprise'}
                        </span>
                      </div>

                      <div>
                        <h3 className="text-lg font-bold text-slate-900">{opp.title}</h3>
                        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mt-1">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" /> {opp.location}
                          </span>
                          {opp.stipend !== null && opp.stipend !== undefined && (
                            <span className="font-semibold text-slate-700">
                              ₹{opp.stipend.toLocaleString()} / {opp.stipendPeriod.toLowerCase()}
                            </span>
                          )}
                          {opp.deadline && (
                            <span className="flex items-center gap-1 text-slate-500">
                              <Clock className="w-3.5 h-3.5 text-slate-400" /> Deadline:{' '}
                              {new Date(opp.deadline).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Required Skills Chips */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        {match.skillRequirements.slice(0, 4).map((sr) => (
                          <span
                            key={sr.skillId}
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1 ${
                              sr.status === 'SATISFIED'
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : sr.status === 'DEFICIT'
                                ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                : 'bg-slate-100 text-slate-600 border border-slate-200'
                            }`}
                          >
                            {sr.skillName} ({sr.requiredProficiency})
                          </span>
                        ))}
                        {match.skillRequirements.length > 4 && (
                          <span className="text-[10px] text-slate-400 font-medium">
                            +{match.skillRequirements.length - 4} more
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Compatibility Score & Eligibility Column */}
                    <div className="flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-end justify-between gap-4 min-w-[220px] border-t lg:border-t-0 lg:border-l border-slate-100 pt-4 lg:pt-0 lg:pl-6">
                      <div className="w-full text-left lg:text-right space-y-1.5">
                        <div className="flex items-center justify-between lg:justify-end gap-2">
                          <span className="text-xs font-semibold text-slate-500">Compatibility:</span>
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold border ${scoreBadgeColor}`}>
                            {score}% Match
                          </span>
                        </div>
                        <div className="w-full lg:w-36 bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div className={`h-full rounded-full ${progressBg}`} style={{ width: `${score}%` }} />
                        </div>

                        {/* Separate Eligibility Status Pill */}
                        <div className="pt-1">
                          {isEligible ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Eligible to Apply
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                              <XCircle className="w-3.5 h-3.5 text-amber-600" /> Ineligible (Hard Criteria)
                            </span>
                          )}
                        </div>
                      </div>

                      <Link
                        to={`/opportunities/${opp.slug}`}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm transition-colors"
                      >
                        View Details <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Render Public Catalog (Non-student, non-industry view) */}
          {!isStudent && !isIndustry && publicData && (
            <div className="space-y-4">
              {publicData.data.map((opp: OpportunityBrief) => (
                <div
                  key={opp.id}
                  className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm hover:border-blue-300 hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-6"
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
                        {isInstitution && opp.opportunityType === 'JOB'
                          ? 'Campus Hiring'
                          : isFaculty
                          ? (FACULTY_TYPE_BADGES[opp.opportunityType] || opp.opportunityType.replace('_', ' '))
                          : opp.opportunityType.replace('_', ' ')}
                      </span>
                      {opp.isRemote && (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                          Remote
                        </span>
                      )}
                      <span className="text-xs text-slate-400">•</span>
                      <span className="text-xs font-semibold text-slate-600">
                        {opp.industryProfile?.companyName || opp.company?.companyName || opp.company?.name || 'Enterprise'}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-slate-900">{opp.title}</h3>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" /> {opp.location}
                      </span>
                      {opp.stipend !== null && opp.stipend !== undefined && (
                        <span className="font-semibold text-slate-700">
                          ₹{opp.stipend.toLocaleString()} / {opp.stipendPeriod.toLowerCase()}
                        </span>
                      )}
                    </div>
                  </div>

                  <Link
                    to={`/opportunities/${opp.slug}`}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm transition-colors"
                  >
                    View Opportunity <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

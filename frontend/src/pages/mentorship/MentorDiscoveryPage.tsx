import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Search,
  Filter,
  Users,
  Briefcase,
  GraduationCap,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  BookOpen,
} from 'lucide-react';
import { mentorshipApi } from '../../lib/mentorship-api';
import { MentorProfile, MentorRoleType } from '../../types/mentorship';
import { MentorCard } from '../../components/mentorship/MentorCard';
import { RequestMentorshipModal } from '../../components/mentorship/RequestMentorshipModal';
import { BookSessionModal } from '../../components/mentorship/BookSessionModal';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { useAuth } from '../../context/AuthContext';

export const MentorDiscoveryPage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const isFaculty = isAuthenticated && user?.role === 'FACULTY';
  const isInstitution = isAuthenticated && user?.role === 'INSTITUTION_ADMIN';

  const [searchParams, setSearchParams] = useSearchParams();

  const initialSearch = searchParams.get('search') || '';
  const initialSkillId = searchParams.get('skillId') || '';
  const initialCareerRoleId = searchParams.get('careerRoleId') || '';
  const initialRoleType = (searchParams.get('mentorRoleType') as MentorRoleType) || '';

  const [search, setSearch] = useState<string>(initialSearch);
  const [selectedRoleType, setSelectedRoleType] = useState<string>(initialRoleType);
  const [onlyAvailable, setOnlyAvailable] = useState<boolean>(true);
  const [page, setPage] = useState<number>(1);

  // Modals state
  const [selectedMentorForRequest, setSelectedMentorForRequest] = useState<MentorProfile | null>(
    null,
  );
  const [selectedMentorForBooking, setSelectedMentorForBooking] = useState<MentorProfile | null>(
    null,
  );

  // Sync state when URL params change (e.g., from Skill Gap "Find a Mentor" CTA)
  useEffect(() => {
    if (searchParams.get('skillId')) {
      // Keep page 1 on filter changes
      setPage(1);
    }
  }, [searchParams]);

  const queryParams = {
    search: search.trim() || undefined,
    skillId: initialSkillId || undefined,
    careerRoleId: initialCareerRoleId || undefined,
    mentorRoleType: (selectedRoleType as MentorRoleType) || undefined,
    isAvailable: onlyAvailable ? true : undefined,
    page,
    limit: 9,
  };

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['mentors-discovery', queryParams],
    queryFn: () => mentorshipApi.findMentors(queryParams),
  });

  const mentors = data?.items || [];
  const meta = data?.meta || { total: 0, page: 1, limit: 9, totalPages: 1 };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    const newParams = new URLSearchParams(searchParams);
    if (search.trim()) {
      newParams.set('search', search.trim());
    } else {
      newParams.delete('search');
    }
    setSearchParams(newParams);
  };

  const clearFilter = (paramKey: string) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.delete(paramKey);
    setSearchParams(newParams);
    setPage(1);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-brand-900 via-indigo-950 to-slate-900 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/20 text-brand-300 text-xs font-bold border border-brand-500/30">
            <Sparkles className="w-3.5 h-3.5" />
            <span>
              {isInstitution
                ? 'Industry-Academia Mentorship'
                : 'Deterministic Skill & Career Guidance'}
            </span>
          </div>
          <h1 className="text-3xl font-black tracking-tight sm:text-4xl text-white">
            {isInstitution
              ? 'Mentorship Programmes'
              : isFaculty
              ? 'Industry Mentorship & Professional Guidance'
              : 'Find Your Next Industry & Academic Mentor'}
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed">
            {isInstitution
              ? 'Discover and coordinate industry-led mentorship programmes that connect students and faculty with experienced professionals for career guidance, technical development, and industry exposure.'
              : isFaculty
              ? 'Connect with experienced industry practitioners and academic mentors for professional development, industry insights, knowledge exchange, and meaningful academia–industry engagement.'
              : 'Connect directly with qualified industry practitioners and faculty experts for 1-on-1 sessions, career roadmaps, and targeted skill gap remediation.'}
          </p>
        </div>
      </div>

      {/* Active Skill Gap Filter Banner */}
      {initialSkillId && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 text-xs text-amber-900">
            <BookOpen className="w-4 h-4 text-amber-600" />
            <span>
              Filtering mentors possessing skill ID:{' '}
              <strong className="font-mono bg-amber-100 px-2 py-0.5 rounded">{initialSkillId}</strong>
            </span>
          </div>
          <button
            onClick={() => clearFilter('skillId')}
            className="text-xs font-bold text-amber-800 hover:text-amber-950 underline shrink-0"
          >
            Clear Filter
          </button>
        </div>
      )}

      {/* Active Career Role Filter Banner */}
      {initialCareerRoleId && (
        <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 text-xs text-indigo-900">
            <Briefcase className="w-4 h-4 text-indigo-600" />
            <span>
              Filtering mentors for Career Role:{' '}
              <strong className="font-mono bg-indigo-100 px-2 py-0.5 rounded">
                {initialCareerRoleId}
              </strong>
            </span>
          </div>
          <button
            onClick={() => clearFilter('careerRoleId')}
            className="text-xs font-bold text-indigo-800 hover:text-indigo-950 underline shrink-0"
          >
            Clear Filter
          </button>
        </div>
      )}

      {/* Search & Filters Controls */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
        <form
          onSubmit={handleSearchSubmit}
          className="flex flex-col md:flex-row items-center gap-3"
        >
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={
                isInstitution
                  ? 'Search by programme, company, domain, or mentor expertise.'
                  : 'Search by mentor name, designation, company, skills (e.g. React, Cloud)...'
              }
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 bg-slate-50/50"
            />
          </div>
          <button
            type="submit"
            className="w-full md:w-auto px-6 py-2.5 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold transition-colors shadow-sm shrink-0"
          >
            Search Mentors
          </button>
        </form>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-slate-700 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              {isInstitution ? 'Programme Type:' : 'Mentor Type:'}
            </span>
            <button
              onClick={() => {
                setSelectedRoleType('');
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-colors ${
                selectedRoleType === ''
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {isInstitution ? 'All Programmes' : 'All Types'}
            </button>
            <button
              onClick={() => {
                setSelectedRoleType('INDUSTRY');
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-colors inline-flex items-center gap-1.5 ${
                selectedRoleType === 'INDUSTRY'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5" />
              {isInstitution ? 'Industry Mentorship' : 'Industry'}
            </button>
            <button
              onClick={() => {
                setSelectedRoleType('FACULTY');
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-colors inline-flex items-center gap-1.5 ${
                selectedRoleType === 'FACULTY'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              {isInstitution ? 'Faculty Mentorship' : 'Faculty'}
            </button>
          </div>

          <label className="flex items-center gap-2 font-semibold text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={onlyAvailable}
              onChange={(e) => {
                setOnlyAvailable(e.target.checked);
                setPage(1);
              }}
              className="rounded text-brand-600 focus:ring-brand-500 w-4 h-4"
            />
            <span>Show currently accepting mentees only</span>
          </label>
        </div>
      </div>

      {/* Results Count & Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs text-slate-500 font-semibold px-1">
          <span>
            {isInstitution
              ? `Showing ${mentors.length} of ${meta.total} available mentorship programmes`
              : `Showing ${mentors.length} of ${meta.total} available mentors`}
          </span>
          {user?.role === 'STUDENT' && (
            <Link
              to="/portal/student/mentorship"
              className="text-brand-600 hover:text-brand-700 font-bold"
            >
              My Active Mentorships & Requests →
            </Link>
          )}
        </div>

        {isLoading ? (
          <div className="py-20 flex justify-center">
            <LoadingSpinner />
          </div>
        ) : error ? (
          <div className="p-8 rounded-3xl bg-rose-50 border border-rose-200 text-center text-rose-700 text-xs">
            Failed to load mentors. Please try again later.
          </div>
        ) : mentors.length === 0 ? (
          <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-12 text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mx-auto">
              <Users className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-800">
              {isInstitution
                ? 'No mentorship programmes found'
                : 'No mentors match your search criteria'}
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {isInstitution
                ? 'Try adjusting your search terms, removing filters, or exploring a broader range of mentorship programmes.'
                : 'Try adjusting your search terms, removing skill filters, or broadening your mentor type selection.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mentors.map((mentor) => (
              <MentorCard
                key={mentor.id}
                mentor={mentor}
                onRequestClick={() => setSelectedMentorForRequest(mentor)}
                onBookClick={() => setSelectedMentorForBooking(mentor)}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {meta.totalPages > 1 && (
          <div className="pt-6 flex items-center justify-center gap-3 text-xs">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-bold"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-semibold text-slate-700">
              Page {meta.page} of {meta.totalPages}
            </span>
            <button
              disabled={page >= meta.totalPages}
              onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
              className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-bold"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Modals */}
      {selectedMentorForRequest && (
        <RequestMentorshipModal
          mentor={selectedMentorForRequest}
          isOpen={!!selectedMentorForRequest}
          onClose={() => setSelectedMentorForRequest(null)}
          onSubmit={async (payload) => {
            await mentorshipApi.requestMentorship(selectedMentorForRequest.id, payload);
            setSelectedMentorForRequest(null);
            refetch();
          }}
        />
      )}

      {selectedMentorForBooking && (
        <BookSessionModal
          mentor={selectedMentorForBooking}
          isOpen={!!selectedMentorForBooking}
          onClose={() => setSelectedMentorForBooking(null)}
          onSubmit={async (payload) => {
            await mentorshipApi.bookSession(selectedMentorForBooking.id, payload);
            setSelectedMentorForBooking(null);
            refetch();
          }}
        />
      )}
    </div>
  );
};

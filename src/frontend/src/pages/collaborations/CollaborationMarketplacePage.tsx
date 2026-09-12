import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Handshake,
  PlusCircle,
  Loader2,
  AlertCircle,
  BookOpen,
} from 'lucide-react';
import { collaborationApi } from '../../lib/collaboration-api';
import { CollaborationCard } from '../../components/collaborations/CollaborationCard';
import { CollaborationFilters } from '../../components/collaborations/CollaborationFilters';
import { useAuth } from '../../context/AuthContext';

export const CollaborationMarketplacePage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const isIndustry = isAuthenticated && user?.role === 'INDUSTRY';
  const isInstitution = isAuthenticated && user?.role === 'INSTITUTION_ADMIN';

  const [search, setSearch] = useState('');
  const [collaborationType, setCollaborationType] = useState('');
  const [targetAudience, setTargetAudience] = useState(
    user?.role === 'FACULTY' ? 'FACULTY' : user?.role === 'STUDENT' ? 'STUDENT' : '',
  );
  const [mode, setMode] = useState('');
  const [department, setDepartment] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: [
      'collaborations-marketplace',
      search,
      collaborationType,
      targetAudience,
      mode,
      department,
      page,
    ],
    queryFn: () =>
      collaborationApi.getCollaborations({
        search: search || undefined,
        collaborationType: collaborationType || undefined,
        targetAudience: targetAudience || undefined,
        mode: mode || undefined,
        department: department || undefined,
        page,
        limit: 12,
      }),
  });

  const handleReset = () => {
    setSearch('');
    setCollaborationType('');
    setTargetAudience('');
    setMode('');
    setDepartment('');
    setPage(1);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-indigo-900 via-brand-900 to-slate-900 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/20 text-brand-300 text-xs font-semibold backdrop-blur-md mb-4 border border-brand-400/20">
            <Handshake className="w-3.5 h-3.5" />
            {isInstitution
              ? 'Institution Collaboration Hub'
              : isIndustry
              ? 'Industry–Academia Collaboration'
              : 'Academia–Industry Collaboration Marketplace'}
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-white">
            {isInstitution
              ? 'Industry and Academic Collaborations'
              : isIndustry
              ? 'Build Stronger Academia–Industry Partnerships'
              : 'Connect, Learn, and Co-Innovate with Leading Industries'}
          </h1>
          <p className="mt-3 text-slate-300 text-sm leading-relaxed">
            {isInstitution
              ? 'Discover industry programmes, projects, training, research and partnership opportunities for your institution, faculty and students.'
              : isIndustry
              ? 'Create and engage in industry-led programs, live projects, research collaborations, guest lectures, training, and other initiatives that connect your organization with academic institutions and faculty.'
              : 'Explore Faculty Development Programs (FDPs), Industrial Training, Workshops, Live Industry Projects, Guest Lectures, Research Collaborations, and Consultancy.'}
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            {user?.role === 'INDUSTRY' && (
              <Link
                to="/industry/collaborations/create"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold transition-all shadow-md shadow-brand-500/25"
              >
                <PlusCircle className="w-4 h-4" />
                Post Collaboration Program
              </Link>
            )}

            {user?.role === 'FACULTY' && (
              <Link
                to="/faculty/collaborations/my"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur-md transition-colors"
              >
                <BookOpen className="w-4 h-4" />
                My Faculty Participations
              </Link>
            )}

            {user?.role === 'STUDENT' && (
              <Link
                to="/student/collaborations/my"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur-md transition-colors"
              >
                <BookOpen className="w-4 h-4" />
                My Project Participations
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <CollaborationFilters
        search={search}
        onSearchChange={(v) => {
          setSearch(v);
          setPage(1);
        }}
        collaborationType={collaborationType}
        onTypeChange={(v) => {
          setCollaborationType(v);
          setPage(1);
        }}
        targetAudience={targetAudience}
        onAudienceChange={(v) => {
          setTargetAudience(v);
          setPage(1);
        }}
        mode={mode}
        onModeChange={(v) => {
          setMode(v);
          setPage(1);
        }}
        department={department}
        onDepartmentChange={(v) => {
          setDepartment(v);
          setPage(1);
        }}
        onReset={handleReset}
      />

      {/* Results Section */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-brand-600 mb-3" />
          <p className="text-sm font-medium">Loading collaboration opportunities...</p>
        </div>
      ) : isError ? (
        <div className="p-8 bg-rose-50 border border-rose-200 rounded-2xl text-center">
          <AlertCircle className="w-8 h-8 text-rose-600 mx-auto mb-2" />
          <h3 className="font-bold text-rose-900 text-base">Failed to load marketplace</h3>
          <p className="text-xs text-rose-700 mt-1">{(error as any)?.message || 'An error occurred.'}</p>
          <button
            onClick={() => refetch()}
            className="mt-4 px-4 py-2 text-xs font-semibold bg-rose-600 text-white rounded-xl hover:bg-rose-700"
          >
            Try Again
          </button>
        </div>
      ) : !data || data.items.length === 0 ? (
        <div className="p-12 text-center bg-white border border-slate-200 rounded-3xl">
          <Handshake className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-slate-800 text-base">
            {isIndustry ? 'No collaboration programs found' : 'No Collaborations Found'}
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
            {isIndustry
              ? 'Try adjusting your search or collaboration filters to discover relevant academia–industry engagement opportunities.'
              : 'No active academia-industry collaboration engagements matched your filters.'}
          </p>
          <button
            onClick={handleReset}
            className="mt-4 px-4 py-2 text-xs font-semibold bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>
              Showing <strong>{data.items.length}</strong> of <strong>{data.total}</strong> active engagements
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.items.map((collab) => (
              <CollaborationCard key={collab.id} collaboration={collab} />
            ))}
          </div>

          {/* Pagination */}
          {data.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-6">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-40"
              >
                Previous
              </button>
              <span className="text-xs text-slate-500 px-3 font-medium">
                Page {page} of {data.totalPages}
              </span>
              <button
                disabled={page >= data.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

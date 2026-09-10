import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  Users,
  Building,
  GraduationCap,
  Briefcase,
  Loader2,
  Eye,
} from 'lucide-react';
import { collaborationApi } from '../../lib/collaboration-api';
import { ParticipationStatusBadge } from '../../components/collaborations/ParticipationStatusBadge';
import { ReviewParticipationModal } from '../../components/collaborations/ReviewParticipationModal';
import { CollaborationParticipation } from '../../types/collaboration';

export const CollaborationParticipantsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [selectedParticipation, setSelectedParticipation] =
    useState<CollaborationParticipation | null>(null);

  const { data: collaboration, isLoading: isLoadingCollab } = useQuery({
    queryKey: ['collaboration-detail', id],
    queryFn: () => collaborationApi.getCollaborationById(id!),
    enabled: Boolean(id),
  });

  const {
    data: participantsData,
    isLoading: isLoadingParticipants,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['collaboration-participants', id, statusFilter],
    queryFn: () =>
      collaborationApi.getCollaborationParticipants(id!, {
        status: statusFilter || undefined,
        limit: 50,
      }),
    enabled: Boolean(id),
  });

  if (isLoadingCollab || isLoadingParticipants) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-brand-600 mb-3" />
        <p className="text-sm font-medium text-slate-500">Loading participants list...</p>
      </div>
    );
  }

  const participants = participantsData?.items || [];
  const approvedCount = participants.filter((p) => p.status === 'APPROVED').length;
  const pendingCount = participants.filter((p) => p.status === 'PENDING').length;
  const completedCount = participants.filter((p) => p.status === 'COMPLETED').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-300">
      {/* Back button */}
      <Link
        to="/industry/collaborations"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Collaborations
      </Link>

      {/* Header card with collaboration summary & capacity stats */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-brand-600">
              Participant Management
            </span>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
              {collaboration?.title || 'Collaboration Engagement'}
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Review and manage faculty and student enrollment requests.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="text-right">
              <span className="text-xs text-slate-500 block">Enrolled / Cap</span>
              <span className="text-lg font-black text-slate-900">
                {approvedCount}
                {collaboration?.maxParticipants ? ` / ${collaboration.maxParticipants}` : ' (No Cap)'}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-100 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-slate-500 block font-medium mb-0.5">Total Requests</span>
            <strong className="text-base text-slate-900 font-bold">{participants.length}</strong>
          </div>
          <div className="p-3 bg-amber-50 rounded-xl">
            <span className="text-amber-700 block font-medium mb-0.5">Pending Review</span>
            <strong className="text-base text-amber-900 font-bold">{pendingCount}</strong>
          </div>
          <div className="p-3 bg-emerald-50 rounded-xl">
            <span className="text-emerald-700 block font-medium mb-0.5">Approved & Enrolled</span>
            <strong className="text-base text-emerald-900 font-bold">{approvedCount}</strong>
          </div>
          <div className="p-3 bg-blue-50 rounded-xl">
            <span className="text-blue-700 block font-medium mb-0.5">Completed</span>
            <strong className="text-base text-blue-900 font-bold">{completedCount}</strong>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {['', 'PENDING', 'APPROVED', 'REJECTED', 'COMPLETED', 'WITHDRAWN'].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              statusFilter === s
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {s === '' ? 'All Participants' : s.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Participants Table / List */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {isError ? (
          <div className="p-8 text-center text-rose-600 text-xs">
            Failed to load participants: {(error as any)?.message}
          </div>
        ) : participants.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="font-bold text-slate-800 text-sm">No Participants Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              No participation requests match the selected status filter.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {participants.map((participation) => {
              const isFaculty = Boolean(participation.facultyProfile);
              const name =
                participation.facultyProfile?.fullName ||
                participation.studentProfile?.fullName ||
                'Participant';
              const institutionName =
                participation.facultyProfile?.institution?.name ||
                participation.studentProfile?.institution?.name ||
                'Independent';
              const department =
                participation.facultyProfile?.department ||
                participation.studentProfile?.department ||
                'N/A';

              return (
                <div
                  key={participation.id}
                  className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors"
                >
                  <div className="space-y-2 max-w-2xl">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          isFaculty
                            ? 'bg-purple-50 text-purple-700 border border-purple-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        {isFaculty ? (
                          <>
                            <Briefcase className="w-3 h-3" /> Faculty
                          </>
                        ) : (
                          <>
                            <GraduationCap className="w-3 h-3" /> Student
                          </>
                        )}
                      </span>
                      <ParticipationStatusBadge status={participation.status} />
                    </div>

                    <h3 className="font-bold text-slate-900 text-base">{name}</h3>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
                      <span className="flex items-center gap-1 font-medium text-slate-700">
                        <Building className="w-3.5 h-3.5 text-slate-400" />
                        {institutionName}
                      </span>
                      <span>•</span>
                      <span>Department: {department}</span>
                      {participation.studentProfile?.cgpa && (
                        <>
                          <span>•</span>
                          <span>CGPA: {participation.studentProfile.cgpa}</span>
                        </>
                      )}
                    </div>

                    {/* Motivation snippet */}
                    {participation.motivation && (
                      <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 line-clamp-2">
                        <strong className="text-slate-700 font-semibold">Motivation:</strong>{' '}
                        {participation.motivation}
                      </p>
                    )}

                    {/* Private Industry Notes Preview */}
                    {participation.industryNotes && (
                      <p className="text-xs text-amber-800 bg-amber-50/70 p-2 rounded-lg border border-amber-200">
                        <strong>Internal Note:</strong> {participation.industryNotes}
                      </p>
                    )}
                  </div>

                  {/* Review Action */}
                  <div className="shrink-0 flex items-center gap-2">
                    <button
                      onClick={() => setSelectedParticipation(participation)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-slate-900 hover:bg-slate-800 text-white transition-all shadow-sm"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Review & Decide
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Review & Status Decision Modal */}
      {selectedParticipation && (
        <ReviewParticipationModal
          collaborationId={id!}
          participation={selectedParticipation}
          isOpen={Boolean(selectedParticipation)}
          onClose={() => setSelectedParticipation(null)}
          onSuccess={() => {
            refetch();
          }}
        />
      )}
    </div>
  );
};

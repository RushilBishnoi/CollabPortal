import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  Building2,
  Calendar,
  Clock,
  MapPin,
  Loader2,
  AlertCircle,
  XCircle,
  FileText,
  History,
  ExternalLink,
} from 'lucide-react';
import { collaborationApi } from '../../lib/collaboration-api';
import { ParticipationStatusBadge } from '../../components/collaborations/ParticipationStatusBadge';
import { CollaborationTypeBadge } from '../../components/collaborations/CollaborationTypeBadge';
import { ParticipationTimeline } from '../../components/collaborations/ParticipationTimeline';
import { useAuth } from '../../context/AuthContext';

export const ParticipationDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isFaculty = user?.role === 'FACULTY';
  const [actionError, setActionError] = useState<string | null>(null);

  const { data: participation, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['my-participation-detail', id],
    queryFn: () => {
      if (isFaculty) {
        return collaborationApi.getMyFacultyParticipationById(id!);
      } else {
        return collaborationApi.getMyStudentParticipationById(id!);
      }
    },
    enabled: Boolean(id),
  });

  const handleWithdraw = async () => {
    if (!window.confirm('Are you sure you want to withdraw your participation request?')) return;
    setActionError(null);
    try {
      if (isFaculty) {
        await collaborationApi.withdrawFacultyParticipation(id!);
      } else {
        await collaborationApi.withdrawStudentParticipation(id!);
      }
      refetch();
    } catch (err: any) {
      setActionError(err.message || 'Failed to withdraw participation');
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-brand-600 mb-3" />
        <p className="text-sm font-medium text-slate-500">Loading participation details...</p>
      </div>
    );
  }

  if (isError || !participation) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-slate-900">Participation Record Not Found</h2>
        <p className="text-sm text-slate-600 mt-2">
          {(error as any)?.message || 'The requested participation details could not be found.'}
        </p>
        <button
          onClick={() => navigate(isFaculty ? '/faculty/collaborations/my' : '/student/collaborations/my')}
          className="mt-6 inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-brand-600 rounded-xl hover:bg-brand-700"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Participations
        </button>
      </div>
    );
  }

  const collab = participation.collaboration;
  const canWithdraw =
    participation.status === 'PENDING' || participation.status === 'APPROVED';

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-300">
      {/* Back button */}
      <Link
        to={isFaculty ? '/faculty/collaborations/my' : '/student/collaborations/my'}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to My Participations
      </Link>

      {actionError && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Main Header Card */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {collab?.collaborationType && (
              <CollaborationTypeBadge type={collab.collaborationType} />
            )}
            <ParticipationStatusBadge status={participation.status} />
          </div>

          {canWithdraw && (
            <button
              onClick={handleWithdraw}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-xl text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors"
            >
              <XCircle className="w-4 h-4" />
              Withdraw Participation
            </button>
          )}
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          {collab?.title || 'Collaboration Engagement'}
        </h1>

        <div className="flex items-center gap-2 text-sm text-slate-600 pt-2 border-t border-slate-100">
          <Building2 className="w-4 h-4 text-brand-600" />
          <span className="font-semibold text-slate-800">
            {collab?.industryProfile?.companyName || 'Host Industry'}
          </span>
          <span>•</span>
          <span>Requested on {new Date(participation.requestedAt).toLocaleDateString()}</span>
        </div>
      </div>

      {/* Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Candidate Application & Engagement Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Rejection notice if applicable */}
          {participation.rejectionReason && (
            <div className="p-5 bg-rose-50 border border-rose-200 rounded-2xl text-xs space-y-1 text-rose-800">
              <strong className="font-bold text-rose-900 block text-sm">Status Update Note:</strong>
              <p>{participation.rejectionReason}</p>
            </div>
          )}

          {/* Meeting / Attendance Details if Approved */}
          {participation.status === 'APPROVED' && (
            <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-3xl space-y-3">
              <h3 className="font-bold text-emerald-900 text-sm">Enrollment Details</h3>
              <p className="text-xs text-emerald-700">
                You are officially enrolled in this engagement! Please review access details below:
              </p>

              {collab?.meetingLink && (
                <div className="pt-2">
                  <a
                    href={collab.meetingLink}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Join Virtual Session
                  </a>
                </div>
              )}

              {collab?.location && (
                <div className="flex items-center gap-2 text-xs text-emerald-800 pt-1">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  <span>Venue: {collab.location}</span>
                </div>
              )}
            </div>
          )}

          {/* Motivation & Experience Submitted */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-brand-600" />
              Your Application Submission
            </h2>

            {participation.motivation ? (
              <div>
                <span className="text-xs text-slate-500 font-semibold block mb-1">
                  Statement of Motivation:
                </span>
                <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100 whitespace-pre-line leading-relaxed">
                  {participation.motivation}
                </p>
              </div>
            ) : null}

            {participation.relevantExperience ? (
              <div className="pt-2">
                <span className="text-xs text-slate-500 font-semibold block mb-1">
                  Relevant Experience / Background:
                </span>
                <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100 whitespace-pre-line leading-relaxed">
                  {participation.relevantExperience}
                </p>
              </div>
            ) : null}
          </div>

          {/* Audit Timeline */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <History className="w-5 h-5 text-brand-600" />
              Status History Timeline
            </h2>
            <ParticipationTimeline history={participation.statusHistory} />
          </div>
        </div>

        {/* Right Col: Engagement Info */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Engagement Information</h3>
            <div className="space-y-3 text-xs text-slate-600">
              {collab?.durationDays && (
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-500">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    Duration
                  </span>
                  <span className="font-semibold text-slate-800">
                    {collab.durationDays} Days ({collab.sessionCount || 1} Sessions)
                  </span>
                </div>
              )}

              {collab?.startDate && (
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-500">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    Start Date
                  </span>
                  <span className="font-semibold text-slate-800">
                    {new Date(collab.startDate).toLocaleDateString()}
                  </span>
                </div>
              )}

              {collab?.contactEmail && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Coordinator</span>
                  <span className="font-semibold text-slate-800">{collab.contactEmail}</span>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100">
              <Link
                to={`/collaborations/${collab?.id}`}
                className="w-full inline-flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors"
              >
                View Full Engagement Listing
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

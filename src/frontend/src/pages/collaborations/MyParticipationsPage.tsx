import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Handshake,
  Building2,
  Loader2,
  AlertCircle,
  XCircle,
  Eye,
} from 'lucide-react';
import { collaborationApi } from '../../lib/collaboration-api';
import { ParticipationStatusBadge } from '../../components/collaborations/ParticipationStatusBadge';
import { CollaborationTypeBadge } from '../../components/collaborations/CollaborationTypeBadge';
import { useAuth } from '../../context/AuthContext';
import { ParticipationStatus } from '../../types/collaboration';

export const MyParticipationsPage: React.FC = () => {
  const { user } = useAuth();
  const isFaculty = user?.role === 'FACULTY';
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [actionError, setActionError] = useState<string | null>(null);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['my-participations', user?.role, statusFilter],
    queryFn: () => {
      if (isFaculty) {
        return collaborationApi.getMyFacultyParticipations({
          status: (statusFilter as ParticipationStatus) || undefined,
        });
      } else {
        return collaborationApi.getMyStudentParticipations({
          status: (statusFilter as ParticipationStatus) || undefined,
        });
      }
    },
  });

  const handleWithdraw = async (id: string) => {
    if (!window.confirm('Are you sure you want to withdraw your participation request?')) return;
    setActionError(null);
    try {
      if (isFaculty) {
        await collaborationApi.withdrawFacultyParticipation(id);
      } else {
        await collaborationApi.withdrawStudentParticipation(id);
      }
      refetch();
    } catch (err: any) {
      setActionError(err.message || 'Failed to withdraw participation');
    }
  };

  const items = data?.items || [];
  const approvedCount = items.filter((p) => p.status === 'APPROVED').length;
  const pendingCount = items.filter((p) => p.status === 'PENDING').length;
  const completedCount = items.filter((p) => p.status === 'COMPLETED').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Handshake className="w-7 h-7 text-brand-600" />
            {isFaculty ? 'My Faculty Participations' : 'My Collaboration Participations'}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Track and manage your applications for FDPs, Industrial Training, Live Projects, and Workshops.
          </p>
        </div>

        <Link
          to="/collaborations"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 text-white text-xs font-bold hover:bg-brand-700 transition-all shadow-md shadow-brand-500/20 self-start sm:self-auto"
        >
          Browse Marketplace
        </Link>
      </div>

      {actionError && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
            Total Requests
          </span>
          <span className="text-2xl font-black text-slate-900">{items.length}</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
            Under Review
          </span>
          <span className="text-2xl font-black text-amber-600">{pendingCount}</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
            Enrolled / Approved
          </span>
          <span className="text-2xl font-black text-emerald-600">{approvedCount}</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
            Completed
          </span>
          <span className="text-2xl font-black text-blue-600">{completedCount}</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {['', 'PENDING', 'APPROVED', 'COMPLETED', 'REJECTED', 'WITHDRAWN'].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              statusFilter === s
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {s === '' ? 'All Participations' : s.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Participations List */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-brand-600 mb-3" />
            <p className="text-sm font-medium">Loading your participations...</p>
          </div>
        ) : isError ? (
          <div className="p-8 text-center text-rose-600 text-xs">
            Failed to load participations: {(error as any)?.message}
          </div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center">
            <Handshake className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="font-bold text-slate-800 text-sm">No Participations Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
              You have not submitted participation requests matching this status.
            </p>
            <Link
              to="/collaborations"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 text-white text-xs font-bold hover:bg-brand-700"
            >
              Explore Collaborations
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {items.map((participation) => {
              const collab = participation.collaboration;
              const canWithdraw =
                participation.status === 'PENDING' || participation.status === 'APPROVED';

              return (
                <div
                  key={participation.id}
                  className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors"
                >
                  <div className="space-y-2 max-w-2xl">
                    <div className="flex flex-wrap items-center gap-2">
                      {collab?.collaborationType && (
                        <CollaborationTypeBadge type={collab.collaborationType} />
                      )}
                      <ParticipationStatusBadge status={participation.status} />
                    </div>

                    <Link
                      to={`/collaborations/my-participations/${participation.id}`}
                      className="block group"
                    >
                      <h3 className="font-bold text-slate-900 group-hover:text-brand-600 transition-colors text-base">
                        {collab?.title || 'Collaboration Engagement'}
                      </h3>
                    </Link>

                    <div className="flex items-center gap-1.5 text-xs text-slate-600">
                      <Building2 className="w-3.5 h-3.5 text-brand-600" />
                      <span className="font-medium">
                        {collab?.industryProfile?.companyName || 'Host Industry'}
                      </span>
                    </div>

                    {participation.rejectionReason && (
                      <p className="text-xs text-rose-700 bg-rose-50 p-2.5 rounded-xl border border-rose-100">
                        <strong>Reason:</strong> {participation.rejectionReason}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                      <span>
                        Requested: {new Date(participation.requestedAt).toLocaleDateString()}
                      </span>
                      {collab?.startDate && (
                        <span>
                          Start: {new Date(collab.startDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <Link
                      to={`/collaborations/my-participations/${participation.id}`}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      View Details
                    </Link>

                    {canWithdraw && (
                      <button
                        onClick={() => handleWithdraw(participation.id)}
                        className="inline-flex items-center gap-1 px-3 py-2 text-xs font-semibold rounded-xl text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        Withdraw
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

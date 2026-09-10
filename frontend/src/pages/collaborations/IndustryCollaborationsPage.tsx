import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Handshake,
  PlusCircle,
  Users,
  Edit,
  Trash2,
  Loader2,
  AlertCircle,
  Play,
  Square,
  Award,
} from 'lucide-react';
import { collaborationApi } from '../../lib/collaboration-api';
import { CollaborationTypeBadge } from '../../components/collaborations/CollaborationTypeBadge';
import { CollaborationStatusBadge } from '../../components/collaborations/CollaborationStatusBadge';
import { CollaborationStatus } from '../../types/collaboration';

export const IndustryCollaborationsPage: React.FC = () => {
  const [actionError, setActionError] = useState<string | null>(null);

  const { data: items, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['industry-my-collaborations'],
    queryFn: () => collaborationApi.getMyIndustryCollaborations(),
  });

  const handleStatusTransition = async (id: string, status: CollaborationStatus) => {
    setActionError(null);
    try {
      await collaborationApi.updateCollaborationStatus(id, status);
      refetch();
    } catch (err: any) {
      setActionError(err.message || `Failed to transition status to ${status}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this collaboration draft?')) return;
    setActionError(null);
    try {
      await collaborationApi.deleteCollaboration(id);
      refetch();
    } catch (err: any) {
      setActionError(err.message || 'Failed to delete collaboration');
    }
  };

  const totalCollaborations = items?.length || 0;
  const openCount = items?.filter((c) => c.status === 'OPEN').length || 0;
  const completedCount = items?.filter((c) => c.status === 'COMPLETED').length || 0;
  const totalParticipants = items?.reduce((sum, c) => sum + (c._count?.participations || 0), 0) || 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Handshake className="w-7 h-7 text-brand-600" />
            Collaboration Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage your industry–academia partnerships, sponsored programmes, workshops, projects, and training initiatives.
          </p>
        </div>

        <Link
          to="/industry/collaborations/create"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold transition-all shadow-md shadow-brand-500/20 self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          Create Engagement
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
            Total Engagements
          </span>
          <span className="text-2xl font-black text-slate-900">{totalCollaborations}</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
            Active / Open
          </span>
          <span className="text-2xl font-black text-emerald-600">{openCount}</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
            Completed
          </span>
          <span className="text-2xl font-black text-blue-600">{completedCount}</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
            Total Participants
          </span>
          <span className="text-2xl font-black text-brand-600">{totalParticipants}</span>
        </div>
      </div>

      {/* Collaborations Table / List */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-bold text-slate-900 text-sm">Your Industry Engagements</h2>
          <span className="text-xs text-slate-500">{items?.length || 0} total</span>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-brand-600 mb-3" />
            <p className="text-sm font-medium">Loading your collaborations...</p>
          </div>
        ) : isError ? (
          <div className="p-8 text-center text-rose-600 text-xs">
            Failed to load collaborations: {(error as any)?.message}
          </div>
        ) : !items || items.length === 0 ? (
          <div className="p-12 text-center">
            <Handshake className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="font-bold text-slate-800 text-sm">No Industry Collaborations Created Yet</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
              Start building academia–industry partnerships by creating workshops, sponsored programmes, live projects, or training initiatives.
            </p>
            <Link
              to="/industry/collaborations/create"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 text-white text-xs font-bold hover:bg-brand-700"
            >
              <PlusCircle className="w-4 h-4" />
              Create First Collaboration
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {items.map((collab) => (
              <div
                key={collab.id}
                className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors"
              >
                <div className="space-y-2 max-w-2xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <CollaborationTypeBadge type={collab.collaborationType} />
                    <CollaborationStatusBadge status={collab.status} />
                    <span className="text-xs text-slate-500 font-medium">
                      Audience: <strong>{collab.targetAudience}</strong>
                    </span>
                  </div>

                  <Link
                    to={`/collaborations/${collab.id}`}
                    className="block group"
                  >
                    <h3 className="font-bold text-slate-900 group-hover:text-brand-600 transition-colors text-base">
                      {collab.title}
                    </h3>
                  </Link>

                  <p className="text-xs text-slate-500 line-clamp-1">{collab.description}</p>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                    <span>
                      Created: {new Date(collab.createdAt).toLocaleDateString()}
                    </span>
                    {collab.deadline && (
                      <span>
                        Deadline: {new Date(collab.deadline).toLocaleDateString()}
                      </span>
                    )}
                    {collab.maxParticipants && (
                      <span>
                        Cap: {collab.maxParticipants} spots
                      </span>
                    )}
                  </div>
                </div>

                {/* Right Actions */}
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <Link
                    to={`/industry/collaborations/${collab.id}/participants`}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-brand-50 text-brand-700 hover:bg-brand-100 transition-colors"
                  >
                    <Users className="w-3.5 h-3.5" />
                    Participants ({collab._count?.participations || 0})
                  </Link>

                  {collab.status !== 'COMPLETED' && collab.status !== 'CANCELLED' && (
                    <Link
                      to={`/industry/collaborations/${collab.id}/edit`}
                      className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
                      title="Edit Details"
                    >
                      <Edit className="w-4 h-4" />
                    </Link>
                  )}

                  {/* Lifecycle Quick Actions */}
                  {collab.status === 'DRAFT' && (
                    <button
                      onClick={() => handleStatusTransition(collab.id, 'OPEN')}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                    >
                      <Play className="w-3.5 h-3.5" />
                      Publish (Open)
                    </button>
                  )}

                  {collab.status === 'OPEN' && (
                    <button
                      onClick={() => handleStatusTransition(collab.id, 'CLOSED')}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-xl bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200"
                    >
                      <Square className="w-3.5 h-3.5" />
                      Close Enrollment
                    </button>
                  )}

                  {collab.status === 'CLOSED' && (
                    <button
                      onClick={() => handleStatusTransition(collab.id, 'COMPLETED')}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200"
                    >
                      <Award className="w-3.5 h-3.5" />
                      Mark Completed
                    </button>
                  )}

                  {(collab.status === 'DRAFT' || collab.status === 'CANCELLED') && (
                    <button
                      onClick={() => handleDelete(collab.id)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                      title="Delete Draft"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

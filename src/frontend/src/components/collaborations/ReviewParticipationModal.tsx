import React, { useState } from 'react';
import { X, CheckCircle2, XCircle, AlertCircle, Award } from 'lucide-react';
import { CollaborationParticipation, ParticipationStatus } from '../../types/collaboration';
import { collaborationApi } from '../../lib/collaboration-api';

interface ReviewParticipationModalProps {
  collaborationId: string;
  participation: CollaborationParticipation;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ReviewParticipationModal: React.FC<ReviewParticipationModalProps> = ({
  collaborationId,
  participation,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [targetStatus, setTargetStatus] = useState<ParticipationStatus>(
    participation.status === 'PENDING' ? 'APPROVED' : 'COMPLETED',
  );
  const [industryNotes, setIndustryNotes] = useState(participation.industryNotes || '');
  const [rejectionReason, setRejectionReason] = useState('');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const participantName =
    participation.facultyProfile?.fullName ||
    participation.studentProfile?.fullName ||
    'Participant';

  const participantRole = participation.facultyProfile ? 'Faculty' : 'Student';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await collaborationApi.updateParticipationStatus(
        collaborationId,
        participation.id,
        {
          status: targetStatus,
          industryNotes: industryNotes || undefined,
          rejectionReason: targetStatus === 'REJECTED' ? rejectionReason : undefined,
          notes: notes || undefined,
        },
      );

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update participation status');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div>
            <h3 className="font-bold text-slate-900 text-base">
              Review Participation Request
            </h3>
            <p className="text-xs text-slate-500">
              {participantName} ({participantRole})
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Target Action / Status Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Decision / Next Status
            </label>
            <div className="grid grid-cols-3 gap-2">
              {participation.status === 'PENDING' && (
                <>
                  <button
                    type="button"
                    onClick={() => setTargetStatus('APPROVED')}
                    className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
                      targetStatus === 'APPROVED'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-700 ring-2 ring-emerald-500/20'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => setTargetStatus('REJECTED')}
                    className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
                      targetStatus === 'REJECTED'
                        ? 'border-rose-600 bg-rose-50 text-rose-700 ring-2 ring-rose-500/20'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <XCircle className="w-4 h-4 text-rose-600" />
                    Reject
                  </button>
                </>
              )}

              {participation.status === 'APPROVED' && (
                <>
                  <button
                    type="button"
                    onClick={() => setTargetStatus('COMPLETED')}
                    className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
                      targetStatus === 'COMPLETED'
                        ? 'border-blue-600 bg-blue-50 text-blue-700 ring-2 ring-blue-500/20'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <Award className="w-4 h-4 text-blue-600" />
                    Mark Completed
                  </button>
                  <button
                    type="button"
                    onClick={() => setTargetStatus('CANCELLED')}
                    className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
                      targetStatus === 'CANCELLED'
                        ? 'border-red-600 bg-red-50 text-red-700 ring-2 ring-red-500/20'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <XCircle className="w-4 h-4 text-red-600" />
                    Cancel Enrollment
                  </button>
                </>
              )}
            </div>
          </div>

          {targetStatus === 'REJECTED' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Rejection Reason (Visible to candidate)
              </label>
              <textarea
                rows={2}
                required
                placeholder="Explain why the candidate was not selected (e.g. prerequisite mismatch)..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 placeholder:text-slate-400"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Internal Industry Notes (Private - Never shared with candidate)
            </label>
            <textarea
              rows={3}
              placeholder="Private coordinator notes regarding participant performance, project allocation, or qualifications..."
              value={industryNotes}
              onChange={(e) => setIndustryNotes(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 placeholder:text-slate-400"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Audit Notes / Remarks (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Approved after verifying department credentials"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 placeholder:text-slate-400"
            />
          </div>

          {/* Modal Footer */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-xl transition-colors shadow-sm disabled:opacity-50"
            >
              {isLoading ? 'Saving...' : 'Confirm Decision'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

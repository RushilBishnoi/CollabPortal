import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  X,
  CheckCircle2,
  XCircle,
  Clock,
  Award,
  AlertTriangle,
} from 'lucide-react';
import { applicationApi } from '../../lib/application-api';
import { ApplicationStatus } from '../../types/applications';

interface StatusTransitionModalProps {
  applicationId: string;
  candidateName: string;
  targetStatus: ApplicationStatus;
  isOpen: boolean;
  onClose: () => void;
}

export const StatusTransitionModal: React.FC<StatusTransitionModalProps> = ({
  applicationId,
  candidateName,
  targetStatus,
  isOpen,
  onClose,
}) => {
  const queryClient = useQueryClient();

  const [recruiterNotes, setRecruiterNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const isRejecting = targetStatus === 'REJECTED';
  const isSelecting = targetStatus === 'SELECTED';
  const isShortlisting = targetStatus === 'SHORTLISTED';

  const titleText = isRejecting
    ? 'Reject Candidate Application'
    : isSelecting
    ? 'Confirm Candidate Selection (Placement Outcome)'
    : isShortlisting
    ? 'Shortlist Candidate'
    : 'Move to Review Stage';

  const buttonColor = isRejecting
    ? 'bg-red-600 hover:bg-red-700'
    : isSelecting
    ? 'bg-emerald-600 hover:bg-emerald-700'
    : 'bg-blue-600 hover:bg-blue-700';

  const updateMutation = useMutation({
    mutationFn: () =>
      applicationApi.updateApplicationStatus(applicationId, {
        status: targetStatus,
        recruiterNotes: recruiterNotes.trim() || undefined,
        rejectionReason: isRejecting ? rejectionReason.trim() || undefined : undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recruiter-candidate-review', applicationId] });
      queryClient.invalidateQueries({ queryKey: ['recruiter-opportunity-applications'] });
      onClose();
    },
    onError: (err: any) => {
      setErrorMsg(err.message || 'Failed to update recruitment stage.');
    },
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 mb-1.5">
              {isSelecting && <Award className="w-3.5 h-3.5 text-emerald-600" />}
              {isRejecting && <XCircle className="w-3.5 h-3.5 text-red-600" />}
              {isShortlisting && <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />}
              {!isSelecting && !isRejecting && !isShortlisting && <Clock className="w-3.5 h-3.5 text-slate-600" />}
              <span>Status Transition: {targetStatus.replace('_', ' ')}</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900">{titleText}</h2>
            <p className="text-xs text-slate-500 mt-0.5">Candidate: {candidateName}</p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-2.5 text-xs text-red-800">
            <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            setErrorMsg(null);
            updateMutation.mutate();
          }}
          className="space-y-4 text-xs"
        >
          {isSelecting && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-900">
              <p className="font-bold">Placement Selection Confirmation</p>
              <p className="text-[11px] text-emerald-700 mt-0.5">
                Marking this candidate as SELECTED records the official placement outcome and concludes recruitment.
              </p>
            </div>
          )}

          {isRejecting && (
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700">Rejection Feedback / Reason</label>
              <input
                type="text"
                placeholder="e.g. Strong profile, but selected candidate with more backend project experience."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white"
              />
            </div>
          )}

          <div className="space-y-1.5">
            <label className="font-bold text-slate-700">Internal Recruiter Notes (Private)</label>
            <textarea
              rows={3}
              placeholder="Private observations for your hiring team (never shared with candidate)..."
              value={recruiterNotes}
              onChange={(e) => setRecruiterNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
            />
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 font-semibold text-slate-600 hover:text-slate-900 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className={`px-5 py-2.5 text-white font-bold rounded-xl shadow-sm transition-colors disabled:opacity-50 ${buttonColor}`}
            >
              {updateMutation.isPending ? 'Updating...' : `Confirm: ${targetStatus.replace('_', ' ')}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { X, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { PlacementOffer } from '../../types/placement';

interface AcceptDeclineOfferModalProps {
  isOpen: boolean;
  onClose: () => void;
  offer: PlacementOffer;
  mode: 'accept' | 'decline';
  onConfirmAccept: (offerId: string, notes?: string) => Promise<void>;
  onConfirmDecline: (offerId: string, reason: string, notes?: string) => Promise<void>;
}

export const AcceptDeclineOfferModal: React.FC<AcceptDeclineOfferModalProps> = ({
  isOpen,
  onClose,
  offer,
  mode,
  onConfirmAccept,
  onConfirmDecline,
}) => {
  const [notes, setNotes] = useState('');
  const [declineReason, setDeclineReason] = useState('Accepted another offer');
  const [customDeclineReason, setCustomDeclineReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const isAccept = mode === 'accept';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (isAccept) {
        await onConfirmAccept(offer.id, notes || undefined);
      } else {
        const finalReason =
          declineReason === 'Other' ? customDeclineReason : declineReason;
        if (!finalReason.trim()) {
          throw new Error('Please specify your reason for declining this offer.');
        }
        await onConfirmDecline(offer.id, finalReason, notes || undefined);
      }
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Action failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 md:p-8 shadow-2xl border border-slate-100 relative">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
              isAccept
                ? 'bg-emerald-50 text-emerald-600'
                : 'bg-rose-50 text-rose-600'
            }`}
          >
            {isAccept ? (
              <CheckCircle2 className="w-6 h-6" />
            ) : (
              <XCircle className="w-6 h-6" />
            )}
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {isAccept ? 'Accept Placement Offer' : 'Decline Placement Offer'}
            </h2>
            <p className="text-xs text-slate-500">
              {offer.industryProfile?.companyName} • {offer.title}
            </p>
          </div>
        </div>

        {isAccept ? (
          <div className="mb-4 p-3.5 bg-emerald-50 rounded-2xl border border-emerald-100 text-xs text-emerald-800 space-y-1">
            <p className="font-bold">
              Congratulations! Accepting this offer will:
            </p>
            <ul className="list-disc pl-4 space-y-0.5 text-emerald-700">
              <li>Record your formal acceptance with {offer.industryProfile?.companyName}.</li>
              <li>Generate your official academic Placement Record for TPO verification.</li>
              <li>Initiate the institutional NOC & onboarding workflow.</li>
            </ul>
          </div>
        ) : (
          <div className="mb-4 p-3.5 bg-amber-50 rounded-2xl border border-amber-100 text-xs text-amber-800 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p>
              Declining an offer is a terminal action and cannot be undone. Your decision will be formally notified to the corporate recruiter.
            </p>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isAccept && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Reason for Declining *
              </label>
              <select
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-rose-500 focus:outline-none bg-white mb-2"
              >
                <option value="Accepted another offer">Accepted another offer</option>
                <option value="Higher studies / Research">Pursuing Higher Studies / Research</option>
                <option value="Compensation / CTC expectations">Compensation / Package mismatch</option>
                <option value="Location / Remote preference">Location constraints</option>
                <option value="Personal reasons">Personal reasons</option>
                <option value="Other">Other reason</option>
              </select>

              {declineReason === 'Other' && (
                <input
                  type="text"
                  required
                  placeholder="Please specify reason"
                  value={customDeclineReason}
                  onChange={(e) => setCustomDeclineReason(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              )}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {isAccept ? 'Notes / Message to Recruiter (Optional)' : 'Additional Feedback (Optional)'}
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={
                isAccept
                  ? 'e.g. Thank you for this wonderful opportunity! I look forward to joining on the scheduled date.'
                  : 'Brief message to recruiter...'
              }
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-brand-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-5 py-2.5 rounded-xl text-white text-xs font-bold shadow-sm transition-colors disabled:opacity-50 ${
                isAccept
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-rose-600 hover:bg-rose-700'
              }`}
            >
              {isSubmitting
                ? 'Processing...'
                : isAccept
                ? 'Confirm Acceptance'
                : 'Confirm Decline'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

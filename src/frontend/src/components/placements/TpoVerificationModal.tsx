import React, { useState } from 'react';
import { X, ShieldCheck, FileCheck } from 'lucide-react';
import { Placement } from '../../types/placement';

interface TpoVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  placement: Placement;
  onConfirmVerify: (
    placementId: string,
    payload: {
      nocIssued?: boolean;
      nocReferenceNumber?: string;
      verificationNotes?: string;
    },
  ) => Promise<void>;
}

export const TpoVerificationModal: React.FC<TpoVerificationModalProps> = ({
  isOpen,
  onClose,
  placement,
  onConfirmVerify,
}) => {
  const [nocIssued, setNocIssued] = useState(true);
  const [nocReferenceNumber, setNocReferenceNumber] = useState(
    `NOC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
  );
  const [verificationNotes, setVerificationNotes] = useState(
    'Academic eligibility & credits verified. Placement approved by Institution TPO.',
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await onConfirmVerify(placement.id, {
        nocIssued,
        nocReferenceNumber: nocIssued ? nocReferenceNumber : undefined,
        verificationNotes,
      });
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Verification failed');
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

        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Verify Student Placement
            </h2>
            <p className="text-xs text-slate-500">
              {placement.studentProfile?.fullName} • {placement.companyNameSnapshot}
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Candidate:</span>
              <span className="font-bold text-slate-900">
                {placement.studentProfile?.fullName}
              </span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Company:</span>
              <span className="font-bold text-slate-900">
                {placement.companyNameSnapshot}
              </span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Package (Annual CTC):</span>
              <span className="font-bold text-emerald-700">
                {placement.annualCtcSnapshot
                  ? `₹${(placement.annualCtcSnapshot / 100000).toFixed(1)} LPA`
                  : 'Undisclosed'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 p-3 bg-brand-50/50 rounded-xl border border-brand-100">
            <input
              type="checkbox"
              id="nocCheckbox"
              checked={nocIssued}
              onChange={(e) => setNocIssued(e.target.checked)}
              className="rounded text-brand-600 focus:ring-brand-500 h-4 w-4"
            />
            <label
              htmlFor="nocCheckbox"
              className="text-xs font-bold text-brand-900 cursor-pointer flex items-center gap-1.5"
            >
              <FileCheck className="w-3.5 h-3.5 text-brand-600" />
              Issue Institutional No-Objection Certificate (NOC)
            </label>
          </div>

          {nocIssued && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                NOC Reference Number *
              </label>
              <input
                type="text"
                required
                value={nocReferenceNumber}
                onChange={(e) => setNocReferenceNumber(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Verification Remarks / TPO Notes
            </label>
            <textarea
              rows={3}
              value={verificationNotes}
              onChange={(e) => setVerificationNotes(e.target.value)}
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
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Verifying...' : 'Approve & Verify Placement'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

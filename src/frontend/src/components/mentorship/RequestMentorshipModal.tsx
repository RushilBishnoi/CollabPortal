import React, { useState } from 'react';
import { X, Send, Sparkles } from 'lucide-react';
import { MentorProfile } from '../../types/mentorship';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  mentor: MentorProfile;
  onSubmit: (payload: {
    statementOfPurpose: string;
    targetCareerRoleId?: string;
    expectedDurationWeeks?: number;
  }) => Promise<void>;
}

export const RequestMentorshipModal: React.FC<Props> = ({
  isOpen,
  onClose,
  mentor,
  onSubmit,
}) => {
  const [statementOfPurpose, setStatementOfPurpose] = useState('');
  const [targetCareerRoleId, setTargetCareerRoleId] = useState('');
  const [expectedDurationWeeks, setExpectedDurationWeeks] = useState(8);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!statementOfPurpose.trim() || statementOfPurpose.trim().length < 20) {
      setError('Please provide a meaningful statement of purpose (at least 20 characters).');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onSubmit({
        statementOfPurpose,
        targetCareerRoleId: targetCareerRoleId || undefined,
        expectedDurationWeeks,
      });
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Failed to submit mentorship request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Request Mentorship</h2>
            <p className="text-xs text-slate-500">
              Applying for direct guidance from <span className="font-semibold text-slate-800">{mentor.headline}</span>
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Statement of Purpose & Learning Goals <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={4}
              value={statementOfPurpose}
              onChange={(e) => setStatementOfPurpose(e.target.value)}
              placeholder="Introduce yourself, your technical background, current roadblocks, and what specific guidance you are seeking from this mentor..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-500"
              required
            />
          </div>

          {mentor.careerRoles && mentor.careerRoles.length > 0 && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Target Career Role Alignment (Optional)
              </label>
              <select
                value={targetCareerRoleId}
                onChange={(e) => setTargetCareerRoleId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
              >
                <option value="">-- General Mentorship / No Specific Role --</option>
                {mentor.careerRoles.map((r) => (
                  <option key={r.id} value={r.careerRoleId}>
                    {r.careerRole?.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Expected Mentorship Duration
            </label>
            <select
              value={expectedDurationWeeks}
              onChange={(e) => setExpectedDurationWeeks(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
            >
              <option value={4}>4 Weeks (Short Term Sprint)</option>
              <option value={8}>8 Weeks (Standard Program)</option>
              <option value={12}>12 Weeks (Comprehensive Career Guidance)</option>
              <option value={16}>16 Weeks (Semester-Long Mentorship)</option>
            </select>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold transition-colors shadow-sm disabled:opacity-50 inline-flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Sending Request...' : 'Send Mentorship Request'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

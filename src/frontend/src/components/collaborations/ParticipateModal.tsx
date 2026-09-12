import React, { useState } from 'react';
import { X, Send, AlertCircle } from 'lucide-react';
import { Collaboration } from '../../types/collaboration';
import { useAuth } from '../../context/AuthContext';
import { collaborationApi } from '../../lib/collaboration-api';

interface ParticipateModalProps {
  collaboration: Collaboration;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ParticipateModal: React.FC<ParticipateModalProps> = ({
  collaboration,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { user } = useAuth();
  const [motivation, setMotivation] = useState('');
  const [relevantExperience, setRelevantExperience] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (user?.role === 'FACULTY') {
        await collaborationApi.requestFacultyParticipation(collaboration.id, {
          motivation,
          relevantExperience,
        });
      } else if (user?.role === 'STUDENT') {
        await collaborationApi.requestStudentParticipation(collaboration.id, {
          motivation,
          relevantExperience,
        });
      } else {
        throw new Error('Only faculty and students may apply for collaboration engagements.');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to submit participation request');
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
            <h3 className="font-bold text-slate-900 text-base">Request Participation</h3>
            <p className="text-xs text-slate-500 truncate max-w-sm">{collaboration.title}</p>
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

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Statement of Motivation / Participation Goals
            </label>
            <textarea
              rows={3}
              required
              placeholder="Why are you interested in this engagement? What do you hope to learn or contribute?"
              value={motivation}
              onChange={(e) => setMotivation(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 placeholder:text-slate-400"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Relevant Background / Experience (Optional)
            </label>
            <textarea
              rows={3}
              placeholder="Summarize relevant coursework, projects, research, or technical background..."
              value={relevantExperience}
              onChange={(e) => setRelevantExperience(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 placeholder:text-slate-400"
            />
          </div>

          <div className="text-[11px] text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-100">
            By submitting, your profile details (department, degree/designation, and background) will be shared with{' '}
            <strong className="text-slate-700">{collaboration.industryProfile?.companyName || 'the host industry partner'}</strong>.
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
              className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-xl transition-colors shadow-sm disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              {isLoading ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { X, FileText, Lock, Globe } from 'lucide-react';
import { MentorshipSession } from '../../types/mentorship';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  session: MentorshipSession;
  userRole: string;
  onSave: (payload: {
    mentorNotes?: string;
    studentNotes?: string;
    sharedSummary?: string;
  }) => Promise<void>;
}

export const SessionNotesModal: React.FC<Props> = ({
  isOpen,
  onClose,
  session,
  userRole,
  onSave,
}) => {
  const isMentor = userRole === 'INDUSTRY' || userRole === 'FACULTY';
  const isStudent = userRole === 'STUDENT';

  const [mentorNotes, setMentorNotes] = useState(session.mentorNotes || '');
  const [studentNotes, setStudentNotes] = useState(session.studentNotes || '');
  const [sharedSummary, setSharedSummary] = useState(session.sharedSummary || '');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      setError(null);
      await onSave({
        mentorNotes: isMentor ? mentorNotes : undefined,
        studentNotes: isStudent ? studentNotes : undefined,
        sharedSummary: sharedSummary || undefined,
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to save session notes.');
    } finally {
      setIsSaving(false);
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
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Session Notes & Summary</h2>
            <p className="text-xs text-slate-500 line-clamp-1">{session.title}</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Shared Summary */}
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 mb-1">
              <Globe className="w-3.5 h-3.5 text-blue-500" />
              <span>Shared Meeting Summary (Visible to both Mentor & Student)</span>
            </div>
            <textarea
              rows={3}
              value={sharedSummary}
              onChange={(e) => setSharedSummary(e.target.value)}
              placeholder="Action items, key topics covered, homework or links discussed during the session..."
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {/* Private Notes */}
          {isMentor && (
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-purple-900 mb-1">
                <Lock className="w-3.5 h-3.5 text-purple-600" />
                <span>Private Mentor Notes (Private to you)</span>
              </div>
              <textarea
                rows={3}
                value={mentorNotes}
                onChange={(e) => setMentorNotes(e.target.value)}
                placeholder="Private assessment notes on student strengths, areas for technical improvement, candidate potential..."
                className="w-full px-3.5 py-2 rounded-xl border border-purple-200 bg-purple-50/40 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          )}

          {isStudent && (
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-blue-900 mb-1">
                <Lock className="w-3.5 h-3.5 text-blue-600" />
                <span>Private Student Notes (Private to you)</span>
              </div>
              <textarea
                rows={3}
                value={studentNotes}
                onChange={(e) => setStudentNotes(e.target.value)}
                placeholder="Personal reflections, questions to follow up on next call, key takeaways..."
                className="w-full px-3.5 py-2 rounded-xl border border-blue-200 bg-blue-50/40 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

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
              disabled={isSaving}
              className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold transition-colors shadow-sm disabled:opacity-50"
            >
              {isSaving ? 'Saving Notes...' : 'Save Notes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { Star, X, MessageSquare, Lock, Users, AlertCircle, CheckCircle } from 'lucide-react';
import { MentorshipSession } from '../../types/mentorship';
import { mentorshipApi } from '../../lib/mentorship-api';

interface Props {
  session: MentorshipSession;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedSession: MentorshipSession) => void;
}

export const FeedbackRatingModal: React.FC<Props> = ({
  session,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [rating, setRating] = useState<number>(session.studentRating || 5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [feedback, setFeedback] = useState<string>(session.studentFeedback || '');
  const [studentNotes, setStudentNotes] = useState<string>(session.studentNotes || '');
  const [sharedSummary, setSharedSummary] = useState<string>(session.sharedSummary || '');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating < 1 || rating > 5) {
      setError('Please select a star rating from 1 to 5.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const updatedSession = await mentorshipApi.submitSessionFeedback(session.id, {
        studentRating: rating,
        studentFeedback: feedback.trim() || undefined,
        studentNotes: studentNotes.trim() || undefined,
        sharedSummary: sharedSummary.trim() || undefined,
      });

      if (updatedSession) {
        onSuccess(updatedSession);
        onClose();
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message || 'Failed to submit feedback. Please try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 relative animate-in fade-in zoom-in duration-200">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-5">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 mb-3">
            <Star className="w-6 h-6 fill-amber-500" />
          </div>
          <h2 className="text-xl font-black text-slate-900">Session Feedback & Rating</h2>
          <p className="text-xs text-slate-500 mt-1">
            Share your thoughts on the session with{' '}
            <span className="font-bold text-slate-700">
              {session.mentorProfile?.headline || 'your mentor'}
            </span>
            .
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Star Rating */}
          <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-100 flex flex-col items-center justify-center gap-2">
            <label className="font-bold text-slate-700 text-xs">
              Overall Experience (1 - 5 Stars)
            </label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1 transition-transform hover:scale-110 focus:outline-none"
                >
                  <Star
                    className={`w-7 h-7 transition-colors ${
                      (hoverRating || rating) >= star
                        ? 'text-amber-500 fill-amber-500'
                        : 'text-slate-300'
                    }`}
                  />
                </button>
              ))}
            </div>
            <span className="text-[11px] font-semibold text-amber-800">
              {rating === 5
                ? '⭐⭐⭐⭐⭐ Exceptional Guidance'
                : rating === 4
                ? '⭐⭐⭐⭐ Very Good'
                : rating === 3
                ? '⭐⭐⭐ Good / Satisfactory'
                : rating === 2
                ? '⭐⭐ Needs Improvement'
                : '⭐ Poor Experience'}
            </span>
          </div>

          {/* Student Feedback (Public to Mentor) */}
          <div>
            <label className="block font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-brand-600" />
              <span>Feedback for Mentor</span>
            </label>
            <textarea
              rows={3}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="What went well? How did the mentor help your understanding?"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-xs"
            />
          </div>

          {/* Shared Action Items / Summary */}
          <div>
            <label className="block font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-blue-600" />
              <span>Shared Session Summary / Key Takeaways</span>
            </label>
            <textarea
              rows={2}
              value={sharedSummary}
              onChange={(e) => setSharedSummary(e.target.value)}
              placeholder="Key action items or topics discussed (visible to both student & mentor)..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
            />
          </div>

          {/* Private Student Notes */}
          <div>
            <label className="block font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-indigo-600" />
              <span>Private Student Notes (Only you can see this)</span>
            </label>
            <textarea
              rows={2}
              value={studentNotes}
              onChange={(e) => setStudentNotes(e.target.value)}
              placeholder="Private notes, reminders, or learning goals..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-bold transition-all shadow-md inline-flex items-center gap-2"
            >
              {isSubmitting ? (
                <span>Submitting...</span>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>Submit & Complete</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

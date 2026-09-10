import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Calendar,
  Video,
  ArrowLeft,
  Lock,
  Users,
  Star,
  FileText,
  ExternalLink,
} from 'lucide-react';
import { mentorshipApi } from '../../lib/mentorship-api';
import { MentorshipSession } from '../../types/mentorship';
import { useAuth } from '../../context/AuthContext';
import { MentorshipStatusBadge } from '../../components/mentorship/MentorshipStatusBadge';
import { SessionNotesModal } from '../../components/mentorship/SessionNotesModal';
import { FeedbackRatingModal } from '../../components/mentorship/FeedbackRatingModal';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

export const MentorshipSessionDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);

  const { data: sessionData, isLoading, error, refetch } = useQuery({
    queryKey: ['mentorship-session-detail', id],
    queryFn: () => mentorshipApi.getSessionById(id!),
    enabled: !!id,
  });

  const session: MentorshipSession | undefined = sessionData;

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-800">Session Not Found</h2>
        <p className="text-xs text-slate-500">
          The requested session does not exist or you do not have permission to view it.
        </p>
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 text-white text-xs font-bold"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
      </div>
    );
  }

  const isStudent = user?.role === 'STUDENT';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Back link */}
      <Link
        to={isStudent ? '/portal/student/mentorship' : '/portal/mentor/workspace'}
        className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-brand-600 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Mentorship Workspace
      </Link>

      {/* Main Session Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-black text-slate-900">{session.title}</h1>
              <MentorshipStatusBadge status={session.status} />
            </div>
            {session.description && (
              <p className="text-xs text-slate-500 mt-1">{session.description}</p>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setIsNotesModalOpen(true)}
              className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors inline-flex items-center gap-1.5"
            >
              <FileText className="w-4 h-4 text-slate-500" />
              <span>Edit Notes</span>
            </button>

            {isStudent && session.status === 'COMPLETED' && !session.studentRating && (
              <button
                onClick={() => setIsRatingModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-bold transition-colors inline-flex items-center gap-1.5"
              >
                <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                <span>Rate Session</span>
              </button>
            )}
          </div>
        </div>

        {/* Schedule & Meeting Details */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-slate-100 text-xs">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-slate-400 font-bold block flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-brand-600" /> Date & Time
            </span>
            <p className="font-bold text-slate-900">
              {new Date(session.scheduledAt).toLocaleDateString(undefined, {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </p>
            <p className="text-slate-500 font-mono text-[11px]">
              {new Date(session.scheduledAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}{' '}
              ({session.durationMinutes} min)
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-slate-400 font-bold block flex items-center gap-1">
              <Video className="w-3.5 h-3.5 text-blue-600" /> Meeting Platform
            </span>
            <p className="font-bold text-slate-900">{session.meetingPlatform}</p>
            {session.meetingLink ? (
              <a
                href={session.meetingLink}
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 hover:underline inline-flex items-center gap-1 font-bold text-[11px]"
              >
                Join Meeting Link <ExternalLink className="w-3 h-3" />
              </a>
            ) : (
              <p className="text-slate-400 italic text-[11px]">No link configured</p>
            )}
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
            <span className="text-slate-400 font-bold block flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-purple-600" /> Participants
            </span>
            <p className="text-slate-700">
              Mentor: <strong className="text-slate-900">{session.mentorProfile?.headline}</strong>
            </p>
            <p className="text-slate-700">
              Student: <strong className="text-slate-900">{session.studentProfile?.fullName}</strong>
            </p>
          </div>
        </div>

        {/* Rating & Feedback if Completed */}
        {session.studentRating && (
          <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-amber-900 flex items-center gap-1">
                <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                Student Rating: {session.studentRating} / 5 Stars
              </span>
            </div>
            {session.studentFeedback && (
              <p className="text-amber-800 italic">"{session.studentFeedback}"</p>
            )}
          </div>
        )}

        {/* Shared Summary & Notes */}
        <div className="space-y-4 pt-6 border-t border-slate-100">
          <h3 className="text-sm font-extrabold text-slate-900">Session Documentation & Notes</h3>

          {/* Shared Takeaways */}
          <div className="p-4 rounded-2xl bg-blue-50/40 border border-blue-100 space-y-1.5 text-xs">
            <span className="font-bold text-blue-900 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-blue-600" />
              Shared Summary & Action Items (Visible to both Mentor and Student)
            </span>
            <p className="text-slate-700 leading-relaxed whitespace-pre-line">
              {session.sharedSummary || 'No shared summary documented yet.'}
            </p>
          </div>

          {/* Private Notes (masked by backend) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {session.mentorNotes !== undefined && session.mentorNotes !== null && (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5">
                <span className="font-bold text-slate-700 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-slate-500" />
                  Private Mentor Notes
                </span>
                <p className="text-slate-600 leading-relaxed whitespace-pre-line">
                  {session.mentorNotes || 'No private mentor notes.'}
                </p>
              </div>
            )}

            {session.studentNotes !== undefined && session.studentNotes !== null && (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5">
                <span className="font-bold text-slate-700 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-slate-500" />
                  Private Student Notes
                </span>
                <p className="text-slate-600 leading-relaxed whitespace-pre-line">
                  {session.studentNotes || 'No private student notes.'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {isNotesModalOpen && (
        <SessionNotesModal
          session={session}
          userRole={user?.role || 'STUDENT'}
          isOpen={isNotesModalOpen}
          onClose={() => setIsNotesModalOpen(false)}
          onSave={async (payload) => {
            await mentorshipApi.submitSessionFeedback(session.id, payload);
            setIsNotesModalOpen(false);
            refetch();
          }}
        />
      )}

      {isRatingModalOpen && (
        <FeedbackRatingModal
          session={session}
          isOpen={isRatingModalOpen}
          onClose={() => setIsRatingModalOpen(false)}
          onSuccess={() => {
            setIsRatingModalOpen(false);
            refetch();
          }}
        />
      )}
    </div>
  );
};

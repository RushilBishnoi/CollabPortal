import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Users,
  Calendar,
  Clock,
  Video,
  Plus,
  Star,
  ArrowRight,
  ExternalLink,
  FileText,
} from 'lucide-react';
import { mentorshipApi } from '../../lib/mentorship-api';
import {
  Mentorship,
  MentorshipRequest,
  MentorshipSession,
  MentorshipGoalStatus,
} from '../../types/mentorship';
import { MentorshipStatusBadge } from '../../components/mentorship/MentorshipStatusBadge';
import { GoalTrackerCard } from '../../components/mentorship/GoalTrackerCard';
import { BookSessionModal } from '../../components/mentorship/BookSessionModal';
import { SessionNotesModal } from '../../components/mentorship/SessionNotesModal';
import { FeedbackRatingModal } from '../../components/mentorship/FeedbackRatingModal';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

export const StudentMentorshipPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'mentorships' | 'sessions' | 'requests'>(
    'mentorships',
  );

  // Modals state
  const [bookingForMentor, setBookingForMentor] = useState<any>(null);
  const [activeMentorshipIdForBooking, setActiveMentorshipIdForBooking] = useState<string | null>(
    null,
  );
  const [selectedSessionForNotes, setSelectedSessionForNotes] = useState<MentorshipSession | null>(
    null,
  );
  const [selectedSessionForRating, setSelectedSessionForRating] = useState<MentorshipSession | null>(
    null,
  );

  // Queries
  const {
    data: mentorshipsData,
    isLoading: isLoadingMentorships,
    refetch: refetchMentorships,
  } = useQuery({
    queryKey: ['student-mentorships'],
    queryFn: () => mentorshipApi.getStudentMentorships(),
  });

  const {
    data: requestsData,
    isLoading: isLoadingRequests,
    refetch: refetchRequests,
  } = useQuery({
    queryKey: ['student-requests'],
    queryFn: () => mentorshipApi.getStudentRequests(),
  });

  const {
    data: sessionsData,
    isLoading: isLoadingSessions,
    refetch: refetchSessions,
  } = useQuery({
    queryKey: ['student-sessions'],
    queryFn: () => mentorshipApi.getStudentSessions(),
  });

  const mentorships: Mentorship[] = mentorshipsData || [];
  const requests: MentorshipRequest[] = requestsData || [];
  const sessions: MentorshipSession[] = sessionsData?.items || [];

  const handleWithdrawRequest = async (requestId: string) => {
    if (!window.confirm('Are you sure you want to withdraw this mentorship request?')) return;
    try {
      await mentorshipApi.withdrawRequest(requestId);
      refetchRequests();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to withdraw request.');
    }
  };

  const handleCancelSession = async (sessionId: string) => {
    const reason = window.prompt('Please provide a reason for cancelling this session:');
    if (!reason) return;

    try {
      await mentorshipApi.updateSession(sessionId, {
        status: 'CANCELLED',
        cancellationReason: reason,
      });
      refetchSessions();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to cancel session.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Student Mentorship Hub
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage your active mentor relationships, track targeted milestones, and book 1-on-1 sessions.
          </p>
        </div>

        <Link
          to="/mentorship/mentors"
          className="px-5 py-2.5 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold transition-all shadow-sm inline-flex items-center gap-2 self-start"
        >
          <Plus className="w-4 h-4" />
          <span>Find & Request New Mentors</span>
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-1 text-xs">
        <button
          onClick={() => setActiveTab('mentorships')}
          className={`px-4 py-2 rounded-2xl font-bold transition-colors ${
            activeTab === 'mentorships'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Active Mentorships ({mentorships.filter((m) => m.status === 'ACTIVE').length})
        </button>

        <button
          onClick={() => setActiveTab('sessions')}
          className={`px-4 py-2 rounded-2xl font-bold transition-colors ${
            activeTab === 'sessions'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          My Sessions ({sessions.length})
        </button>

        <button
          onClick={() => setActiveTab('requests')}
          className={`px-4 py-2 rounded-2xl font-bold transition-colors ${
            activeTab === 'requests'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Requests ({requests.length})
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'mentorships' && (
        <div className="space-y-6">
          {isLoadingMentorships ? (
            <div className="py-20 flex justify-center">
              <LoadingSpinner />
            </div>
          ) : mentorships.length === 0 ? (
            <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-12 text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-brand-50 flex items-center justify-center text-brand-600 mx-auto">
                <Users className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-slate-800">No active mentorships yet</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Browse our directory of qualified industry practitioners and faculty experts to request mentorship.
              </p>
              <Link
                to="/mentorship/mentors"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 text-white text-xs font-bold mt-2"
              >
                Browse Mentors <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {mentorships.map((m) => (
                <div
                  key={m.id}
                  className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-6"
                >
                  {/* Mentorship Header */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-brand-50 border border-brand-100 flex items-center justify-center font-bold text-brand-700 text-xl overflow-hidden shrink-0">
                        {m.mentorProfile?.user?.avatarUrl ? (
                          <img
                            src={m.mentorProfile.user.avatarUrl}
                            alt="Mentor"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          m.mentorProfile?.designation.charAt(0) || 'M'
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2.5">
                          <h3 className="text-base font-extrabold text-slate-900">
                            {m.mentorProfile?.headline}
                          </h3>
                          <MentorshipStatusBadge status={m.status} />
                        </div>
                        <p className="text-xs text-slate-500 font-semibold mt-0.5">
                          {m.mentorProfile?.designation} • {m.mentorProfile?.companyOrInstitution}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => {
                          setBookingForMentor(m.mentorProfile);
                          setActiveMentorshipIdForBooking(m.id);
                        }}
                        className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors inline-flex items-center gap-1.5"
                      >
                        <Video className="w-3.5 h-3.5" /> Book Session
                      </button>
                    </div>
                  </div>

                  {/* Goal Tracking Section */}
                  <div className="pt-6 border-t border-slate-100 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-slate-900">Mentorship Goals & Milestones</h4>
                      <span className="text-xs font-semibold text-slate-500">
                        {m.goals?.filter((g) => g.status === 'ACHIEVED').length || 0} of {m.goals?.length || 0} achieved
                      </span>
                    </div>

                    {m.goals && m.goals.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {m.goals.map((goal) => (
                          <GoalTrackerCard
                            key={goal.id}
                            goal={goal}
                            canEdit={true}
                            onStatusChange={async (goalId: string, status: MentorshipGoalStatus) => {
                              await mentorshipApi.updateGoal(goalId, { status });
                              refetchMentorships();
                            }}
                            onDelete={async (goalId: string) => {
                              await mentorshipApi.deleteGoal(goalId);
                              refetchMentorships();
                            }}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 text-center text-xs text-slate-500">
                        No goals created yet. Set goals with your mentor during your next 1-on-1.
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'sessions' && (
        <div className="space-y-4">
          {isLoadingSessions ? (
            <div className="py-20 flex justify-center">
              <LoadingSpinner />
            </div>
          ) : sessions.length === 0 ? (
            <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-12 text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mx-auto">
                <Calendar className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-slate-800">No scheduled sessions</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Book a 1-on-1 session directly with available mentors or from an active mentorship.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {sessions.map((sess) => (
                <div
                  key={sess.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-slate-300 transition-colors"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2.5">
                      <h4 className="text-sm font-extrabold text-slate-900">{sess.title}</h4>
                      <MentorshipStatusBadge status={sess.status} />
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 font-medium">
                      <span className="flex items-center gap-1.5 font-bold text-slate-700">
                        <Calendar className="w-3.5 h-3.5 text-brand-600" />
                        {new Date(sess.scheduledAt).toLocaleDateString(undefined, {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                      <span className="flex items-center gap-1 font-mono">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {new Date(sess.scheduledAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}{' '}
                        ({sess.durationMinutes} min)
                      </span>
                      <span>
                        Mentor: <strong className="text-slate-800">{sess.mentorProfile?.headline}</strong>
                      </span>
                    </div>

                    {sess.meetingLink && (
                      <div className="pt-1">
                        <a
                          href={sess.meetingLink}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 underline"
                        >
                          <Video className="w-3.5 h-3.5" />
                          Join Meeting ({sess.meetingPlatform}) <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                    <button
                      onClick={() => setSelectedSessionForNotes(sess)}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors inline-flex items-center gap-1"
                    >
                      <FileText className="w-3.5 h-3.5 text-slate-500" />
                      Notes
                    </button>

                    {sess.status === 'COMPLETED' && !sess.studentRating && (
                      <button
                        onClick={() => setSelectedSessionForRating(sess)}
                        className="px-3.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-bold transition-colors inline-flex items-center gap-1"
                      >
                        <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                        Rate Session
                      </button>
                    )}

                    {sess.status === 'COMPLETED' && sess.studentRating && (
                      <span className="px-3 py-1 rounded-xl bg-amber-50 text-amber-900 text-xs font-bold border border-amber-200 inline-flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                        {sess.studentRating} / 5
                      </span>
                    )}

                    {(sess.status === 'SCHEDULED' || sess.status === 'RESCHEDULED') && (
                      <button
                        onClick={() => handleCancelSession(sess.id)}
                        className="px-3 py-1.5 rounded-xl text-rose-600 hover:bg-rose-50 text-xs font-bold transition-colors"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'requests' && (
        <div className="space-y-4">
          {isLoadingRequests ? (
            <div className="py-20 flex justify-center">
              <LoadingSpinner />
            </div>
          ) : requests.length === 0 ? (
            <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-12 text-center space-y-3">
              <h3 className="text-base font-bold text-slate-800">No mentorship requests submitted</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                When you request a mentorship with a qualified mentor, you can track their acceptance here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {requests.map((req) => (
                <div
                  key={req.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2.5">
                        <h4 className="text-sm font-extrabold text-slate-900">
                          {req.mentorProfile?.headline}
                        </h4>
                        <MentorshipStatusBadge status={req.status} />
                      </div>
                      <p className="text-xs text-slate-500 font-semibold mt-0.5">
                        {req.mentorProfile?.designation} • {req.mentorProfile?.companyOrInstitution}
                      </p>
                    </div>

                    {req.status === 'PENDING' && (
                      <button
                        onClick={() => handleWithdrawRequest(req.id)}
                        className="px-3 py-1 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                      >
                        Withdraw
                      </button>
                    )}
                  </div>

                  <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <strong className="text-slate-800">Statement of Purpose:</strong>{' '}
                    {req.statementOfPurpose}
                  </p>

                  {req.mentorResponseNotes && (
                    <div className="p-3 rounded-xl bg-blue-50/50 border border-blue-100 text-xs text-blue-900">
                      <strong>Mentor Response:</strong> {req.mentorResponseNotes}
                    </div>
                  )}

                  {req.rejectionReason && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 text-xs text-rose-800">
                      <strong>Rejection Reason:</strong> {req.rejectionReason}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {bookingForMentor && (
        <BookSessionModal
          mentor={bookingForMentor}
          mentorshipId={activeMentorshipIdForBooking || undefined}
          isOpen={!!bookingForMentor}
          onClose={() => {
            setBookingForMentor(null);
            setActiveMentorshipIdForBooking(null);
          }}
          onSubmit={async (payload) => {
            await mentorshipApi.bookSession(bookingForMentor.id, payload);
            setBookingForMentor(null);
            setActiveMentorshipIdForBooking(null);
            refetchSessions();
          }}
        />
      )}

      {selectedSessionForNotes && (
        <SessionNotesModal
          session={selectedSessionForNotes}
          userRole="STUDENT"
          isOpen={!!selectedSessionForNotes}
          onClose={() => setSelectedSessionForNotes(null)}
          onSave={async (payload) => {
            await mentorshipApi.submitSessionFeedback(selectedSessionForNotes.id, payload);
            setSelectedSessionForNotes(null);
            refetchSessions();
          }}
        />
      )}

      {selectedSessionForRating && (
        <FeedbackRatingModal
          session={selectedSessionForRating}
          isOpen={!!selectedSessionForRating}
          onClose={() => setSelectedSessionForRating(null)}
          onSuccess={() => {
            setSelectedSessionForRating(null);
            refetchSessions();
          }}
        />
      )}
    </div>
  );
};

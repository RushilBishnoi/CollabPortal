import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  Users,
  Video,
  CheckCircle,
  XCircle,
  Star,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { mentorshipApi } from '../../lib/mentorship-api';
import {
  MentorProfile,
  MentorshipRequest,
  Mentorship,
  MentorshipSession,
  MentorshipGoalStatus,
} from '../../types/mentorship';
import { useAuth } from '../../context/AuthContext';
import { MentorshipStatusBadge } from '../../components/mentorship/MentorshipStatusBadge';
import { MentorAvailabilityConfig } from '../../components/mentorship/MentorAvailabilityConfig';
import { GoalTrackerCard } from '../../components/mentorship/GoalTrackerCard';
import { SessionNotesModal } from '../../components/mentorship/SessionNotesModal';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

export const MentorWorkspacePage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const isIndustry = isAuthenticated && user?.role === 'INDUSTRY';

  const [activeTab, setActiveTab] = useState<'requests' | 'mentees' | 'sessions' | 'availability' | 'profile'>(
    'requests',
  );

  const [selectedSessionForNotes, setSelectedSessionForNotes] = useState<MentorshipSession | null>(
    null,
  );

  // Queries
  const {
    data: profileData,
    refetch: refetchProfile,
  } = useQuery({
    queryKey: ['mentor-my-profile'],
    queryFn: () => mentorshipApi.getMyMentorProfile(),
  });

  const {
    data: requestsData,
    isLoading: isLoadingRequests,
    refetch: refetchRequests,
  } = useQuery({
    queryKey: ['mentor-incoming-requests'],
    queryFn: () => mentorshipApi.getIncomingRequests(),
  });

  const {
    data: menteesData,
    isLoading: isLoadingMentees,
    refetch: refetchMentees,
  } = useQuery({
    queryKey: ['mentor-mentorships'],
    queryFn: () => mentorshipApi.getMentorMentorships(),
  });

  const {
    data: sessionsData,
    isLoading: isLoadingSessions,
    refetch: refetchSessions,
  } = useQuery({
    queryKey: ['mentor-sessions'],
    queryFn: () => mentorshipApi.getMentorSessions(),
  });

  const profile: MentorProfile | undefined = profileData;
  const requests: MentorshipRequest[] = requestsData || [];
  const mentees: Mentorship[] = menteesData || [];
  const sessions: MentorshipSession[] = sessionsData?.items || [];

  // Derived real data counts
  const activeMenteesCount = mentees.filter((m) => m.status === 'ACTIVE').length;
  const pendingRequestsCount = requests.filter((r) => r.status === 'PENDING').length;
  const upcomingSessionsCount = sessions.filter(
    (s) => s.status === 'SCHEDULED' || s.status === 'RESCHEDULED',
  ).length;
  const completedSessionsCount = sessions.filter((s) => s.status === 'COMPLETED').length;

  // Respond to request mutation
  const respondMutation = useMutation({
    mutationFn: ({
      requestId,
      action,
      notes,
      rejectionReason,
    }: {
      requestId: string;
      action: 'ACCEPT' | 'REJECT';
      notes?: string;
      rejectionReason?: string;
    }) =>
      mentorshipApi.respondToRequest(requestId, {
        action,
        notes,
        rejectionReason,
      }),
    onSuccess: () => {
      refetchRequests();
      refetchMentees();
      refetchProfile();
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Failed to process request.');
    },
  });

  const handleAccept = (requestId: string) => {
    const notes = window.prompt('Optional welcome notes for the mentee:') || undefined;
    respondMutation.mutate({ requestId, action: 'ACCEPT', notes });
  };

  const handleReject = (requestId: string) => {
    const rejectionReason = window.prompt('Please provide a reason for declining this request:');
    if (!rejectionReason) return;
    respondMutation.mutate({ requestId, action: 'REJECT', rejectionReason });
  };

  // Profile Upsert Form State
  const [headline, setHeadline] = useState<string>(profile?.headline || '');
  const [bio, setBio] = useState<string>(profile?.bio || '');
  const [designation, setDesignation] = useState<string>(profile?.designation || '');
  const [companyOrInstitution, setCompanyOrInstitution] = useState<string>(
    profile?.companyOrInstitution || '',
  );
  const [yearsOfExperience, setYearsOfExperience] = useState<number>(
    profile?.yearsOfExperience || 3,
  );
  const [maxMentees, setMaxMentees] = useState<number>(profile?.maxMentees || 5);
  const [isAvailable, setIsAvailable] = useState<boolean>(profile?.isAvailable ?? true);
  const [defaultMeetingPlatform, setDefaultMeetingPlatform] = useState<string>(
    profile?.defaultMeetingPlatform || 'GOOGLE_MEET',
  );
  const [defaultMeetingLink, setDefaultMeetingLink] = useState<string>(
    profile?.defaultMeetingLink || '',
  );
  const [linkedInUrl, setLinkedInUrl] = useState<string>(profile?.linkedInUrl || '');
  const [githubUrl, setGithubUrl] = useState<string>(profile?.githubUrl || '');
  const [profileSaveSuccess, setProfileSaveSuccess] = useState<boolean>(false);
  const [profileSaveError, setProfileSaveError] = useState<string | null>(null);

  // Sync profile form when data loads
  useEffect(() => {
    if (profile) {
      setHeadline(profile.headline);
      setBio(profile.bio);
      setDesignation(profile.designation);
      setCompanyOrInstitution(profile.companyOrInstitution);
      setYearsOfExperience(profile.yearsOfExperience);
      setMaxMentees(profile.maxMentees);
      setIsAvailable(profile.isAvailable);
      setDefaultMeetingPlatform(profile.defaultMeetingPlatform);
      setDefaultMeetingLink(profile.defaultMeetingLink || '');
      setLinkedInUrl(profile.linkedInUrl || '');
      setGithubUrl(profile.githubUrl || '');
    }
  }, [profile]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaveSuccess(false);
    setProfileSaveError(null);

    try {
      await mentorshipApi.upsertMentorProfile({
        headline,
        bio,
        designation,
        companyOrInstitution,
        yearsOfExperience,
        maxMentees,
        isAvailable,
        defaultMeetingPlatform,
        defaultMeetingLink: defaultMeetingLink.trim() || undefined,
        linkedInUrl: linkedInUrl.trim() || undefined,
        githubUrl: githubUrl.trim() || undefined,
      });
      setProfileSaveSuccess(true);
      refetchProfile();
    } catch (err: any) {
      setProfileSaveError(err.response?.data?.message || 'Failed to save mentor profile.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header & Metrics */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black text-slate-900">
              {isIndustry ? 'Industry Mentor Workspace' : 'Mentor Workspace'}
            </h1>
            {profile?.isAvailable ? (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                Accepting Mentees
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600">
                {isIndustry ? 'Not Accepting Mentees' : 'Not Accepting'}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500">
            {isIndustry
              ? 'Mentor students, manage mentorship requests, and guide their industry readiness.'
              : profile?.headline || 'Manage your mentorship engagements, slots, and mentee roadmaps.'}
          </p>
        </div>

        {/* Top Summary Metrics */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="p-3 rounded-2xl bg-indigo-50 text-indigo-900 border border-indigo-100 font-bold flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-600" />
            <span>
              Active Mentees: {activeMenteesCount} / {profile?.maxMentees || 5}
            </span>
          </div>

          {isIndustry ? (
            <>
              <div className="p-3 rounded-2xl bg-amber-50 text-amber-900 border border-amber-100 font-bold flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-600" />
                <span>Pending Requests: {pendingRequestsCount}</span>
              </div>

              <div className="p-3 rounded-2xl bg-purple-50 text-purple-900 border border-purple-100 font-bold flex items-center gap-2">
                <Video className="w-4 h-4 text-purple-600" />
                <span>Upcoming Sessions: {upcomingSessionsCount}</span>
              </div>

              <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-900 border border-emerald-100 font-bold flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span>Completed Sessions: {completedSessionsCount}</span>
              </div>
            </>
          ) : (
            <>
              <div className="p-3 rounded-2xl bg-amber-50 text-amber-900 border border-amber-100 font-bold flex items-center gap-1.5">
                <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                <span>
                  {profile?.averageRating ? profile.averageRating.toFixed(1) : 'New'} ({profile?.ratingCount || 0} reviews)
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-blue-50 text-blue-900 border border-blue-100 font-bold flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-blue-600" />
                <span>{completedSessionsCount} Completed Sessions</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-1 text-xs overflow-x-auto">
        <button
          onClick={() => setActiveTab('requests')}
          className={`px-4 py-2 rounded-2xl font-bold transition-colors shrink-0 ${
            activeTab === 'requests'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Incoming Requests ({pendingRequestsCount})
        </button>

        <button
          onClick={() => setActiveTab('mentees')}
          className={`px-4 py-2 rounded-2xl font-bold transition-colors shrink-0 ${
            activeTab === 'mentees'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Active Mentees ({activeMenteesCount})
        </button>

        <button
          onClick={() => setActiveTab('sessions')}
          className={`px-4 py-2 rounded-2xl font-bold transition-colors shrink-0 ${
            activeTab === 'sessions'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Hosted Sessions ({sessions.length})
        </button>

        <button
          onClick={() => setActiveTab('availability')}
          className={`px-4 py-2 rounded-2xl font-bold transition-colors shrink-0 ${
            activeTab === 'availability'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Weekly Availability
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`px-4 py-2 rounded-2xl font-bold transition-colors shrink-0 ${
            activeTab === 'profile'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Profile Settings
        </button>
      </div>

      {/* Tab 1: Incoming Requests */}
      {activeTab === 'requests' && (
        <div className="space-y-4">
          {isLoadingRequests ? (
            <div className="py-20 flex justify-center">
              <LoadingSpinner />
            </div>
          ) : requests.length === 0 ? (
            <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-12 text-center space-y-3">
              <h3 className="text-base font-bold text-slate-800">No mentorship requests pending</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {isIndustry
                  ? 'When students request mentorship with you, their requests and statements of purpose will appear here.'
                  : 'When students request mentorship with you, their applications and statements of purpose will appear here.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {requests.map((req) => (
                <div
                  key={req.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2.5">
                        <h4 className="text-sm font-extrabold text-slate-900">
                          {req.studentProfile?.fullName}
                        </h4>
                        <MentorshipStatusBadge status={req.status} />
                      </div>
                      <p className="text-xs text-slate-500 font-semibold mt-0.5">
                        {req.studentProfile?.institution?.name || 'Student Applicant'} •{' '}
                        {req.expectedDurationWeeks} weeks expected duration
                      </p>
                    </div>

                    {req.status === 'PENDING' && (
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleReject(req.id)}
                          className="px-3.5 py-1.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-colors inline-flex items-center gap-1"
                        >
                          <XCircle className="w-3.5 h-3.5" /> Decline
                        </button>
                        <button
                          onClick={() => handleAccept(req.id)}
                          className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors inline-flex items-center gap-1 shadow-sm"
                        >
                          <CheckCircle className="w-3.5 h-3.5" /> Accept Mentee
                        </button>
                      </div>
                    )}
                  </div>

                  <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed">
                    <strong className="text-slate-900">Statement of Purpose:</strong> {req.statementOfPurpose}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Active Mentees & Goals */}
      {activeTab === 'mentees' && (
        <div className="space-y-6">
          {isLoadingMentees ? (
            <div className="py-20 flex justify-center">
              <LoadingSpinner />
            </div>
          ) : mentees.length === 0 ? (
            <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-12 text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mx-auto">
                <Users className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-slate-800">
                {isIndustry ? 'No active mentees' : 'No active mentees yet'}
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {isIndustry
                  ? 'Students you are actively mentoring will appear here.'
                  : 'Accept incoming mentorship requests to begin mentoring students and tracking their skill goals.'}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {mentees.map((m) => (
                <div
                  key={m.id}
                  className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-6"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2.5">
                        <h3 className="text-base font-extrabold text-slate-900">
                          {m.studentProfile?.fullName}
                        </h3>
                        <MentorshipStatusBadge status={m.status} />
                      </div>
                      <p className="text-xs text-slate-500 font-semibold mt-0.5">
                        {m.studentProfile?.institution?.name} • Mentorship Started:{' '}
                        {new Date(m.startDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* Goal Milestones */}
                  <div className="pt-6 border-t border-slate-100 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-slate-900">Mentee Milestones & Goals</h4>
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
                              refetchMentees();
                            }}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 text-center text-xs text-slate-500">
                        No goals recorded for this mentee yet.
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Hosted Sessions */}
      {activeTab === 'sessions' && (
        <div className="space-y-4">
          {isLoadingSessions ? (
            <div className="py-20 flex justify-center">
              <LoadingSpinner />
            </div>
          ) : sessions.length === 0 ? (
            <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-12 text-center space-y-3">
              <h3 className="text-base font-bold text-slate-800">
                {isIndustry ? 'No hosted sessions yet' : 'No booked sessions'}
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {isIndustry
                  ? 'Your scheduled mentorship sessions will appear here.'
                  : 'Sessions booked by your mentees or students will appear here.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {sessions.map((sess) => (
                <div
                  key={sess.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5">
                      <h4 className="text-sm font-extrabold text-slate-900">{sess.title}</h4>
                      <MentorshipStatusBadge status={sess.status} />
                    </div>
                    <p className="text-xs text-slate-500 font-medium flex items-center gap-3">
                      <span>Student: <strong className="text-slate-800">{sess.studentProfile?.fullName}</strong></span>
                      <span>•</span>
                      <span className="font-bold text-slate-700">
                        {new Date(sess.scheduledAt).toLocaleString([], {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}
                      </span>
                      <span>({sess.durationMinutes} mins)</span>
                    </p>
                    {sess.meetingLink && (
                      <a
                        href={sess.meetingLink}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:underline pt-1"
                      >
                        <Video className="w-3.5 h-3.5" /> Start Meeting ({sess.meetingPlatform})
                      </a>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setSelectedSessionForNotes(sess)}
                      className="px-3.5 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors inline-flex items-center gap-1.5"
                    >
                      <FileText className="w-3.5 h-3.5 text-slate-500" />
                      Mentor Notes
                    </button>

                    {sess.studentRating && (
                      <span className="px-3 py-1 rounded-xl bg-amber-50 text-amber-900 border border-amber-200 text-xs font-bold inline-flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                        {sess.studentRating} / 5
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Weekly Availability */}
      {activeTab === 'availability' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
          <MentorAvailabilityConfig
            initialSlots={profile?.availabilities || []}
            onSave={async (slots) => {
              await mentorshipApi.setAvailability(slots);
              refetchProfile();
            }}
          />
        </div>
      )}

      {/* Tab 5: Profile Settings Form */}
      {activeTab === 'profile' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm max-w-3xl space-y-6">
          <div className="space-y-1">
            <h2 className="text-lg font-black text-slate-900">Mentor Profile & Preferences</h2>
            <p className="text-xs text-slate-500">
              Update your public headline, credentials, mentee capacity, and default meeting platforms.
            </p>
          </div>

          {profileSaveSuccess && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>Mentor profile updated successfully.</span>
            </div>
          )}

          {profileSaveError && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{profileSaveError}</span>
            </div>
          )}

          <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Headline *</label>
              <input
                type="text"
                required
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder="e.g. Senior Backend Architect at Microsoft"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-500 text-xs"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Designation *</label>
                <input
                  type="text"
                  required
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  placeholder="e.g. Staff Software Engineer"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-500 text-xs"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Company or Institution *</label>
                <input
                  type="text"
                  required
                  value={companyOrInstitution}
                  onChange={(e) => setCompanyOrInstitution(e.target.value)}
                  placeholder="e.g. Google or IIT Delhi"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-500 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Bio / Mentorship Philosophy *</label>
              <textarea
                rows={4}
                required
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell students about your domain experience, areas you can help with, and how you mentor..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-500 text-xs"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Years of Experience</label>
                <input
                  type="number"
                  min={0}
                  max={50}
                  value={yearsOfExperience}
                  onChange={(e) => setYearsOfExperience(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-500 text-xs"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Max Active Mentees Capacity</label>
                <input
                  type="number"
                  min={1}
                  max={25}
                  value={maxMentees}
                  onChange={(e) => setMaxMentees(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-500 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Default Meeting Platform</label>
                <select
                  value={defaultMeetingPlatform}
                  onChange={(e) => setDefaultMeetingPlatform(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-500 text-xs bg-white"
                >
                  <option value="GOOGLE_MEET">Google Meet</option>
                  <option value="ZOOM">Zoom</option>
                  <option value="MS_TEAMS">Microsoft Teams</option>
                  <option value="IN_PERSON">In Person</option>
                </select>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Default Meeting Link / Room</label>
                <input
                  type="url"
                  value={defaultMeetingLink}
                  onChange={(e) => setDefaultMeetingLink(e.target.value)}
                  placeholder="https://meet.google.com/xyz-abcd-efg"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-500 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">LinkedIn URL</label>
                <input
                  type="url"
                  value={linkedInUrl}
                  onChange={(e) => setLinkedInUrl(e.target.value)}
                  placeholder="https://linkedin.com/in/username"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-500 text-xs"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">GitHub URL</label>
                <input
                  type="url"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  placeholder="https://github.com/username"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-500 text-xs"
                />
              </div>
            </div>

            <div className="pt-2">
              <label className="flex items-center gap-2 font-bold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isAvailable}
                  onChange={(e) => setIsAvailable(e.target.checked)}
                  className="rounded text-brand-600 focus:ring-brand-500 w-4 h-4"
                />
                <span>Currently accepting new mentorship requests</span>
              </label>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold transition-colors shadow-md text-xs"
              >
                Save Profile Settings
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Session Notes Modal */}
      {selectedSessionForNotes && (
        <SessionNotesModal
          session={selectedSessionForNotes}
          userRole={user?.role || 'INDUSTRY'}
          isOpen={!!selectedSessionForNotes}
          onClose={() => setSelectedSessionForNotes(null)}
          onSave={async (payload) => {
            await mentorshipApi.submitSessionFeedback(selectedSessionForNotes.id, payload);
            setSelectedSessionForNotes(null);
            refetchSessions();
          }}
        />
      )}
    </div>
  );
};

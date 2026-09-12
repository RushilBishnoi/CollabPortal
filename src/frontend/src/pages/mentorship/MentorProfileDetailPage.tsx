import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Star,
  Briefcase,
  GraduationCap,
  Calendar,
  Clock,
  Video,
  ArrowLeft,
  CheckCircle,
  ExternalLink,
  ShieldCheck,
  Award,
  Users,
} from 'lucide-react';
import { mentorshipApi } from '../../lib/mentorship-api';
import { RequestMentorshipModal } from '../../components/mentorship/RequestMentorshipModal';
import { BookSessionModal } from '../../components/mentorship/BookSessionModal';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const MentorProfileDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

  const { data: mentorData, isLoading, error, refetch } = useQuery({
    queryKey: ['mentor-profile-detail', id],
    queryFn: () => mentorshipApi.getMentorById(id!),
    enabled: !!id,
  });

  const mentor = mentorData;
  const isIndustry = mentor?.mentorRoleType === 'INDUSTRY';

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !mentor) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-800">Mentor Profile Not Found</h2>
        <p className="text-xs text-slate-500">
          The requested mentor profile does not exist or may have been removed.
        </p>
        <Link
          to="/mentorship/mentors"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 text-white text-xs font-bold"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Mentor Discovery
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Navigation Breadcrumb */}
      <Link
        to="/mentorship/mentors"
        className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-brand-600 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Mentors
      </Link>

      {/* Main Profile Header Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row items-start justify-between gap-6">
          <div className="flex items-start gap-5">
            <div className="w-20 h-20 rounded-3xl bg-brand-50 border border-brand-100 flex items-center justify-center font-bold text-brand-700 text-2xl overflow-hidden shrink-0 shadow-inner">
              {mentor.user?.avatarUrl ? (
                <img
                  src={mentor.user.avatarUrl}
                  alt={mentor.headline}
                  className="w-full h-full object-cover"
                />
              ) : (
                mentor.designation.charAt(0) || 'M'
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl font-black text-slate-900">{mentor.headline}</h1>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1.5 ${
                    isIndustry
                      ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                      : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  }`}
                >
                  {isIndustry ? (
                    <Briefcase className="w-3.5 h-3.5" />
                  ) : (
                    <GraduationCap className="w-3.5 h-3.5" />
                  )}
                  {isIndustry ? 'Industry Expert' : 'Academic Faculty'}
                </span>
              </div>

              <p className="text-sm font-semibold text-slate-600">
                {mentor.designation} at <span className="text-slate-900">{mentor.companyOrInstitution}</span>
              </p>

              {/* Badges / Metrics */}
              <div className="flex flex-wrap items-center gap-3 pt-2 text-xs">
                <div className="flex items-center gap-1 px-3 py-1 rounded-xl bg-amber-50 text-amber-900 font-bold border border-amber-200">
                  <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                  <span>{mentor.averageRating > 0 ? mentor.averageRating.toFixed(1) : 'New'}</span>
                  {mentor.ratingCount > 0 && (
                    <span className="text-amber-700 font-normal">({mentor.ratingCount} reviews)</span>
                  )}
                </div>

                <div className="px-3 py-1 rounded-xl bg-slate-50 text-slate-700 font-semibold border border-slate-200">
                  {mentor.yearsOfExperience} years experience
                </div>

                <div className="px-3 py-1 rounded-xl bg-blue-50 text-blue-700 font-semibold border border-blue-200 flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5 text-blue-500" />
                  <span>{mentor.totalSessionsCompleted} completed sessions</span>
                </div>

                <div className="px-3 py-1 rounded-xl bg-purple-50 text-purple-700 font-semibold border border-purple-200 flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-purple-500" />
                  <span>Max Mentees: {mentor.maxMentees}</span>
                </div>
              </div>
            </div>
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row md:flex-col gap-2.5 shrink-0 w-full md:w-auto">
            {mentor.isAvailable ? (
              <>
                <button
                  onClick={() => setIsBookingModalOpen(true)}
                  className="px-6 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md inline-flex items-center justify-center gap-2"
                >
                  <Video className="w-4 h-4" />
                  <span>Book 1-on-1 Session</span>
                </button>
                <button
                  onClick={() => setIsRequestModalOpen(true)}
                  className="px-6 py-2.5 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold transition-all shadow-md inline-flex items-center justify-center gap-2"
                >
                  <span>Request Full Mentorship</span>
                </button>
              </>
            ) : (
              <div className="px-6 py-3 rounded-2xl bg-slate-100 text-slate-500 text-xs font-bold text-center">
                Currently Not Accepting New Mentees
              </div>
            )}
          </div>
        </div>

        {/* Bio Section */}
        <div className="pt-6 border-t border-slate-100 space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">About Me</h3>
          <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">{mentor.bio}</p>
        </div>

        {/* External Links */}
        {(mentor.linkedInUrl || mentor.githubUrl) && (
          <div className="pt-4 border-t border-slate-100 flex items-center gap-4 text-xs font-bold text-brand-600">
            {mentor.linkedInUrl && (
              <a
                href={mentor.linkedInUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 hover:underline"
              >
                LinkedIn Profile <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
            {mentor.githubUrl && (
              <a
                href={mentor.githubUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 hover:underline"
              >
                GitHub Profile <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        )}
      </div>

      {/* Grid: Skills, Career Roles, Availability */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left Column: Domain & Expertise */}
        <div className="space-y-6">
          {/* Verified Skills */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <Award className="w-4 h-4 text-brand-600" />
              <span>Mentoring Skills & Technologies</span>
            </h3>
            {mentor.skills && mentor.skills.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {mentor.skills.map((s) => (
                  <span
                    key={s.id}
                    className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold"
                  >
                    {s.skill?.name}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">No specific skills listed.</p>
            )}
          </div>

          {/* Career Roles Mentored */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-indigo-600" />
              <span>Target Career Roles</span>
            </h3>
            {mentor.careerRoles && mentor.careerRoles.length > 0 ? (
              <div className="space-y-2">
                {mentor.careerRoles.map((r) => (
                  <div
                    key={r.id}
                    className="p-3 rounded-2xl bg-indigo-50/50 border border-indigo-100 flex items-center justify-between text-xs"
                  >
                    <span className="font-bold text-indigo-950">{r.careerRole?.title}</span>
                    {r.careerRole?.category && (
                      <span className="text-[11px] font-medium text-indigo-600">
                        {r.careerRole.category}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">No specific career roles targeted.</p>
            )}
          </div>
        </div>

        {/* Right Column: Weekly Availability Schedule */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-600" />
              <span>Weekly Availability Schedule</span>
            </h3>
            <span className="text-[11px] text-slate-500 font-semibold">
              Default: {mentor.defaultMeetingPlatform}
            </span>
          </div>

          {mentor.availabilities && mentor.availabilities.length > 0 ? (
            <div className="space-y-2.5">
              {mentor.availabilities.map((avail) => (
                <div
                  key={avail.id || `${avail.dayOfWeek}-${avail.startTime}`}
                  className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2 font-bold text-slate-800">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                    <span>{DAY_NAMES[avail.dayOfWeek]}</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-600 font-medium">
                    <span className="flex items-center gap-1 font-mono">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {avail.startTime} – {avail.endTime}
                    </span>
                    <span className="px-2 py-0.5 rounded-lg bg-slate-200 text-slate-700 text-[10px] font-bold">
                      {avail.slotDurationMins} min slots
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 rounded-2xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-500 space-y-1">
              <p className="font-semibold text-slate-700">No fixed weekly slots configured.</p>
              <p>Bookings may be requested directly or coordinated upon request acceptance.</p>
            </div>
          )}

          <div className="pt-4 border-t border-slate-100 flex items-center gap-2 text-[11px] text-slate-400">
            <ShieldCheck className="w-4 h-4 text-slate-400" />
            <span>All sessions are private, 1-on-1, and protected by platform RBAC.</span>
          </div>
        </div>
      </div>

      {/* Modals */}
      {isRequestModalOpen && (
        <RequestMentorshipModal
          mentor={mentor}
          isOpen={isRequestModalOpen}
          onClose={() => setIsRequestModalOpen(false)}
          onSubmit={async (payload) => {
            await mentorshipApi.requestMentorship(mentor.id, payload);
            setIsRequestModalOpen(false);
            refetch();
          }}
        />
      )}

      {isBookingModalOpen && (
        <BookSessionModal
          mentor={mentor}
          isOpen={isBookingModalOpen}
          onClose={() => setIsBookingModalOpen(false)}
          onSubmit={async (payload) => {
            await mentorshipApi.bookSession(mentor.id, payload);
            setIsBookingModalOpen(false);
            refetch();
          }}
        />
      )}
    </div>
  );
};

import React from 'react';
import { Link } from 'react-router-dom';
import { Star, Briefcase, GraduationCap, Video, ArrowRight, UserCheck } from 'lucide-react';
import { MentorProfile } from '../../types/mentorship';

interface Props {
  mentor: MentorProfile;
  onRequestClick?: () => void;
  onBookClick?: () => void;
}

export const MentorCard: React.FC<Props> = ({ mentor, onRequestClick, onBookClick }) => {
  const isIndustry = mentor.mentorRoleType === 'INDUSTRY';

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-5">
      {/* Header Info */}
      <div>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-13 h-13 rounded-2xl bg-brand-50 border border-brand-100 flex items-center justify-center font-bold text-brand-700 text-lg overflow-hidden shrink-0">
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
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-slate-900 line-clamp-1">
                  {mentor.headline}
                </h3>
              </div>
              <p className="text-xs font-semibold text-slate-500 flex items-center gap-1.5 mt-0.5">
                {isIndustry ? (
                  <Briefcase className="w-3.5 h-3.5 text-indigo-500" />
                ) : (
                  <GraduationCap className="w-3.5 h-3.5 text-emerald-500" />
                )}
                <span>
                  {mentor.designation} • {mentor.companyOrInstitution}
                </span>
              </p>
            </div>
          </div>

          <span
            className={`px-2.5 py-1 rounded-full text-xs font-bold shrink-0 ${
              isIndustry
                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            }`}
          >
            {isIndustry ? 'Industry Expert' : 'Academic Faculty'}
          </span>
        </div>

        {/* Bio */}
        <p className="text-xs text-slate-600 line-clamp-2 mt-3.5 leading-relaxed">
          {mentor.bio}
        </p>

        {/* Meta Pills */}
        <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-50 text-amber-800 font-bold border border-amber-200">
            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            <span>{mentor.averageRating > 0 ? mentor.averageRating.toFixed(1) : 'New'}</span>
            {mentor.ratingCount > 0 && (
              <span className="text-amber-600 font-normal">({mentor.ratingCount})</span>
            )}
          </div>

          <div className="px-2.5 py-1 rounded-xl bg-slate-50 text-slate-700 font-semibold border border-slate-200">
            {mentor.yearsOfExperience} yrs exp
          </div>

          <div className="px-2.5 py-1 rounded-xl bg-blue-50 text-blue-700 font-semibold border border-blue-200 flex items-center gap-1">
            <UserCheck className="w-3 h-3 text-blue-500" />
            <span>{mentor.totalSessionsCompleted} sessions</span>
          </div>

          {mentor.isAvailable ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Available
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
              Busy
            </span>
          )}
        </div>

        {/* Skill Tags */}
        {mentor.skills && mentor.skills.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {mentor.skills.slice(0, 4).map((s) => (
              <span
                key={s.id}
                className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 text-[11px] font-medium"
              >
                {s.skill?.name}
              </span>
            ))}
            {mentor.skills.length > 4 && (
              <span className="px-1.5 py-0.5 rounded-lg bg-slate-50 text-slate-400 text-[10px] font-medium">
                +{mentor.skills.length - 4} more
              </span>
            )}
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
        <Link
          to={`/mentorship/mentors/${mentor.id}`}
          className="text-xs font-bold text-slate-700 hover:text-brand-600 transition-colors inline-flex items-center gap-1"
        >
          View Profile <ArrowRight className="w-3.5 h-3.5" />
        </Link>

        <div className="flex items-center gap-2">
          {onBookClick && mentor.isAvailable && (
            <button
              onClick={onBookClick}
              className="px-3.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold transition-colors inline-flex items-center gap-1.5"
            >
              <Video className="w-3.5 h-3.5" />
              <span>Book 1-on-1</span>
            </button>
          )}

          {onRequestClick && mentor.isAvailable && (
            <button
              onClick={onRequestClick}
              className="px-3.5 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold transition-colors shadow-sm"
            >
              Request Mentorship
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

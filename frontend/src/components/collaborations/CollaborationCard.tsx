import React from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Building2,
  CheckCircle2,
  Globe,
  Tag,
  ArrowRight,
} from 'lucide-react';
import { Collaboration } from '../../types/collaboration';
import { CollaborationTypeBadge } from './CollaborationTypeBadge';
import { CollaborationStatusBadge } from './CollaborationStatusBadge';

interface CollaborationCardProps {
  collaboration: Collaboration;
  showManagementControls?: boolean;
  onManageClick?: () => void;
}

export const CollaborationCard: React.FC<CollaborationCardProps> = ({
  collaboration,
  showManagementControls = false,
}) => {
  const isDeadlinePassed = collaboration.deadline && new Date(collaboration.deadline) < new Date();

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between h-full">
      <div>
        {/* Top Badges */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <CollaborationTypeBadge type={collaboration.collaborationType} />
          <CollaborationStatusBadge status={collaboration.status} />
        </div>

        {/* Title */}
        <Link
          to={`/collaborations/${collaboration.id}`}
          className="group block"
        >
          <h3 className="text-lg font-bold text-slate-900 group-hover:text-brand-600 transition-colors line-clamp-2">
            {collaboration.title}
          </h3>
        </Link>

        {/* Company & Verification */}
        <div className="flex items-center gap-1.5 text-sm text-slate-600 mt-2">
          <Building2 className="w-4 h-4 text-slate-400" />
          <span className="font-medium text-slate-800">
            {collaboration.industryProfile?.companyName || 'Industry Partner'}
          </span>
          {collaboration.industryProfile?.isVerified && (
            <span title="Verified Enterprise Partner">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            </span>
          )}
        </div>

        {/* Description snippet */}
        <p className="text-xs text-slate-500 mt-3 line-clamp-2 leading-relaxed">
          {collaboration.description}
        </p>

        {/* Key Metadata Grid */}
        <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 mt-4 pt-4 border-t border-slate-100">
          <div className="flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-slate-400" />
            <span>
              {collaboration.mode === 'ONLINE'
                ? 'Online / Virtual'
                : collaboration.mode === 'IN_PERSON'
                ? 'In-Person'
                : 'Hybrid'}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-slate-400" />
            <span>
              Audience:{' '}
              <strong className="font-semibold text-slate-700">
                {collaboration.targetAudience === 'BOTH'
                  ? 'Faculty & Students'
                  : collaboration.targetAudience === 'FACULTY'
                  ? 'Faculty Only'
                  : 'Students Only'}
              </strong>
            </span>
          </div>

          {collaboration.location && collaboration.mode !== 'ONLINE' && (
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span className="truncate">{collaboration.location}</span>
            </div>
          )}

          {collaboration.durationDays && (
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>{collaboration.durationDays} Days</span>
            </div>
          )}

          {collaboration.deadline && (
            <div className="flex items-center gap-1.5 col-span-2">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span className={isDeadlinePassed ? 'text-rose-600 font-semibold' : 'text-slate-600'}>
                Deadline: {new Date(collaboration.deadline).toLocaleDateString()}
                {isDeadlinePassed && ' (Expired)'}
              </span>
            </div>
          )}
        </div>

        {/* Domain Tags */}
        {collaboration.domainTags && collaboration.domainTags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-4">
            {collaboration.domainTags.slice(0, 3).map((tag, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[11px]"
              >
                <Tag className="w-2.5 h-2.5" />
                {tag}
              </span>
            ))}
            {collaboration.domainTags.length > 3 && (
              <span className="text-[11px] text-slate-400 self-center">
                +{collaboration.domainTags.length - 3} more
              </span>
            )}
          </div>
        )}
      </div>

      {/* Footer / CTA */}
      <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
        <div className="text-xs text-slate-500">
          {collaboration.maxParticipants ? (
            <span>
              Cap: <strong>{collaboration.maxParticipants}</strong> spots
            </span>
          ) : (
            <span>Open capacity</span>
          )}
        </div>

        {showManagementControls ? (
          <Link
            to={`/industry/collaborations/${collaboration.id}/participants`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 hover:text-brand-700"
          >
            Manage Participants ({collaboration._count?.participations || 0})
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        ) : (
          <Link
            to={`/collaborations/${collaboration.id}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-brand-50 text-brand-700 hover:bg-brand-100 transition-colors"
          >
            View Details
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>
    </div>
  );
};

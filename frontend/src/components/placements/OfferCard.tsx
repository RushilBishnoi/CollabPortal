import React from 'react';
import { Link } from 'react-router-dom';
import {
  Building,
  MapPin,
  Calendar,
  IndianRupee,
  Clock,
  ArrowRight,
  User,
  GraduationCap,
} from 'lucide-react';
import { PlacementOffer } from '../../types/placement';
import { OfferStatusBadge } from './OfferStatusBadge';

interface OfferCardProps {
  offer: PlacementOffer;
  roleView: 'student' | 'industry' | 'institution';
  onAccept?: (offer: PlacementOffer) => void;
  onDecline?: (offer: PlacementOffer) => void;
  onIssue?: (offer: PlacementOffer) => void;
}

export const OfferCard: React.FC<OfferCardProps> = ({
  offer,
  roleView,
  onAccept,
  onDecline,
  onIssue,
}) => {
  const isStudent = roleView === 'student';
  const isIndustry = roleView === 'industry';

  // Format compensation
  const formatCompensation = () => {
    if (offer.ctcAnnual) {
      const lpa = (offer.ctcAnnual / 100000).toFixed(1);
      return `₹${lpa} LPA CTC`;
    }
    if (offer.stipendMonthly) {
      return `₹${offer.stipendMonthly.toLocaleString()}/month`;
    }
    if (offer.baseSalaryMonthly) {
      return `₹${offer.baseSalaryMonthly.toLocaleString()}/month Base`;
    }
    return 'Undisclosed Package';
  };

  const isExpired =
    offer.status === 'ISSUED' &&
    new Date(offer.offerExpiryDate).getTime() < Date.now();

  const effectiveStatus = isExpired ? 'EXPIRED' : offer.status;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
      <div>
        {/* Top bar: Status & Type */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <OfferStatusBadge status={effectiveStatus} />
          <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-md">
            {offer.employmentType.replace(/_/g, ' ')}
          </span>
        </div>

        {/* Title & Company */}
        <div className="mb-4">
          <h3 className="text-base font-bold text-slate-900 tracking-tight mb-1">
            {offer.title}
          </h3>
          <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
            <Building className="w-3.5 h-3.5 text-brand-600 shrink-0" />
            <span>{offer.industryProfile?.companyName || 'Corporate Partner'}</span>
            {offer.department && <span>• {offer.department}</span>}
          </div>
        </div>

        {/* Student details for recruiter / TPO view */}
        {!isStudent && offer.studentProfile && (
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 mb-4 text-xs space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-slate-800">
              <User className="w-3.5 h-3.5 text-slate-500" />
              <span>{offer.studentProfile.fullName}</span>
            </div>
            {offer.studentProfile.department && (
              <div className="flex items-center gap-1 text-[11px] text-slate-500">
                <GraduationCap className="w-3 h-3" />
                <span>
                  {offer.studentProfile.department} (Class of{' '}
                  {offer.studentProfile.graduationYear || 'N/A'})
                </span>
              </div>
            )}
          </div>
        )}

        {/* Metadata Grid */}
        <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 mb-4">
          <div className="flex items-center gap-1.5 font-semibold text-slate-900">
            <IndianRupee className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>{formatCompensation()}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{offer.workLocation} ({offer.workMode})</span>
          </div>

          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>Join: {new Date(offer.joiningDate).toLocaleDateString()}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span>Valid till: {new Date(offer.offerExpiryDate).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
        <Link
          to={
            isStudent
              ? `/portal/student/offers/${offer.id}`
              : `/portal/industry/offers/${offer.id}`
          }
          className="inline-flex items-center gap-1 text-xs font-bold text-brand-600 hover:text-brand-800 transition-colors"
        >
          <span>View Offer Details</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>

        {/* Student decision buttons */}
        {isStudent && offer.status === 'ISSUED' && !isExpired && (
          <div className="flex items-center gap-2">
            {onDecline && (
              <button
                onClick={() => onDecline(offer)}
                className="px-3 py-1.5 rounded-lg border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-semibold transition-colors"
              >
                Decline
              </button>
            )}
            {onAccept && (
              <button
                onClick={() => onAccept(offer)}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-colors"
              >
                Accept Offer
              </button>
            )}
          </div>
        )}

        {/* Industry issue button for DRAFT */}
        {isIndustry && offer.status === 'DRAFT' && onIssue && (
          <button
            onClick={() => onIssue(offer)}
            className="px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold shadow-sm transition-colors"
          >
            Issue Offer
          </button>
        )}
      </div>
    </div>
  );
};

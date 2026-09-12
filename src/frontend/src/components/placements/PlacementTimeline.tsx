import React from 'react';
import { Check, Clock, AlertCircle } from 'lucide-react';
import { OfferStatus, PlacementStatus } from '../../types/placement';

interface PlacementTimelineProps {
  offerStatus: OfferStatus;
  placementStatus?: PlacementStatus | null;
  issuedAt?: string | null;
  acceptedAt?: string | null;
  verifiedAt?: string | null;
  joinedAt?: string | null;
}

export const PlacementTimeline: React.FC<PlacementTimelineProps> = ({
  offerStatus,
  placementStatus,
  issuedAt,
  acceptedAt,
  verifiedAt,
  joinedAt,
}) => {
  const isDeclined = offerStatus === 'DECLINED';
  const isExpired = offerStatus === 'EXPIRED';
  const isWithdrawn = offerStatus === 'WITHDRAWN';
  const isRevoked = placementStatus === 'REVOKED';

  const steps = [
    {
      title: '1. Candidate Selected',
      description: 'Recruiter finalized selection in recruitment round',
      status: 'completed',
      date: undefined,
    },
    {
      title: '2. Offer Formally Issued',
      description: 'Official compensation package & terms issued',
      status:
        offerStatus === 'DRAFT'
          ? 'current'
          : offerStatus === 'CANCELLED'
          ? 'cancelled'
          : 'completed',
      date: issuedAt,
    },
    {
      title: '3. Student Response',
      description: isDeclined
        ? 'Offer declined by candidate'
        : isExpired
        ? 'Offer validity expired'
        : isWithdrawn
        ? 'Offer withdrawn by corporate partner'
        : offerStatus === 'ACCEPTED'
        ? 'Offer accepted by candidate'
        : 'Awaiting student decision',
      status:
        offerStatus === 'ACCEPTED'
          ? 'completed'
          : isDeclined || isExpired || isWithdrawn
          ? 'error'
          : offerStatus === 'ISSUED'
          ? 'current'
          : 'pending',
      date: acceptedAt,
    },
    {
      title: '4. Institutional TPO Verification',
      description: isRevoked
        ? 'Placement revoked by institution'
        : placementStatus === 'VERIFIED' ||
          placementStatus === 'CONFIRMED' ||
          placementStatus === 'JOINED'
        ? 'Verified by University TPO & NOC generated'
        : offerStatus === 'ACCEPTED'
        ? 'Under review by Training & Placement Officer'
        : 'Pending student acceptance',
      status:
        placementStatus === 'VERIFIED' ||
        placementStatus === 'CONFIRMED' ||
        placementStatus === 'JOINED'
          ? 'completed'
          : isRevoked
          ? 'error'
          : offerStatus === 'ACCEPTED'
          ? 'current'
          : 'pending',
      date: verifiedAt,
    },
    {
      title: '5. Corporate Joining Confirmation',
      description:
        placementStatus === 'JOINED'
          ? 'Candidate officially joined and onboarded'
          : 'Awaiting onboarding start date',
      status:
        placementStatus === 'JOINED'
          ? 'completed'
          : placementStatus === 'CONFIRMED' || placementStatus === 'VERIFIED'
          ? 'current'
          : 'pending',
      date: joinedAt,
    },
  ];

  return (
    <div className="py-4">
      <div className="space-y-6">
        {steps.map((step, idx) => {
          let iconBg = 'bg-slate-100 text-slate-400 border-slate-200';
          let lineBg = 'bg-slate-200';

          if (step.status === 'completed') {
            iconBg = 'bg-emerald-600 text-white border-emerald-600';
            lineBg = 'bg-emerald-600';
          } else if (step.status === 'current') {
            iconBg = 'bg-brand-600 text-white border-brand-600 animate-pulse';
            lineBg = 'bg-slate-200';
          } else if (step.status === 'error' || step.status === 'cancelled') {
            iconBg = 'bg-rose-500 text-white border-rose-500';
            lineBg = 'bg-slate-200';
          }

          const isLast = idx === steps.length - 1;

          return (
            <div key={idx} className="relative flex items-start gap-4">
              {/* Connector line */}
              {!isLast && (
                <div
                  className={`absolute left-4 top-8 -bottom-6 w-0.5 ${lineBg} transition-colors`}
                />
              )}

              {/* Step indicator node */}
              <div
                className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold text-xs shrink-0 z-10 shadow-sm ${iconBg}`}
              >
                {step.status === 'completed' ? (
                  <Check className="w-4 h-4 stroke-[3]" />
                ) : step.status === 'error' ? (
                  <AlertCircle className="w-4 h-4 stroke-[3]" />
                ) : step.status === 'current' ? (
                  <Clock className="w-4 h-4" />
                ) : (
                  <span>{idx + 1}</span>
                )}
              </div>

              {/* Step content */}
              <div className="pt-0.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-xs font-bold text-slate-900">{step.title}</h4>
                  {step.date && (
                    <span className="text-[11px] text-slate-400 font-medium">
                      • {new Date(step.date).toLocaleDateString()}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

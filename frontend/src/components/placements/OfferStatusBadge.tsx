import React from 'react';
import {
  FileText,
  Send,
  CheckCircle2,
  XCircle,
  Clock,
  Ban,
  ShieldCheck,
  Building,
} from 'lucide-react';
import { OfferStatus, PlacementStatus } from '../../types/placement';

interface OfferStatusBadgeProps {
  status: OfferStatus | PlacementStatus;
  isPlacement?: boolean;
}

export const OfferStatusBadge: React.FC<OfferStatusBadgeProps> = ({
  status,
  isPlacement = false,
}) => {
  if (isPlacement) {
    switch (status as PlacementStatus) {
      case 'PENDING_VERIFICATION':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3 h-3 text-amber-600" />
            Pending TPO Verification
          </span>
        );
      case 'VERIFIED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <ShieldCheck className="w-3 h-3 text-emerald-600" />
            TPO Verified
          </span>
        );
      case 'CONFIRMED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <CheckCircle2 className="w-3 h-3 text-blue-600" />
            Placement Confirmed
          </span>
        );
      case 'JOINED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            <Building className="w-3 h-3 text-purple-600" />
            Joined Company
          </span>
        );
      case 'REVOKED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3 h-3 text-rose-600" />
            Placement Revoked
          </span>
        );
      default:
        return null;
    }
  }

  switch (status as OfferStatus) {
    case 'DRAFT':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
          <FileText className="w-3 h-3 text-slate-500" />
          Draft Offer
        </span>
      );
    case 'ISSUED':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-brand-50 text-brand-700 border border-brand-200">
          <Send className="w-3 h-3 text-brand-600" />
          Offer Issued
        </span>
      );
    case 'ACCEPTED':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          Accepted by Candidate
        </span>
      );
    case 'DECLINED':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
          <XCircle className="w-3 h-3 text-rose-600" />
          Declined by Candidate
        </span>
      );
    case 'EXPIRED':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          <Clock className="w-3 h-3 text-amber-600" />
          Offer Expired
        </span>
      );
    case 'WITHDRAWN':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
          <Ban className="w-3 h-3 text-slate-500" />
          Withdrawn
        </span>
      );
    case 'CANCELLED':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-500 border border-slate-200">
          <Ban className="w-3 h-3 text-slate-400" />
          Cancelled
        </span>
      );
    default:
      return null;
  }
};

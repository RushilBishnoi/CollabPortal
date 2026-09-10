import React from 'react';
import {
  MentorshipRequestStatus,
  MentorshipStatus,
  MentorshipSessionStatus,
  MentorshipGoalStatus,
} from '../../types/mentorship';

interface Props {
  status:
    | MentorshipRequestStatus
    | MentorshipStatus
    | MentorshipSessionStatus
    | MentorshipGoalStatus
    | string;
  type?: 'request' | 'mentorship' | 'session' | 'goal';
}

export const MentorshipStatusBadge: React.FC<Props> = ({ status }) => {
  const getBadgeStyle = () => {
    switch (status) {
      // Success / Active states
      case 'ACCEPTED':
      case 'ACTIVE':
      case 'COMPLETED':
      case 'ACHIEVED':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';

      // Scheduled / In Progress / Pending states
      case 'PENDING':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'SCHEDULED':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'IN_PROGRESS':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'RESCHEDULED':
        return 'bg-purple-50 text-purple-700 border-purple-200';

      // Terminated / Rejected / Cancelled states
      case 'REJECTED':
      case 'CANCELLED':
      case 'TERMINATED':
      case 'NO_SHOW':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'WITHDRAWN':
        return 'bg-slate-50 text-slate-600 border-slate-200';

      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const formatText = (text: string) => {
    return text.replace(/_/g, ' ');
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border capitalize tracking-wide ${getBadgeStyle()}`}
    >
      {formatText(status)}
    </span>
  );
};

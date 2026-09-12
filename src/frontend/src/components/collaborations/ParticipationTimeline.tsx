import React from 'react';
import { Clock } from 'lucide-react';
import { CollaborationStatusHistory } from '../../types/collaboration';
import { ParticipationStatusBadge } from './ParticipationStatusBadge';

interface ParticipationTimelineProps {
  history?: CollaborationStatusHistory[];
}

export const ParticipationTimeline: React.FC<ParticipationTimelineProps> = ({ history = [] }) => {
  if (!history || history.length === 0) {
    return <p className="text-xs text-slate-500 italic">No status transitions recorded yet.</p>;
  }

  return (
    <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
      {history.map((event, idx) => {
        const isLatest = idx === 0;

        return (
          <div key={event.id || idx} className="relative flex flex-col gap-1">
            {/* Dot indicator */}
            <div
              className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center bg-white ${
                isLatest
                  ? 'border-brand-600 text-brand-600 ring-4 ring-brand-100'
                  : 'border-slate-300 text-slate-400'
              }`}
            >
              <div
                className={`w-1.5 h-1.5 rounded-full ${
                  isLatest ? 'bg-brand-600' : 'bg-slate-400'
                }`}
              />
            </div>

            {/* Event Header */}
            <div className="flex flex-wrap items-center gap-2">
              <ParticipationStatusBadge status={event.toStatus} />
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {new Date(event.createdAt).toLocaleString()}
              </span>
            </div>

            {/* Actor and notes */}
            <div className="text-xs text-slate-600 mt-0.5">
              <span className="font-medium text-slate-700">
                Action by {event.changedByRole}:
              </span>{' '}
              {event.notes || `Status transitioned to ${event.toStatus}`}
            </div>
          </div>
        );
      })}
    </div>
  );
};

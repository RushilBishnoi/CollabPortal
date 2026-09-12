import React from 'react';
import {
  CheckCircle2,
  Clock,
  Calendar,
  Award,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import { ApplicationStatus, ApplicationStatusHistoryBrief } from '../../types/applications';

interface ApplicationTimelineProps {
  currentStatus: ApplicationStatus;
  statusHistory: ApplicationStatusHistoryBrief[];
  submittedAt: string;
}

const STAGES = [
  { key: 'APPLIED', label: 'Submitted', icon: CheckCircle2 },
  { key: 'UNDER_REVIEW', label: 'Under Review', icon: Clock },
  { key: 'SHORTLISTED', label: 'Shortlisted', icon: CheckCircle2 },
  { key: 'INTERVIEW_SCHEDULED', label: 'Interview', icon: Calendar },
  { key: 'SELECTED', label: 'Selected', icon: Award },
];

export const ApplicationTimeline: React.FC<ApplicationTimelineProps> = ({
  currentStatus,
  statusHistory,
}) => {
  if (currentStatus === 'WITHDRAWN') {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center gap-3 text-xs text-slate-700">
        <AlertCircle className="w-5 h-5 text-slate-500 flex-shrink-0" />
        <div>
          <p className="font-bold">Application Withdrawn</p>
          <p className="text-slate-500">You withdrew this application prior to a final recruitment decision.</p>
        </div>
      </div>
    );
  }

  if (currentStatus === 'REJECTED') {
    return (
      <div className="space-y-4">
        <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 flex items-center gap-3 text-xs text-amber-900">
          <XCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <div>
            <p className="font-bold">Application Concluded (Not Selected)</p>
            <p className="text-amber-700 text-[11px]">
              Thank you for applying. The recruiter has decided not to proceed further with this application.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Get index of current stage in standard progression
  const stageOrder = ['APPLIED', 'UNDER_REVIEW', 'SHORTLISTED', 'INTERVIEW_SCHEDULED', 'SELECTED'];
  const currentIndex = stageOrder.indexOf(currentStatus);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {STAGES.map((stage, idx) => {
          const isPassed = currentIndex >= idx;
          const isCurrent = currentStatus === stage.key;
          const Icon = stage.icon;

          const historyItem = statusHistory.find((h) => h.toStatus === stage.key);

          return (
            <div
              key={stage.key}
              className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between ${
                isCurrent
                  ? 'bg-blue-50/80 border-blue-300 ring-2 ring-blue-500/20'
                  : isPassed
                  ? 'bg-emerald-50/60 border-emerald-200'
                  : 'bg-slate-50/60 border-slate-200 opacity-60'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Step {idx + 1}
                </span>
                <Icon
                  className={`w-4 h-4 ${
                    isCurrent
                      ? 'text-blue-600 animate-pulse'
                      : isPassed
                      ? 'text-emerald-600'
                      : 'text-slate-400'
                  }`}
                />
              </div>

              <div>
                <p className={`text-xs font-extrabold ${isPassed ? 'text-slate-900' : 'text-slate-500'}`}>
                  {stage.label}
                </p>
                {historyItem && (
                  <p className="text-[10px] text-slate-400 mt-0.5 font-medium">
                    {new Date(historyItem.createdAt).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

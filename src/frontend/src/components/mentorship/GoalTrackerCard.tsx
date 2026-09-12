import React from 'react';
import { Target, CheckCircle2, XCircle, Clock, ChevronRight } from 'lucide-react';
import { MentorshipGoal, MentorshipGoalStatus } from '../../types/mentorship';

interface Props {
  goal: MentorshipGoal;
  canEdit?: boolean;
  onStatusChange?: (goalId: string, status: MentorshipGoalStatus) => void;
  onDelete?: (goalId: string) => void;
}

const STATUS_LABELS: Record<MentorshipGoalStatus, string> = {
  PENDING: 'Pending',
  IN_PROGRESS: 'In Progress',
  ACHIEVED: 'Achieved',
  CANCELLED: 'Cancelled',
};

const STATUS_COLORS: Record<MentorshipGoalStatus, string> = {
  PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
  IN_PROGRESS: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  ACHIEVED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  CANCELLED: 'bg-slate-50 text-slate-500 border-slate-200',
};

const STATUS_DOT: Record<MentorshipGoalStatus, string> = {
  PENDING: 'bg-amber-400',
  IN_PROGRESS: 'bg-indigo-500 animate-pulse',
  ACHIEVED: 'bg-emerald-500',
  CANCELLED: 'bg-slate-300',
};

const NEXT_STATUSES: Partial<Record<MentorshipGoalStatus, MentorshipGoalStatus[]>> = {
  PENDING: ['IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: ['ACHIEVED', 'CANCELLED'],
};

export const GoalTrackerCard: React.FC<Props> = ({
  goal,
  canEdit = false,
  onStatusChange,
  onDelete,
}) => {
  const status = goal.status as MentorshipGoalStatus;

  const isOverdue =
    goal.targetDate &&
    new Date(goal.targetDate) < new Date() &&
    status !== 'ACHIEVED' &&
    status !== 'CANCELLED';

  const nextStatuses = NEXT_STATUSES[status] || [];

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div
      className={`bg-white rounded-2xl border p-4 shadow-sm space-y-3 ${
        status === 'ACHIEVED'
          ? 'border-emerald-200 bg-emerald-50/30'
          : status === 'CANCELLED'
          ? 'border-slate-200 opacity-60'
          : 'border-slate-200'
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div
          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
            status === 'ACHIEVED'
              ? 'bg-emerald-100 text-emerald-600'
              : status === 'CANCELLED'
              ? 'bg-slate-100 text-slate-400'
              : 'bg-brand-50 text-brand-600'
          }`}
        >
          {status === 'ACHIEVED' ? (
            <CheckCircle2 className="w-4.5 h-4.5" />
          ) : status === 'CANCELLED' ? (
            <XCircle className="w-4.5 h-4.5" />
          ) : (
            <Target className="w-4.5 h-4.5" />
          )}
        </div>

        {/* Title & Status */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4
              className={`text-sm font-bold ${
                status === 'CANCELLED' ? 'line-through text-slate-400' : 'text-slate-900'
              }`}
            >
              {goal.title}
            </h4>
            <span
              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold border ${STATUS_COLORS[status]}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[status]}`} />
              {STATUS_LABELS[status]}
            </span>
          </div>

          {goal.description && (
            <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
              {goal.description}
            </p>
          )}
        </div>
      </div>

      {/* Meta chips */}
      <div className="flex flex-wrap items-center gap-2">
        {goal.targetDate && (
          <div
            className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-semibold border ${
              isOverdue ? 'bg-red-50 text-red-700 border-red-200' : 'bg-slate-50 text-slate-600 border-slate-200'
            }`}
          >
            <Clock className="w-3 h-3" />
            <span>{isOverdue ? '⚠ Overdue · ' : 'Due: '}{formatDate(goal.targetDate)}</span>
          </div>
        )}

        {goal.linkedSkill && (
          <span className="px-2.5 py-1 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-semibold">
            🎯 {goal.linkedSkill.name}
          </span>
        )}

        {goal.linkedLearningPath && (
          <span className="px-2.5 py-1 rounded-xl bg-purple-50 text-purple-700 border border-purple-200 text-[11px] font-semibold">
            📚 {goal.linkedLearningPath.title}
          </span>
        )}

        {goal.completedAt && (
          <span className="px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-semibold">
            ✓ Achieved {formatDate(goal.completedAt)}
          </span>
        )}
      </div>

      {/* Actions */}
      {canEdit && nextStatuses.length > 0 && onStatusChange && (
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
          <span className="text-[11px] font-bold text-slate-500 mr-1">Mark as:</span>
          {nextStatuses.map((nextStatus) => (
            <button
              key={nextStatus}
              onClick={() => onStatusChange(goal.id, nextStatus)}
              className={`inline-flex items-center gap-1 px-3 py-1 rounded-xl text-[11px] font-bold border transition-all ${
                nextStatus === 'ACHIEVED'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                  : nextStatus === 'IN_PROGRESS'
                  ? 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100'
                  : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
              }`}
            >
              <ChevronRight className="w-3 h-3" />
              {STATUS_LABELS[nextStatus]}
            </button>
          ))}

          {onDelete && status === 'PENDING' && (
            <button
              onClick={() => onDelete(goal.id)}
              className="ml-auto px-2 py-1 rounded-xl text-[11px] font-bold text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
            >
              Delete
            </button>
          )}
        </div>
      )}
    </div>
  );
};

import React from 'react';
import {
  CheckCircle2,
  Circle,
  ExternalLink,
  Clock,
  Video,
  FileText,
  Code,
  Terminal,
  BookOpen,
} from 'lucide-react';
import { LearningPathItem, StudentResourceProgress } from '../../types/learning';
import { cn } from '../../lib/utils';

interface LearningPathStepperProps {
  items: LearningPathItem[];
  progressMap?: Map<string, StudentResourceProgress>;
  isEnrolled?: boolean;
  onCompleteStep?: (resourceId: string) => void;
}

export const LearningPathStepper: React.FC<LearningPathStepperProps> = ({
  items,
  progressMap = new Map(),
  isEnrolled = false,
  onCompleteStep,
}) => {
  const sortedItems = [...items].sort((a, b) => a.order - b.order);

  const getTypeIcon = (type?: string) => {
    switch (type) {
      case 'VIDEO':
        return <Video className="w-3.5 h-3.5 text-rose-600" />;
      case 'ARTICLE':
      case 'DOCUMENTATION':
        return <FileText className="w-3.5 h-3.5 text-blue-600" />;
      case 'PRACTICE_PROJECT':
        return <Code className="w-3.5 h-3.5 text-amber-600" />;
      case 'INTERACTIVE_LAB':
        return <Terminal className="w-3.5 h-3.5 text-purple-600" />;
      default:
        return <BookOpen className="w-3.5 h-3.5 text-emerald-600" />;
    }
  };

  return (
    <div className="space-y-4">
      {sortedItems.map((item, index) => {
        const resource = item.resource;
        const progress = resource ? progressMap.get(resource.id) : undefined;
        const isCompleted = progress?.status === 'COMPLETED';
        const isLast = index === sortedItems.length - 1;

        return (
          <div key={item.id} className="relative flex items-start gap-4">
            {/* Step numbering & Line */}
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border transition-colors',
                  isCompleted
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-white text-slate-700 border-slate-300',
                )}
              >
                {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : item.order}
              </div>
              {!isLast && (
                <div
                  className={cn(
                    'w-0.5 h-16 my-1',
                    isCompleted ? 'bg-emerald-400' : 'bg-slate-200',
                  )}
                />
              )}
            </div>

            {/* Content card */}
            <div
              className={cn(
                'flex-1 rounded-xl border p-4 transition-all',
                isCompleted
                  ? 'bg-emerald-50/30 border-emerald-200'
                  : 'bg-white border-slate-200 hover:border-slate-300',
              )}
            >
              {resource ? (
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {getTypeIcon(resource.resourceType)}
                        {resource.resourceType.replace('_', ' ')}
                      </span>
                      {resource.estimatedMinutes && (
                        <span className="flex items-center gap-1 text-[11px] text-slate-500 font-medium">
                          <Clock className="w-3 h-3" />
                          {resource.estimatedMinutes}m
                        </span>
                      )}
                    </div>

                    {isEnrolled && onCompleteStep && (
                      <button
                        onClick={() => onCompleteStep(resource.id)}
                        className={cn(
                          'inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors',
                          isCompleted
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            : 'bg-white hover:bg-emerald-50 text-slate-700 border-slate-200 hover:border-emerald-300',
                        )}
                      >
                        {isCompleted ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            Completed
                          </>
                        ) : (
                          <>
                            <Circle className="w-3.5 h-3.5 text-slate-400" />
                            Mark Done
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  <h4 className="font-bold text-slate-900 text-sm mb-1">
                    {resource.title}
                  </h4>
                  <p className="text-xs text-slate-600 mb-2 leading-relaxed">
                    {resource.description}
                  </p>

                  {item.milestoneNotes && (
                    <div className="p-2 rounded bg-amber-50/70 border border-amber-200/60 text-xs text-amber-900 mb-2 font-medium">
                      💡 Milestone: {item.milestoneNotes}
                    </div>
                  )}

                  <a
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-800 underline"
                  >
                    <span>Open Study Link</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              ) : (
                <div className="text-xs text-slate-500">Resource item #{item.order}</div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

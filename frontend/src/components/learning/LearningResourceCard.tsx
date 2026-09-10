import React from 'react';
import {
  ExternalLink,
  Clock,
  CheckCircle2,
  Bookmark,
  BookOpen,
  Video,
  FileText,
  Code,
  Terminal,
  Layers,
  Star,
} from 'lucide-react';
import { LearningResource } from '../../types/learning';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../lib/utils';

interface LearningResourceCardProps {
  resource: LearningResource;
  isSaved?: boolean;
  isCompleted?: boolean;
  onSave?: (resourceId: string) => void;
  onComplete?: (resourceId: string) => void;
}

export const LearningResourceCard: React.FC<LearningResourceCardProps> = ({
  resource,
  isSaved = false,
  isCompleted = false,
  onSave,
  onComplete,
}) => {
  const { user } = useAuth();
  const isStudent = user?.role === 'STUDENT';

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'VIDEO':
        return <Video className="w-3.5 h-3.5" />;
      case 'ARTICLE':
      case 'DOCUMENTATION':
        return <FileText className="w-3.5 h-3.5" />;
      case 'PRACTICE_PROJECT':
        return <Code className="w-3.5 h-3.5" />;
      case 'INTERACTIVE_LAB':
        return <Terminal className="w-3.5 h-3.5" />;
      default:
        return <BookOpen className="w-3.5 h-3.5" />;
    }
  };

  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case 'BEGINNER':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'INTERMEDIATE':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'ADVANCED':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'EXPERT':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div
      className={cn(
        'bg-white rounded-xl border transition-all duration-200 p-5 flex flex-col justify-between hover:shadow-md hover:border-slate-300',
        isCompleted ? 'border-emerald-200 bg-emerald-50/20' : 'border-slate-200',
      )}
    >
      <div>
        {/* Badges row */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-50 text-brand-700 border border-brand-100">
              {getTypeIcon(resource.resourceType)}
              {resource.resourceType.replace('_', ' ')}
            </span>
            <span
              className={cn(
                'inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border',
                getDifficultyColor(resource.difficulty),
              )}
            >
              {resource.difficulty}
            </span>
            {resource.isVerified && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                Verified
              </span>
            )}
          </div>

          {resource.estimatedMinutes && (
            <span className="flex items-center gap-1 text-xs text-slate-500">
              <Clock className="w-3.5 h-3.5" />
              {resource.estimatedMinutes}m
            </span>
          )}
        </div>

        {/* Title & Description */}
        <h3 className="font-bold text-slate-900 text-base mb-1.5 line-clamp-2 hover:text-brand-600 transition-colors">
          {resource.title}
        </h3>
        <p className="text-xs text-slate-600 line-clamp-3 mb-3 leading-relaxed">
          {resource.description}
        </p>

        {/* Skill tag & Provider */}
        <div className="flex items-center gap-2 flex-wrap text-xs text-slate-500 mb-4">
          {resource.skill && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium text-[11px]">
              <Layers className="w-3 h-3 text-slate-400" />
              {resource.skill.name}
            </span>
          )}
          {resource.provider && (
            <span className="text-slate-400 font-medium">via {resource.provider}</span>
          )}
          {resource.rating && (
            <span className="inline-flex items-center gap-0.5 text-amber-600 font-semibold text-[11px] ml-auto">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              {resource.rating.toFixed(1)}
            </span>
          )}
        </div>
      </div>

      {/* Bottom actions */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
        <a
          href={resource.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-50 hover:bg-brand-100 text-brand-700 text-xs font-semibold transition-colors"
        >
          <span>Open Resource</span>
          <ExternalLink className="w-3 h-3" />
        </a>

        {isStudent && (
          <div className="flex items-center gap-1.5">
            {onSave && (
              <button
                onClick={() => onSave(resource.id)}
                title={isSaved ? 'Saved' : 'Save for later'}
                className={cn(
                  'p-1.5 rounded-lg border transition-colors',
                  isSaved
                    ? 'bg-brand-50 border-brand-200 text-brand-600'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-500',
                )}
              >
                <Bookmark className="w-3.5 h-3.5" />
              </button>
            )}
            {onComplete && (
              <button
                onClick={() => onComplete(resource.id)}
                className={cn(
                  'inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors',
                  isCompleted
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-white hover:bg-emerald-50 text-slate-700 border-slate-200 hover:border-emerald-300 hover:text-emerald-700',
                )}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{isCompleted ? 'Done' : 'Mark Done'}</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

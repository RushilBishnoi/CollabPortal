import React from 'react';
import { Link } from 'react-router-dom';
import {
  Compass,
  Clock,
  BookOpen,
  Users,
  ArrowRight,
  Briefcase,
} from 'lucide-react';
import { LearningPath } from '../../types/learning';
import { cn } from '../../lib/utils';

interface LearningPathCardProps {
  path: LearningPath;
  enrolled?: boolean;
  progressPercentage?: number;
}

export const LearningPathCard: React.FC<LearningPathCardProps> = ({
  path,
  enrolled = false,
  progressPercentage = 0,
}) => {
  const itemCount = path.items?.length ?? path._count?.items ?? 0;
  const enrollmentCount = path._count?.enrollments ?? 0;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col justify-between hover:shadow-md hover:border-slate-300 transition-all duration-200">
      <div>
        {/* Header badges */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-brand-50 text-brand-700 border border-brand-100">
            <Compass className="w-3.5 h-3.5" />
            Learning Path
          </span>
          <span className="text-xs text-slate-500 font-medium">
            {path.authorRole.replace('_', ' ')} Curated
          </span>
        </div>

        {/* Title */}
        <h3 className="text-lg font-bold text-slate-900 mb-2 leading-snug hover:text-brand-600 transition-colors">
          <Link to={`/learning/paths/${path.slug || path.id}`}>
            {path.title}
          </Link>
        </h3>

        {/* Description */}
        <p className="text-xs text-slate-600 line-clamp-3 mb-4 leading-relaxed">
          {path.description}
        </p>

        {/* Career Role target */}
        {path.careerRole && (
          <div className="mb-4 p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex items-center gap-2 text-xs text-slate-700 font-medium">
            <Briefcase className="w-4 h-4 text-brand-600" />
            <span>Prepares for: <strong className="text-slate-900">{path.careerRole.title}</strong></span>
          </div>
        )}

        {/* Path Metrics */}
        <div className="grid grid-cols-3 gap-2 py-3 border-y border-slate-100 text-center mb-4">
          <div>
            <div className="flex items-center justify-center gap-1 text-slate-400 text-xs mb-0.5">
              <Clock className="w-3 h-3" />
              <span>Effort</span>
            </div>
            <span className="text-xs font-bold text-slate-800">
              {path.estimatedHours} hrs
            </span>
          </div>
          <div>
            <div className="flex items-center justify-center gap-1 text-slate-400 text-xs mb-0.5">
              <BookOpen className="w-3 h-3" />
              <span>Modules</span>
            </div>
            <span className="text-xs font-bold text-slate-800">
              {itemCount} steps
            </span>
          </div>
          <div>
            <div className="flex items-center justify-center gap-1 text-slate-400 text-xs mb-0.5">
              <Users className="w-3 h-3" />
              <span>Learners</span>
            </div>
            <span className="text-xs font-bold text-slate-800">
              {enrollmentCount}
            </span>
          </div>
        </div>

        {/* Enrollment Progress bar if enrolled */}
        {enrolled && (
          <div className="mb-4">
            <div className="flex items-center justify-between text-xs mb-1.5 font-medium">
              <span className="text-slate-600">Your Progress</span>
              <span className="text-brand-600 font-bold">{progressPercentage}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-300',
                  progressPercentage >= 100 ? 'bg-emerald-500' : 'bg-brand-600',
                )}
                style={{ width: `${Math.min(100, progressPercentage)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Action CTA */}
      <Link
        to={`/learning/paths/${path.slug || path.id}`}
        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-sm transition-colors mt-2"
      >
        <span>{enrolled ? 'Continue Learning' : 'View Curriculum'}</span>
        <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  );
};

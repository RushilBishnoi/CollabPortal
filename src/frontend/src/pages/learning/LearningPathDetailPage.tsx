import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Compass,
  Clock,
  BookOpen,
  ArrowLeft,
  CheckCircle2,
  Briefcase,
  Layers,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import { learningApi } from '../../lib/learning-api';
import { LearningPathStepper } from '../../components/learning/LearningPathStepper';
import { useAuth } from '../../context/AuthContext';
import {
  LearningPath,
  StudentLearningOverview,
  StudentResourceProgress,
  StudentPathEnrollment,
} from '../../types/learning';

export const LearningPathDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isStudent = user?.role === 'STUDENT';

  // Fetch Path detail
  const { data: path, isLoading, error } = useQuery<LearningPath>({
    queryKey: ['learning-path-detail', id],
    queryFn: () => learningApi.getPathById(id!),
    enabled: !!id,
  });

  // Fetch student progress
  const { data: studentLearningData } = useQuery<StudentLearningOverview>({
    queryKey: ['my-learning'],
    queryFn: () => learningApi.getMyLearning(),
    enabled: isStudent,
  });

  // Enroll Mutation
  const enrollMutation = useMutation({
    mutationFn: (pathId: string) => learningApi.enrollInPath(pathId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-learning'] });
      queryClient.invalidateQueries({ queryKey: ['learning-path-detail', id] });
    },
  });

  // Update resource progress mutation
  const progressMutation = useMutation({
    mutationFn: ({
      resourceId,
      status,
    }: {
      resourceId: string;
      status: 'SAVED' | 'IN_PROGRESS' | 'COMPLETED';
    }) => learningApi.updateResourceProgress(resourceId, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-learning'] });
    },
  });

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 animate-pulse space-y-6">
        <div className="h-8 bg-slate-200 rounded w-1/3 mb-4" />
        <div className="h-32 bg-slate-100 rounded-2xl" />
        <div className="h-64 bg-slate-100 rounded-2xl" />
      </div>
    );
  }

  if (error || !path) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-slate-800 mb-2">Learning Path Not Found</h2>
        <p className="text-xs text-slate-500 mb-6">
          The requested curriculum may have been archived or removed.
        </p>
        <Link
          to="/learning"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Learning Hub
        </Link>
      </div>
    );
  }

  // Check enrollment
  const enrollment = studentLearningData?.enrollments.find(
    (e: StudentPathEnrollment) => e.learningPathId === path.id,
  );
  const isEnrolled = !!enrollment;

  // Build map of resource progresses
  const progressMap = new Map<string, StudentResourceProgress>();
  (studentLearningData?.resourceProgress || []).forEach((rp: StudentResourceProgress) => {
    progressMap.set(rp.resourceId, rp);
  });

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      {/* Back button */}
      <Link
        to="/learning"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Learning Catalog</span>
      </Link>

      {/* Path Header Hero */}
      <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm mb-8">
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-brand-50 text-brand-700 border border-brand-100">
            <Compass className="w-3.5 h-3.5" />
            Structured Learning Path
          </span>
          <span className="text-xs text-slate-500 font-medium">
            Authored by {path.authorRole.replace('_', ' ')}
          </span>
          {path.careerRole && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-medium ml-auto">
              <Briefcase className="w-3.5 h-3.5 text-brand-600" />
              {path.careerRole.title}
            </span>
          )}
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-3 tracking-tight">
          {path.title}
        </h1>

        <p className="text-sm text-slate-600 leading-relaxed mb-6">
          {path.description}
        </p>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-brand-600 shadow-sm">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] text-slate-500 uppercase font-semibold">Total Effort</p>
              <p className="text-sm font-bold text-slate-900">{path.estimatedHours} Hours</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-brand-600 shadow-sm">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] text-slate-500 uppercase font-semibold">Curriculum</p>
              <p className="text-sm font-bold text-slate-900">{path.items?.length || 0} Modules</p>
            </div>
          </div>

          <div className="flex items-center gap-3 col-span-2 sm:col-span-1">
            <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-brand-600 shadow-sm">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] text-slate-500 uppercase font-semibold">Target Level</p>
              <p className="text-sm font-bold text-slate-900">{path.targetProficiency}</p>
            </div>
          </div>
        </div>

        {/* Enrollment / Progress Box */}
        {isStudent && (
          <div>
            {isEnrolled ? (
              <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-bold text-emerald-900">
                      Enrolled in this Learning Path
                    </span>
                  </div>
                  <p className="text-xs text-emerald-700">
                    Progress: {enrollment.completedItemsCount} of {enrollment.totalItemsCount} items completed ({enrollment.progressPercentage}%)
                  </p>
                </div>
                <div className="w-full sm:w-48">
                  <div className="w-full bg-emerald-200 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-emerald-600 h-full rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, enrollment.progressPercentage)}%` }}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <button
                onClick={() => enrollMutation.mutate(path.id)}
                disabled={enrollMutation.isPending}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-md shadow-brand-500/20 transition-colors disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                <span>{enrollMutation.isPending ? 'Enrolling...' : 'Enroll in Learning Path'}</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Curriculum Section */}
      <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-brand-600" />
          Curriculum Syllabus &amp; Step-by-Step Modules
        </h2>

        {path.items && path.items.length > 0 ? (
          <LearningPathStepper
            items={path.items}
            progressMap={progressMap}
            isEnrolled={isEnrolled}
            onCompleteStep={(resourceId) =>
              progressMutation.mutate({ resourceId, status: 'COMPLETED' })
            }
          />
        ) : (
          <p className="text-xs text-slate-400 italic">No modules added to this path yet.</p>
        )}
      </div>
    </div>
  );
};

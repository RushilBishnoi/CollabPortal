import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  GraduationCap,
  Clock,
  Compass,
  CheckCircle2,
  Bookmark,
  BookOpen,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { learningApi } from '../../lib/learning-api';
import { LearningPathCard } from '../../components/learning/LearningPathCard';
import { LearningResourceCard } from '../../components/learning/LearningResourceCard';
import {
  StudentLearningOverview,
  StudentPathEnrollment,
  StudentResourceProgress,
} from '../../types/learning';

export const StudentLearningPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'paths' | 'saved' | 'completed'>('paths');

  const { data: learningData, isLoading } = useQuery<StudentLearningOverview>({
    queryKey: ['my-learning'],
    queryFn: () => learningApi.getMyLearning(),
  });

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

  const overview = learningData;
  const stats = overview?.stats || {
    totalEnrolledPaths: 0,
    activeEnrollmentsCount: 0,
    completedPathsCount: 0,
    totalResourcesInteracted: 0,
    completedResourcesCount: 0,
    inProgressResourcesCount: 0,
    savedResourcesCount: 0,
    totalHoursSpent: 0,
  };

  const enrollments: StudentPathEnrollment[] = overview?.enrollments || [];
  const resourceProgress: StudentResourceProgress[] = overview?.resourceProgress || [];

  const savedResources = resourceProgress.filter((rp: StudentResourceProgress) => rp.status === 'SAVED');
  const completedResources = resourceProgress.filter((rp: StudentResourceProgress) => rp.status === 'COMPLETED');

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse space-y-6">
        <div className="h-8 bg-slate-200 rounded w-1/4 mb-4" />
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-slate-100 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <GraduationCap className="w-6 h-6 text-brand-600" />
            <h1 className="text-2xl font-bold text-slate-900">
              My Learning Dashboard
            </h1>
          </div>
          <p className="text-xs text-slate-500">
            Track your course enrollments, bookmarked resources, and skill remediation progress.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/learning/remediation"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-50 text-brand-700 border border-brand-200 hover:bg-brand-100 text-xs font-semibold transition-colors"
          >
            <Sparkles className="w-4 h-4 text-brand-600" />
            <span>Skill Remediation</span>
          </Link>
          <Link
            to="/learning"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800 text-xs font-semibold shadow-sm transition-colors"
          >
            <BookOpen className="w-4 h-4" />
            <span>Browse Catalog</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-600 font-bold">
            <Compass className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase">Active Paths</p>
            <p className="text-xl font-extrabold text-slate-900">{stats.activeEnrollmentsCount}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 font-bold">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase">Completed Modules</p>
            <p className="text-xl font-extrabold text-slate-900">{stats.completedResourcesCount}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 font-bold">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase">Study Time</p>
            <p className="text-xl font-extrabold text-slate-900">{stats.totalHoursSpent} hrs</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 font-bold">
            <Bookmark className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-500 uppercase">Saved For Later</p>
            <p className="text-xl font-extrabold text-slate-900">{stats.savedResourcesCount}</p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 mb-6 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveTab('paths')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'paths'
              ? 'bg-slate-900 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Compass className="w-4 h-4" />
          Enrolled Paths ({enrollments.length})
        </button>

        <button
          onClick={() => setActiveTab('saved')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'saved'
              ? 'bg-slate-900 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Bookmark className="w-4 h-4" />
          Saved Resources ({savedResources.length})
        </button>

        <button
          onClick={() => setActiveTab('completed')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'completed'
              ? 'bg-slate-900 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          Completed Modules ({completedResources.length})
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'paths' && (
        enrollments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {enrollments.map((enr: StudentPathEnrollment) => (
              enr.learningPath && (
                <LearningPathCard
                  key={enr.id}
                  path={enr.learningPath}
                  enrolled={true}
                  progressPercentage={enr.progressPercentage}
                />
              )
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
            <Compass className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="font-bold text-slate-800 text-base mb-1">
              You have not enrolled in any learning paths yet
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
              Explore our curated career roadmaps to start acquiring industry-verified skills.
            </p>
            <Link
              to="/learning"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 text-white text-xs font-semibold shadow-sm hover:bg-brand-700 transition-colors"
            >
              <span>Explore Learning Paths</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )
      )}

      {activeTab === 'saved' && (
        savedResources.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {savedResources.map((rp: StudentResourceProgress) => (
              rp.resource && (
                <LearningResourceCard
                  key={rp.id}
                  resource={rp.resource}
                  isSaved={true}
                  isCompleted={false}
                  onComplete={(id) =>
                    progressMutation.mutate({ resourceId: id, status: 'COMPLETED' })
                  }
                />
              )
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
            <Bookmark className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="font-bold text-slate-800 text-base mb-1">
              No saved resources
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Click the bookmark icon on any learning resource card to save it for later study.
            </p>
          </div>
        )
      )}

      {activeTab === 'completed' && (
        completedResources.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {completedResources.map((rp: StudentResourceProgress) => (
              rp.resource && (
                <LearningResourceCard
                  key={rp.id}
                  resource={rp.resource}
                  isSaved={false}
                  isCompleted={true}
                />
              )
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
            <CheckCircle2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="font-bold text-slate-800 text-base mb-1">
              No completed modules yet
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Mark modules as complete as you study to track your progress and unlock skill assessments!
            </p>
          </div>
        )
      )}
    </div>
  );
};

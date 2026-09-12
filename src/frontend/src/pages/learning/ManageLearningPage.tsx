import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  BookOpen,
  Compass,
  Plus,
  Trash2,
  CheckCircle2,
  ExternalLink,
  Layers,
} from 'lucide-react';
import { learningApi } from '../../lib/learning-api';
import { CreateResourceModal } from '../../components/learning/CreateResourceModal';
import { LearningResource, LearningPath } from '../../types/learning';

export const ManageLearningPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'resources' | 'paths'>('resources');
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Fetch authored resources
  const { data: myResourcesData, isLoading: resourcesLoading } = useQuery<LearningResource[]>({
    queryKey: ['my-authored-resources'],
    queryFn: () => learningApi.getMyResources(),
  });

  // Fetch authored paths
  const { data: myPathsData, isLoading: pathsLoading } = useQuery<LearningPath[]>({
    queryKey: ['my-authored-paths'],
    queryFn: () => learningApi.getMyPaths(),
  });

  // Delete Resource Mutation
  const deleteResourceMutation = useMutation({
    mutationFn: (id: string) => learningApi.deleteResource(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-authored-resources'] });
      queryClient.invalidateQueries({ queryKey: ['learning-resources'] });
    },
  });

  // Delete Path Mutation
  const deletePathMutation = useMutation({
    mutationFn: (id: string) => learningApi.deletePath(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-authored-paths'] });
      queryClient.invalidateQueries({ queryKey: ['learning-paths'] });
    },
  });

  const resources: LearningResource[] = myResourcesData || [];
  const paths: LearningPath[] = myPathsData || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BookOpen className="w-6 h-6 text-brand-600" />
            <h1 className="text-2xl font-bold text-slate-900">
              Learning Curation Studio
            </h1>
          </div>
          <p className="text-xs text-slate-500">
            Publish and manage high-quality learning materials and structured career paths.
          </p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 text-white hover:bg-brand-700 text-xs font-semibold shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Publish New Resource</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-6 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveTab('resources')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'resources'
              ? 'bg-slate-900 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          My Curated Resources ({resources.length})
        </button>

        <button
          onClick={() => setActiveTab('paths')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'paths'
              ? 'bg-slate-900 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Compass className="w-4 h-4" />
          My Curricula &amp; Paths ({paths.length})
        </button>
      </div>

      {/* Content */}
      {activeTab === 'resources' ? (
        resourcesLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-slate-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : resources.length > 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Title &amp; Skill</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Difficulty</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {resources.map((res) => (
                    <tr key={res.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 mb-0.5">{res.title}</div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500">
                          {res.skill && (
                            <span className="inline-flex items-center gap-1">
                              <Layers className="w-3 h-3 text-slate-400" />
                              {res.skill.name}
                            </span>
                          )}
                          {res.provider && <span>• {res.provider}</span>}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-700">
                        {res.resourceType}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-700">
                        {res.difficulty}
                      </td>
                      <td className="py-3.5 px-4">
                        {res.isVerified ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-medium">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Verified
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[11px] font-medium">
                            Published
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-2">
                          <a
                            href={res.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg text-brand-600 hover:bg-brand-50"
                            title="Open Link"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                          <button
                            onClick={() => deleteResourceMutation.mutate(res.id)}
                            className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50"
                            title="Delete Resource"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
            <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="font-bold text-slate-800 text-base mb-1">
              You haven&apos;t published any learning resources yet
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
              Share tutorials, articles, documentation, or practice projects with students.
            </p>
            <button
              onClick={() => setIsCreateOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 text-white text-xs font-semibold"
            >
              <Plus className="w-4 h-4" /> Publish First Resource
            </button>
          </div>
        )
      ) : pathsLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-slate-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : paths.length > 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Path Title</th>
                  <th className="py-3 px-4">Career Role</th>
                  <th className="py-3 px-4">Modules</th>
                  <th className="py-3 px-4">Learners</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paths.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {p.title}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-700">
                      {p.careerRole?.title || 'General Roadmap'}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-700">
                      {p.items?.length || 0} steps ({p.estimatedHours}h)
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-700">
                      {p._count?.enrollments || 0}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => deletePathMutation.mutate(p.id)}
                        className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50"
                        title="Delete Path"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <Compass className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-slate-800 text-base mb-1">
            No structured curricula created yet
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Design structured multi-step learning journeys for students.
          </p>
        </div>
      )}

      {/* Creation Modal */}
      <CreateResourceModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={() => {
          queryClient.invalidateQueries({ queryKey: ['my-authored-resources'] });
          queryClient.invalidateQueries({ queryKey: ['learning-resources'] });
        }}
      />
    </div>
  );
};

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  BookOpen,
  Compass,
  Search,
  Plus,
  Layers,
  GraduationCap,
  Sparkles,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { learningApi, PaginatedResponse } from '../../lib/learning-api';
import { skillApi } from '../../lib/skill-api';
import { LearningResourceCard } from '../../components/learning/LearningResourceCard';
import { LearningPathCard } from '../../components/learning/LearningPathCard';
import { CreateResourceModal } from '../../components/learning/CreateResourceModal';
import { useAuth } from '../../context/AuthContext';
import {
  LearningResource,
  LearningPath,
  LearningResourceType,
  LearningResourceDifficulty,
} from '../../types/learning';
import { Skill } from '../../types/skill';

export const LearningHubPage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const isFaculty = isAuthenticated && user?.role === 'FACULTY';
  const isIndustry = isAuthenticated && user?.role === 'INDUSTRY';
  const isInstitution = isAuthenticated && user?.role === 'INSTITUTION_ADMIN';
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'resources' | 'paths'>('resources');
  const [search, setSearch] = useState('');
  const [selectedSkillId, setSelectedSkillId] = useState('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const canAuthor =
    user?.role === 'FACULTY' ||
    user?.role === 'INDUSTRY' ||
    user?.role === 'SUPER_ADMIN';

  const isStudent = user?.role === 'STUDENT';

  // Fetch skills for filter dropdown
  const { data: skillsData } = useQuery<Skill[]>({
    queryKey: ['skills-filter'],
    queryFn: () => skillApi.listSkills(),
  });

  // Fetch Resources
  const {
    data: resourcesData,
    isLoading: resourcesLoading,
  } = useQuery<PaginatedResponse<LearningResource>>({
    queryKey: [
      'learning-resources',
      search,
      selectedSkillId,
      selectedType,
      selectedDifficulty,
    ],
    queryFn: () =>
      learningApi.getResources({
        search: search || undefined,
        skillId: selectedSkillId || undefined,
        resourceType: (selectedType as LearningResourceType) || undefined,
        difficulty: (selectedDifficulty as LearningResourceDifficulty) || undefined,
      }),
  });

  // Fetch Paths
  const {
    data: pathsData,
    isLoading: pathsLoading,
  } = useQuery<PaginatedResponse<LearningPath>>({
    queryKey: ['learning-paths', search],
    queryFn: () =>
      learningApi.getPaths({
        search: search || undefined,
      }),
  });

  // Student progress mutation
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

  const skills: Skill[] = skillsData || [];
  const resources: LearningResource[] = resourcesData?.items || [];
  const paths: LearningPath[] = pathsData?.items || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-brand-950 to-slate-900 rounded-3xl p-8 text-white mb-8 shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/30 text-xs font-semibold mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            {isInstitution
              ? 'Institution Learning and Development'
              : isIndustry
              ? 'Industry Learning & Professional Development'
              : isFaculty
              ? 'Professional Development & Learning'
              : 'Curated Learning & Skill-Gap Remediation Hub'}
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight mb-3">
            {isInstitution
              ? 'Industry Learning Programmes'
              : isIndustry
              ? 'Share Expertise & Drive Professional Development'
              : isFaculty
              ? 'Advance Your Professional Development'
              : 'Accelerate Your Industry Readiness'}
          </h1>
          <p className="text-slate-300 text-sm leading-relaxed mb-6">
            {isInstitution
              ? 'Discover and coordinate industry-led training, certificate programmes, workshops, and structured learning pathways that support student and faculty skill development.'
              : isIndustry
              ? 'Publish industry-led learning resources, professional training, workshops, certifications, and structured learning pathways that help students and academic communities build relevant skills.'
              : isFaculty
              ? 'Explore industry-led learning, faculty development programs, professional training, certifications, workshops, and structured learning opportunities that strengthen your industry and academic expertise.'
              : 'Explore curated learning modules, interactive labs, and structured curricula published by industry partners and university faculty to bridge your skill gaps.'}
          </p>

          <div className="flex items-center gap-3 flex-wrap">
            {isStudent && (
              <>
                <Link
                  to="/learning/my-learning"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-md transition-colors"
                >
                  <GraduationCap className="w-4 h-4" />
                  My Learning Dashboard
                </Link>
                <Link
                  to="/learning/remediation"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/20 transition-colors"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  Bridge My Skill Gaps
                </Link>
              </>
            )}

            {canAuthor && (
              <button
                onClick={() => setIsCreateOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-md transition-colors"
              >
                <Plus className="w-4 h-4" />
                Publish Learning Resource
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs & Search Filter Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-6 shadow-sm">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pb-4 border-b border-slate-100">
          {/* Tabs */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <button
              onClick={() => setActiveTab('resources')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'resources'
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              {isInstitution
                ? `Learning Programmes (${resources.length})`
                : `Learning Resources (${resources.length})`}
            </button>
            <button
              onClick={() => setActiveTab('paths')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'paths'
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Compass className="w-4 h-4" />
              {isInstitution
                ? `Learning Pathways (${paths.length})`
                : isIndustry || isFaculty
                ? `Professional Learning Paths (${paths.length})`
                : `Structured Paths (${paths.length})`}
            </button>
          </div>

          {/* Search input */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={
                isInstitution
                  ? 'Search by programme, provider, domain, or keyword...'
                  : isIndustry
                  ? 'Search by topic, expertise, provider, or keyword...'
                  : isFaculty
                  ? 'Search by topic, provider, expertise, or keyword...'
                  : 'Search by topic, provider, keyword...'
              }
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>

        {/* Filter Bar for Resources */}
        {activeTab === 'resources' && (
          <div className="flex items-center gap-3 flex-wrap pt-3">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
              <Layers className="w-3.5 h-3.5" />
              <span>Filters:</span>
            </div>

            <select
              value={selectedSkillId}
              onChange={(e) => setSelectedSkillId(e.target.value)}
              className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              <option value="">
                {isInstitution
                  ? 'All Skills / Domains'
                  : isIndustry || isFaculty
                  ? 'All Skills & Expertise'
                  : 'All Skills'}
              </option>
              {skills.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>

            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              <option value="">
                {isInstitution
                  ? 'All Programme Types'
                  : isIndustry || isFaculty
                  ? 'All Learning Types'
                  : 'All Resource Types'}
              </option>
              <option value="ARTICLE">Articles &amp; Docs</option>
              <option value="VIDEO">Video Tutorials</option>
              <option value="INTERACTIVE_LAB">Interactive Labs</option>
              <option value="PRACTICE_PROJECT">Practice Projects</option>
              <option value="COURSE">Complete Courses</option>
            </select>

            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              <option value="">{isInstitution ? 'All Levels' : 'All Difficulties'}</option>
              <option value="BEGINNER">Beginner</option>
              <option value="INTERMEDIATE">Intermediate</option>
              <option value="ADVANCED">Advanced</option>
              <option value="EXPERT">Expert</option>
            </select>

            {(selectedSkillId || selectedType || selectedDifficulty || search) && (
              <button
                onClick={() => {
                  setSelectedSkillId('');
                  setSelectedType('');
                  setSelectedDifficulty('');
                  setSearch('');
                }}
                className="text-xs text-brand-600 hover:text-brand-800 font-semibold underline ml-auto"
              >
                Reset Filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Main Content Area */}
      {activeTab === 'resources' ? (
        resourcesLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-56 rounded-2xl bg-white border border-slate-100 p-6 animate-pulse"
              />
            ))}
          </div>
        ) : resources.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {resources.map((resource: LearningResource) => (
              <LearningResourceCard
                key={resource.id}
                resource={resource}
                onSave={(id) =>
                  progressMutation.mutate({ resourceId: id, status: 'SAVED' })
                }
                onComplete={(id) =>
                  progressMutation.mutate({ resourceId: id, status: 'COMPLETED' })
                }
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
            <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="font-bold text-slate-800 text-base mb-1">
              {isInstitution
                ? 'No learning programmes found'
                : isIndustry
                ? 'No industry learning resources found'
                : isFaculty
                ? 'No professional learning resources found'
                : 'No learning resources found'}
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
              {isInstitution
                ? 'No industry learning programmes currently match your selected filters.'
                : isIndustry
                ? 'Try adjusting your search or learning filters to explore available professional development content.'
                : isFaculty
                ? 'Try adjusting your search or learning filters to explore available professional development opportunities.'
                : 'Try adjusting your search criteria or clear the filters to explore available topics.'}
            </p>
          </div>
        )
      ) : pathsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-64 rounded-2xl bg-white border border-slate-100 p-6 animate-pulse"
            />
          ))}
        </div>
      ) : paths.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {paths.map((path: LearningPath) => (
            <LearningPathCard key={path.id} path={path} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
          <Compass className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-slate-800 text-base mb-1">
            {isInstitution
              ? 'No learning programmes found'
              : isIndustry || isFaculty
              ? 'No professional learning paths found'
              : 'No structured learning paths found'}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
            {isInstitution
              ? 'No industry learning programmes currently match your selected filters.'
              : isIndustry
              ? 'Professional development curricula and learning roadmaps will appear here once published.'
              : isFaculty
              ? 'Curricula and roadmaps for professional development will appear here once published.'
              : 'Curricula and roadmaps for career roles will appear here once published.'}
          </p>
        </div>
      )}

      {/* Authoring modal */}
      <CreateResourceModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={() => {
          queryClient.invalidateQueries({ queryKey: ['learning-resources'] });
        }}
      />
    </div>
  );
};

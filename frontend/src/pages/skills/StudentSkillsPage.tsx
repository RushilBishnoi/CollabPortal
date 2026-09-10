import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { skillApi } from '../../lib/skill-api';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ProficiencyLevel, Skill } from '../../types/skill';
import {
  Sparkles,
  Search,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Award,
  Layers,
  ArrowLeft,
} from 'lucide-react';

const PROFICIENCY_CONFIG: Record<
  ProficiencyLevel,
  { label: string; levelNum: number; color: string; badgeBg: string; text: string }
> = {
  BEGINNER: {
    label: 'Beginner',
    levelNum: 1,
    color: 'bg-blue-500',
    badgeBg: 'bg-blue-50 border-blue-200 text-blue-700',
    text: 'Foundational concept familiarity',
  },
  INTERMEDIATE: {
    label: 'Intermediate',
    levelNum: 2,
    color: 'bg-emerald-500',
    badgeBg: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    text: 'Hands-on practical development experience',
  },
  ADVANCED: {
    label: 'Advanced',
    levelNum: 3,
    color: 'bg-indigo-500',
    badgeBg: 'bg-indigo-50 border-indigo-200 text-indigo-700',
    text: 'Production-grade depth and independent delivery',
  },
  EXPERT: {
    label: 'Expert',
    levelNum: 4,
    color: 'bg-purple-600',
    badgeBg: 'bg-purple-50 border-purple-200 text-purple-700',
    text: 'System architecture, optimization, and mentoring',
  },
};

export const StudentSkillsPage: React.FC = () => {
  const queryClient = useQueryClient();

  // State for search and filtering
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  const [selectedProficiency, setSelectedProficiency] = useState<ProficiencyLevel>('INTERMEDIATE');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Debounce search query by 300ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Queries
  const { data: mySkillsData, isLoading: isLoadingMySkills, isError: isErrorMySkills } = useQuery({
    queryKey: ['mySkills'],
    queryFn: skillApi.getMySkills,
  });

  const { data: categories = [], isLoading: isLoadingCategories } = useQuery({
    queryKey: ['skillCategories'],
    queryFn: skillApi.listCategories,
  });

  // Fetch search results when debounced query is >= 2 characters
  const { data: searchResults = [], isFetching: isSearching } = useQuery({
    queryKey: ['skillSearch', debouncedQuery],
    queryFn: () => skillApi.searchSkills(debouncedQuery),
    enabled: debouncedQuery.length >= 2,
  });

  // Fetch category skills when a category is selected (and search is empty)
  const { data: categorySkills = [], isFetching: isLoadingCategorySkills } = useQuery({
    queryKey: ['categorySkills', selectedCategoryId],
    queryFn: () => skillApi.listSkills(selectedCategoryId),
    enabled: !!selectedCategoryId && debouncedQuery.length < 2,
  });

  // Mutations
  const addSkillMutation = useMutation({
    mutationFn: skillApi.addSkill,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['mySkills'] });
      setSelectedSkill(null);
      setSearchQuery('');
      setMessage({ type: 'success', text: `Added '${data.skill?.name || 'Skill'}' to your profile!` });
      setTimeout(() => setMessage(null), 3000);
    },
    onError: (err: any) => {
      setMessage({ type: 'error', text: err.message || 'Failed to add skill' });
      setTimeout(() => setMessage(null), 4000);
    },
  });

  const updateProficiencyMutation = useMutation({
    mutationFn: ({ skillId, proficiency }: { skillId: string; proficiency: ProficiencyLevel }) =>
      skillApi.updateSkillProficiency(skillId, { proficiency }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['mySkills'] });
      setMessage({ type: 'success', text: `Updated proficiency for '${data.skill?.name || 'Skill'}'` });
      setTimeout(() => setMessage(null), 3000);
    },
    onError: (err: any) => {
      setMessage({ type: 'error', text: err.message || 'Failed to update proficiency' });
      setTimeout(() => setMessage(null), 4000);
    },
  });

  const removeSkillMutation = useMutation({
    mutationFn: skillApi.removeSkill,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mySkills'] });
      setMessage({ type: 'success', text: 'Skill removed from your profile.' });
      setTimeout(() => setMessage(null), 3000);
    },
    onError: (err: any) => {
      setMessage({ type: 'error', text: err.message || 'Failed to remove skill' });
      setTimeout(() => setMessage(null), 4000);
    },
  });

  if (isLoadingMySkills || isLoadingCategories) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <LoadingSpinner text="Loading your skill profile…" />
      </div>
    );
  }

  if (isErrorMySkills || !mySkillsData) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-red-800 flex items-center gap-3">
        <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0" />
        <div>
          <h3 className="font-bold">Error loading skills</h3>
          <p className="text-sm">Unable to retrieve your skill profile. Please try refreshing.</p>
        </div>
      </div>
    );
  }

  const existingSkills = mySkillsData.skills || [];
  const existingSkillIds = new Set(existingSkills.map((s) => s.skillId));

  const handleAddSkill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSkill) return;

    if (existingSkillIds.has(selectedSkill.id)) {
      setMessage({ type: 'error', text: `Skill '${selectedSkill.name}' is already on your profile.` });
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    addSkillMutation.mutate({
      skillId: selectedSkill.id,
      proficiency: selectedProficiency,
    });
  };

  // Determine available skills to display in selector
  const displayedBrowseSkills =
    debouncedQuery.length >= 2
      ? searchResults
      : selectedCategoryId
        ? categorySkills
        : [];

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 rounded-3xl p-6 sm:p-8 text-white shadow-md">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-blue-200 text-xs font-semibold mb-2">
              <Link to="/portal/student" className="hover:underline flex items-center gap-1">
                <ArrowLeft className="w-3.5 h-3.5" /> Student Portal
              </Link>
              <span>/</span>
              <span>Skill Inventory</span>
            </div>
            <h1 className="text-2xl font-bold flex items-center gap-2.5">
              <Sparkles className="w-6 h-6 text-yellow-300" /> Student Skill Profile
            </h1>
            <p className="text-blue-100 text-sm mt-1 max-w-xl">
              Curate your canonical skills across programming, cloud, databases, and professional competencies.
              Your skill inventory powers live internship matching and deterministic gap analysis.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-4 min-w-[200px] text-center">
            <span className="text-xs font-semibold text-blue-100 uppercase tracking-wider block">
              Documented Skills
            </span>
            <span className="text-3xl font-extrabold">{existingSkills.length}</span>
            <span className="text-[11px] text-blue-100 block mt-0.5">
              {existingSkills.filter((s) => s.verificationStatus === 'VERIFIED').length} Verified
            </span>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {message && (
        <div
          className={`p-4 rounded-xl flex items-center gap-3 text-sm font-medium ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-500" />
          )}
          {message.text}
        </div>
      )}

      {/* Skill Addition Card */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b pb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Plus className="w-5 h-5 text-blue-600" /> Add Canonical Skill
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Search by skill name or browse by domain category from the platform taxonomy.
            </p>
          </div>
        </div>

        <form onSubmit={handleAddSkill} className="space-y-5">
          {/* Search & Category Filter Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Server-Side Search Bar */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Type-Ahead Search (Server Query)
              </label>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="e.g. React, Docker, Python, PostgreSQL..."
                  className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
                {isSearching && (
                  <span className="absolute right-3.5 top-3 text-[11px] text-blue-600 animate-pulse font-medium">
                    Searching…
                  </span>
                )}
              </div>
            </div>

            {/* Category Dropdown */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Browse By Domain Category
              </label>
              <select
                value={selectedCategoryId}
                onChange={(e) => {
                  setSelectedCategoryId(e.target.value);
                  setSearchQuery('');
                }}
                className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white"
              >
                <option value="">-- Select Category to Browse --</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Skill Selection Grid / Results */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Select Skill from Platform Taxonomy:
            </label>

            {displayedBrowseSkills.length === 0 ? (
              <div className="p-6 bg-slate-50 border border-dashed border-slate-300 rounded-2xl text-center">
                <p className="text-xs text-slate-500">
                  {debouncedQuery.length >= 2
                    ? `No skills found matching "${debouncedQuery}". Try another keyword or browse by category.`
                    : selectedCategoryId
                      ? isLoadingCategorySkills
                        ? 'Loading skills in category…'
                        : 'No skills found in this category.'
                      : 'Type a skill name in search or select a category above to view available skills.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 max-h-56 overflow-y-auto p-1">
                {displayedBrowseSkills.map((sk) => {
                  const isAdded = existingSkillIds.has(sk.id);
                  const isSelected = selectedSkill?.id === sk.id;
                  return (
                    <button
                      key={sk.id}
                      type="button"
                      disabled={isAdded}
                      onClick={() => setSelectedSkill(sk)}
                      className={`p-3 rounded-xl border text-left transition-all relative ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50 text-blue-900 shadow-sm ring-1 ring-blue-600'
                          : isAdded
                            ? 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed'
                            : 'border-slate-200 bg-white hover:border-blue-300 hover:bg-slate-50 text-slate-800'
                      }`}
                    >
                      <div className="font-semibold text-xs truncate">{sk.name}</div>
                      <div className="text-[10px] text-slate-500 truncate mt-0.5">
                        {sk.category?.name || 'Canonical'}
                      </div>
                      {isAdded && (
                        <span className="text-[9px] bg-slate-200 text-slate-600 px-1.5 py-0.2 rounded mt-1 inline-block">
                          Added
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Selected Skill & Proficiency Details */}
          {selectedSkill && (
            <div className="p-5 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">
                    Selected Skill
                  </span>
                  <h3 className="text-base font-bold text-slate-900">{selectedSkill.name}</h3>
                  {selectedSkill.description && (
                    <p className="text-xs text-slate-600 mt-0.5">{selectedSkill.description}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  Select Your Proficiency Level:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {(Object.keys(PROFICIENCY_CONFIG) as ProficiencyLevel[]).map((level) => {
                    const cfg = PROFICIENCY_CONFIG[level];
                    const isPicked = selectedProficiency === level;
                    return (
                      <button
                        key={level}
                        type="button"
                        onClick={() => setSelectedProficiency(level)}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          isPicked
                            ? 'border-blue-600 bg-white text-blue-900 shadow-sm ring-2 ring-blue-500'
                            : 'border-slate-200 bg-white/70 hover:bg-white text-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold">{cfg.label}</span>
                          <span className="text-[10px] font-mono text-slate-500">L{cfg.levelNum}</span>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1 line-clamp-2 leading-tight">
                          {cfg.text}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={addSkillMutation.isPending}
                  className="px-6 py-2.5 text-xs font-semibold bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  {addSkillMutation.isPending ? 'Adding to Profile…' : 'Add to My Skill Profile'}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>

      {/* Existing Skills Inventory Showcase */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b pb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-600" /> My Current Skills ({existingSkills.length})
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Self-reported skills and verified proficiencies registered to your student profile.
            </p>
          </div>
        </div>

        {existingSkills.length === 0 ? (
          <div className="p-12 text-center bg-slate-50 border border-dashed border-slate-300 rounded-2xl">
            <Award className="w-10 h-10 text-slate-400 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-700">No Skills Added Yet</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Add your technical, design, database, and soft skills using the canonical taxonomy search above to qualify for internships.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {existingSkills.map((item) => {
              const cfg = PROFICIENCY_CONFIG[item.proficiency] || PROFICIENCY_CONFIG.BEGINNER;
              return (
                <div
                  key={item.id}
                  className="border border-slate-200 rounded-2xl p-5 hover:border-slate-300 transition-all bg-white flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="font-bold text-sm text-slate-900">{item.skill?.name}</h4>
                        <span className="text-[11px] text-slate-500 block mt-0.5">
                          {item.skill?.category?.name || 'General'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${cfg.badgeBg}`}
                        >
                          {cfg.label}
                        </span>
                        <button
                          onClick={() => removeSkillMutation.mutate(item.skillId)}
                          disabled={removeSkillMutation.isPending}
                          className="text-slate-400 hover:text-red-600 p-1 transition-colors"
                          title="Remove skill"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {item.skill?.description && (
                      <p className="text-xs text-slate-600 mt-2 line-clamp-2">{item.skill.description}</p>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">
                        {item.source}
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                          item.verificationStatus === 'VERIFIED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {item.verificationStatus}
                      </span>
                    </div>

                    {/* Inline Proficiency Update Dropdown */}
                    <div className="flex items-center gap-1.5">
                      <label className="text-[10px] text-slate-500 font-medium">Proficiency:</label>
                      <select
                        value={item.proficiency}
                        onChange={(e) =>
                          updateProficiencyMutation.mutate({
                            skillId: item.skillId,
                            proficiency: e.target.value as ProficiencyLevel,
                          })
                        }
                        className="text-xs border border-slate-300 rounded-lg px-2 py-1 bg-white outline-none font-medium text-slate-700"
                      >
                        <option value="BEGINNER">Beginner (L1)</option>
                        <option value="INTERMEDIATE">Intermediate (L2)</option>
                        <option value="ADVANCED">Advanced (L3)</option>
                        <option value="EXPERT">Expert (L4)</option>
                      </select>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  AlertTriangle,
  Building2,
} from 'lucide-react';
import { opportunityApi } from '../../lib/opportunity-api';
import { apiClient } from '../../lib/api-client';

interface SkillOption {
  id: string;
  name: string;
  category?: { name: string };
}

interface LocalSkillRequirement {
  skillId: string;
  skillName: string;
  requiredProficiency: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';
  weight: number;
  isMandatory: boolean;
}

export const CreateEditOpportunityPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = !!id;

  // Form State
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [opportunityType, setOpportunityType] = useState('INTERNSHIP');
  const [status, setStatus] = useState('PUBLISHED');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('Remote');
  const [isRemote, setIsRemote] = useState(true);
  const [stipend, setStipend] = useState<number | ''>('');
  const [stipendPeriod, setStipendPeriod] = useState('MONTHLY');
  const [minCgpa, setMinCgpa] = useState<number | ''>('');
  const [minGraduationYear, setMinGraduationYear] = useState<number | ''>('');
  const [maxGraduationYear, setMaxGraduationYear] = useState<number | ''>('');
  const [departmentsInput, setDepartmentsInput] = useState('');
  const [positionsCount, setPositionsCount] = useState<number>(1);
  const [selectedSkills, setSelectedSkills] = useState<LocalSkillRequirement[]>([]);

  // Skill selector state
  const [newSkillId, setNewSkillId] = useState('');
  const [newSkillProficiency, setNewSkillProficiency] = useState<'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT'>('INTERMEDIATE');

  // Load canonical skills taxonomy
  const { data: canonicalSkills = [] } = useQuery<SkillOption[]>({
    queryKey: ['canonical-skills-list'],
    queryFn: async () => {
      const res = await apiClient.get<any>('/skills');
      return Array.isArray(res) ? res : res.data || [];
    },
  });

  // Load existing opportunity if editing
  const { data: existingOpp, isLoading: isLoadingOpp } = useQuery({
    queryKey: ['industry-posting-detail', id],
    queryFn: () => opportunityApi.getMyPostingById(id!),
    enabled: isEditing,
  });

  useEffect(() => {
    if (existingOpp) {
      setTitle(existingOpp.title);
      setSlug(existingOpp.slug);
      setOpportunityType(existingOpp.opportunityType);
      setStatus(existingOpp.status);
      setDescription(existingOpp.description);
      setLocation(existingOpp.location);
      setIsRemote(existingOpp.isRemote);
      setStipend(existingOpp.stipend ?? '');
      setStipendPeriod(existingOpp.stipendPeriod || 'MONTHLY');
      setMinCgpa(existingOpp.minCgpa ?? '');
      setMinGraduationYear(existingOpp.minGraduationYear ?? '');
      setMaxGraduationYear(existingOpp.maxGraduationYear ?? '');
      setDepartmentsInput((existingOpp.eligibleDepartments || []).join(', '));
      setPositionsCount(existingOpp.positionsCount || 1);

      if (existingOpp.skills) {
        setSelectedSkills(
          existingOpp.skills.map((s: any) => ({
            skillId: s.skillId,
            skillName: s.skill.name,
            requiredProficiency: s.requiredProficiency,
            weight: s.weight || 1.0,
            isMandatory: s.isMandatory ?? true,
          })),
        );
      }
    }
  }, [existingOpp]);

  // Title -> Slug auto generation
  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!isEditing) {
      setSlug(
        val
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)+/g, ''),
      );
    }
  };

  const handleAddSkill = () => {
    if (!newSkillId) return;
    const skillObj = canonicalSkills.find((s) => s.id === newSkillId);
    if (!skillObj) return;

    if (selectedSkills.some((s) => s.skillId === newSkillId)) {
      return;
    }

    setSelectedSkills([
      ...selectedSkills,
      {
        skillId: skillObj.id,
        skillName: skillObj.name,
        requiredProficiency: newSkillProficiency,
        weight: 1.0,
        isMandatory: true,
      },
    ]);

    setNewSkillId('');
  };

  const handleRemoveSkill = (skillId: string) => {
    setSelectedSkills(selectedSkills.filter((s) => s.skillId !== skillId));
  };

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const eligibleDepartments = departmentsInput
        .split(',')
        .map((d) => d.trim())
        .filter(Boolean);

      const payload = {
        title,
        slug,
        opportunityType,
        status,
        description,
        location,
        isRemote,
        stipend: stipend !== '' ? Number(stipend) : undefined,
        stipendPeriod,
        minCgpa: minCgpa !== '' ? Number(minCgpa) : undefined,
        minGraduationYear: minGraduationYear !== '' ? Number(minGraduationYear) : undefined,
        maxGraduationYear: maxGraduationYear !== '' ? Number(maxGraduationYear) : undefined,
        eligibleDepartments,
        positionsCount: Number(positionsCount) || 1,
        skills: selectedSkills.map((s) => ({
          skillId: s.skillId,
          requiredProficiency: s.requiredProficiency,
          weight: s.weight,
          isMandatory: s.isMandatory,
        })),
      };

      if (isEditing) {
        return opportunityApi.updatePosting(id!, payload);
      }
      return opportunityApi.createPosting(payload);
    },
    onSuccess: () => {
      navigate('/portal/industry/opportunities');
    },
    onError: (err: any) => {
      setErrorMsg(err.message || 'Failed to save opportunity posting');
    },
  });

  if (isEditing && isLoadingOpp) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-500">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="text-sm font-medium">Loading opportunity details...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Back link */}
      <div>
        <Link
          to="/portal/industry/opportunities"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to My Opportunities
        </Link>
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <Building2 className="w-6 h-6 text-blue-600" />
            {isEditing ? 'Edit Corporate Opportunity' : 'Create New Corporate Opportunity'}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Define canonical skill requirements and prerequisite eligibility filters for deterministic student matching.
          </p>
        </div>

        {errorMsg && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3 text-red-800 text-xs">
            <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            setErrorMsg(null);
            saveMutation.mutate();
          }}
          className="space-y-6"
        >
          {/* Section 1: Basic Information */}
          <div className="space-y-4 pt-2">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
              1. Basic Role Information
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-bold text-slate-700">Opportunity Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Frontend Engineering Summer Internship"
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">URL Slug *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. frontend-engineering-summer-internship"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Opportunity Type *</label>
                <select
                  value={opportunityType}
                  onChange={(e) => setOpportunityType(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                >
                  <option value="INTERNSHIP">Internship</option>
                  <option value="JOB">Full-Time Job</option>
                  <option value="APPRENTICESHIP">Apprenticeship</option>
                  <option value="LIVE_PROJECT">Live Project</option>
                </select>
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-bold text-slate-700">Role Description &amp; Responsibilities *</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Describe the opportunity responsibilities, learning outcomes, and squad mission..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Location & Compensation */}
          <div className="space-y-4 pt-2">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
              2. Location &amp; Compensation
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-bold text-slate-700">Location / City</label>
                <input
                  type="text"
                  placeholder="e.g. Bengaluru, Karnataka or Remote"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
              </div>

              <div className="flex items-center gap-2 pt-6">
                <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-bold text-slate-700">
                  <input
                    type="checkbox"
                    checked={isRemote}
                    onChange={(e) => setIsRemote(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                  />
                  <span>100% Remote Role</span>
                </label>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Stipend Amount (INR)</label>
                <input
                  type="number"
                  placeholder="e.g. 25000"
                  value={stipend}
                  onChange={(e) => setStipend(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Compensation Schedule</label>
                <select
                  value={stipendPeriod}
                  onChange={(e) => setStipendPeriod(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                >
                  <option value="MONTHLY">Monthly</option>
                  <option value="LUMPSUM">Lump Sum</option>
                  <option value="ANNUAL">Annual (LPA)</option>
                  <option value="UNPAID">Unpaid</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Positions Count</label>
                <input
                  type="number"
                  min={1}
                  value={positionsCount}
                  onChange={(e) => setPositionsCount(Number(e.target.value) || 1)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Hard Academic Eligibility Gates */}
          <div className="space-y-4 pt-2">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
              3. Hard Academic Eligibility Requirements
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Minimum CGPA (0.0 - 10.0)</label>
                <input
                  type="number"
                  step="0.1"
                  min={0}
                  max={10}
                  placeholder="e.g. 7.5 (optional)"
                  value={minCgpa}
                  onChange={(e) => setMinCgpa(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Earliest Grad Year</label>
                <input
                  type="number"
                  placeholder="e.g. 2025"
                  value={minGraduationYear}
                  onChange={(e) => setMinGraduationYear(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Latest Grad Year</label>
                <input
                  type="number"
                  placeholder="e.g. 2027"
                  value={maxGraduationYear}
                  onChange={(e) => setMaxGraduationYear(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-3">
                <label className="text-xs font-bold text-slate-700">
                  Eligible Departments (Comma-separated, leave blank for all)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Computer Science, Information Technology, CSE, IT"
                  value={departmentsInput}
                  onChange={(e) => setDepartmentsInput(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Canonical Skill Requirements */}
          <div className="space-y-4 pt-2">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
              4. Canonical Skill Requirements
            </h2>

            {/* Add Skill Form Row */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-[11px] font-bold text-slate-700">Select Canonical Skill</label>
                  <select
                    value={newSkillId}
                    onChange={(e) => setNewSkillId(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-- Choose skill from taxonomy --</option>
                    {canonicalSkills.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} {s.category ? `(${s.category.name})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700">Required Level</label>
                  <select
                    value={newSkillProficiency}
                    onChange={(e) => setNewSkillProficiency(e.target.value as any)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="BEGINNER">BEGINNER</option>
                    <option value="INTERMEDIATE">INTERMEDIATE</option>
                    <option value="ADVANCED">ADVANCED</option>
                    <option value="EXPERT">EXPERT</option>
                  </select>
                </div>
              </div>

              <button
                type="button"
                onClick={handleAddSkill}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-slate-700 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Add Skill Requirement
              </button>
            </div>

            {/* Selected Skills List */}
            {selectedSkills.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No skill requirements attached yet.</p>
            ) : (
              <div className="space-y-2">
                {selectedSkills.map((s) => (
                  <div
                    key={s.skillId}
                    className="flex items-center justify-between p-3 rounded-xl bg-blue-50/60 border border-blue-100 text-xs"
                  >
                    <div>
                      <span className="font-bold text-slate-900">{s.skillName}</span>
                      <span className="ml-2 px-2 py-0.5 bg-blue-200/70 text-blue-800 font-bold rounded text-[10px]">
                        Required: {s.requiredProficiency}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(s.skillId)}
                      className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit CTA */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <Link
              to="/portal/industry/opportunities"
              className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saveMutation.isPending}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saveMutation.isPending ? 'Saving Posting...' : isEditing ? 'Update Opportunity' : 'Publish Opportunity'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

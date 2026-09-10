import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { profileApi } from '../../lib/profile-api';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import {
  User,
  GraduationCap,
  Briefcase,
  FolderGit2,
  Award,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

export const StudentProfilePage: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'personal' | 'academic' | 'career' | 'projects' | 'certifications'>('personal');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Queries
  const { data: profileResponse, isLoading, isError } = useQuery({
    queryKey: ['studentProfileMe'],
    queryFn: profileApi.getStudentProfileMe,
  });

  const { data: institutions = [] } = useQuery({
    queryKey: ['institutionsList'],
    queryFn: profileApi.listInstitutions,
  });

  // Profile Mutation
  const updateProfileMutation = useMutation({
    mutationFn: profileApi.updateStudentProfileMe,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['studentProfileMe'] });
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      setTimeout(() => setMessage(null), 3000);
    },
    onError: (error: any) => {
      setMessage({ type: 'error', text: error.message || 'Failed to update profile' });
    },
  });

  // Project Mutations
  const [newProject, setNewProject] = useState({ title: '', description: '', repoUrl: '', demoUrl: '', techString: '' });
  const addProjectMutation = useMutation({
    mutationFn: (data: any) => profileApi.addStudentProject(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['studentProfileMe'] });
      setNewProject({ title: '', description: '', repoUrl: '', demoUrl: '', techString: '' });
      setMessage({ type: 'success', text: 'Project added!' });
      setTimeout(() => setMessage(null), 3000);
    },
  });

  const deleteProjectMutation = useMutation({
    mutationFn: profileApi.deleteStudentProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['studentProfileMe'] });
    },
  });

  // Certification Mutations
  const [newCert, setNewCert] = useState({ name: '', issuingOrganization: '', issueDate: '', credentialUrl: '', credentialId: '' });
  const addCertMutation = useMutation({
    mutationFn: (data: any) => profileApi.addStudentCertification(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['studentProfileMe'] });
      setNewCert({ name: '', issuingOrganization: '', issueDate: '', credentialUrl: '', credentialId: '' });
      setMessage({ type: 'success', text: 'Certification added!' });
      setTimeout(() => setMessage(null), 3000);
    },
  });

  const deleteCertMutation = useMutation({
    mutationFn: profileApi.deleteStudentCertification,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['studentProfileMe'] });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <LoadingSpinner text="Loading your student profile…" />
      </div>
    );
  }

  if (isError || !profileResponse) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-red-800 flex items-center gap-3">
        <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0" />
        <div>
          <h3 className="font-bold">Error loading profile</h3>
          <p className="text-sm">Unable to retrieve student profile. Please try refreshing.</p>
        </div>
      </div>
    );
  }

  const { profile, completenessScore, completenessBreakdown } = profileResponse;

  const handleUpdate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data: any = {};

    formData.forEach((value, key) => {
      if (value !== '') {
        if (key === 'graduationYear' || key === 'cgpa') {
          data[key] = Number(value);
        } else if (key === 'careerInterests' || key === 'preferredRoles' || key === 'preferredLocations') {
          data[key] = String(value).split(',').map((s) => s.trim()).filter(Boolean);
        } else {
          data[key] = value;
        }
      }
    });

    updateProfileMutation.mutate(data);
  };

  const handleAddProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProject.title || !newProject.description) return;
    addProjectMutation.mutate({
      title: newProject.title,
      description: newProject.description,
      repoUrl: newProject.repoUrl || undefined,
      demoUrl: newProject.demoUrl || undefined,
      technologies: newProject.techString.split(',').map((s) => s.trim()).filter(Boolean),
    });
  };

  const handleAddCert = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCert.name || !newCert.issuingOrganization || !newCert.issueDate) return;
    addCertMutation.mutate({
      name: newCert.name,
      issuingOrganization: newCert.issuingOrganization,
      issueDate: newCert.issueDate,
      credentialUrl: newCert.credentialUrl || undefined,
      credentialId: newCert.credentialId || undefined,
    });
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 rounded-3xl p-6 sm:p-8 text-white shadow-md">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur border border-white/30 flex items-center justify-center text-3xl font-bold overflow-hidden shadow-inner">
              {profile.avatarUrl ? (
                <img src={profile.avatarUrl} alt={profile.fullName} className="w-full h-full object-cover" />
              ) : (
                profile.fullName.charAt(0).toUpperCase()
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold">{profile.fullName}</h1>
              <p className="text-blue-100 text-sm flex items-center gap-2 mt-0.5">
                <GraduationCap className="w-4 h-4" />
                {profile.degree || 'Degree not set'} — {profile.department || 'Department not set'}
              </p>
              <p className="text-blue-200 text-xs mt-1">
                {profile.institution?.name || 'Institution not linked'} {profile.graduationYear ? `(Class of ${profile.graduationYear})` : ''}
              </p>
            </div>
          </div>

          {/* Completeness Card */}
          <div className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-4 min-w-[240px]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-blue-100 uppercase tracking-wider">Profile Completeness</span>
              <span className="text-lg font-bold">{completenessScore}%</span>
            </div>
            <div className="w-full bg-black/20 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-emerald-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${completenessScore}%` }}
              />
            </div>
            <p className="text-[11px] text-blue-100 mt-2">
              Complete profile to maximize internship matching eligibility.
            </p>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {message && (
        <div
          className={`p-4 rounded-xl flex items-center gap-3 text-sm font-medium ${
            message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {message.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <AlertCircle className="w-5 h-5 text-red-500" />}
          {message.text}
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 overflow-x-auto gap-2">
        <button
          onClick={() => setActiveTab('personal')}
          className={`py-3 px-4 text-sm font-medium border-b-2 whitespace-nowrap transition-colors flex items-center gap-2 ${
            activeTab === 'personal' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <User className="w-4 h-4" /> Personal Info ({completenessBreakdown.basicInfo}/20)
        </button>
        <button
          onClick={() => setActiveTab('academic')}
          className={`py-3 px-4 text-sm font-medium border-b-2 whitespace-nowrap transition-colors flex items-center gap-2 ${
            activeTab === 'academic' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <GraduationCap className="w-4 h-4" /> Academic Info ({completenessBreakdown.education}/30)
        </button>
        <button
          onClick={() => setActiveTab('career')}
          className={`py-3 px-4 text-sm font-medium border-b-2 whitespace-nowrap transition-colors flex items-center gap-2 ${
            activeTab === 'career' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Briefcase className="w-4 h-4" /> Preferences ({completenessBreakdown.careerPreferences}/20)
        </button>
        <button
          onClick={() => setActiveTab('projects')}
          className={`py-3 px-4 text-sm font-medium border-b-2 whitespace-nowrap transition-colors flex items-center gap-2 ${
            activeTab === 'projects' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <FolderGit2 className="w-4 h-4" /> Projects ({profile.projects.length})
        </button>
        <button
          onClick={() => setActiveTab('certifications')}
          className={`py-3 px-4 text-sm font-medium border-b-2 whitespace-nowrap transition-colors flex items-center gap-2 ${
            activeTab === 'certifications' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Award className="w-4 h-4" /> Certifications ({profile.certifications.length})
        </button>
        <Link
          to="/profile/student/skills"
          className="py-3 px-4 text-sm font-semibold border-b-2 border-transparent text-indigo-600 hover:text-indigo-800 whitespace-nowrap transition-colors flex items-center gap-2"
        >
          <Sparkles className="w-4 h-4 text-yellow-500" /> Skills Inventory →
        </Link>
      </div>

      {/* Tab Contents */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm">
        {activeTab === 'personal' && (
          <form onSubmit={handleUpdate} className="space-y-5">
            <h2 className="text-lg font-bold text-slate-900 border-b pb-3">Personal &amp; Contact Details</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  name="fullName"
                  defaultValue={profile.fullName}
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
                <input
                  type="text"
                  name="phoneNumber"
                  defaultValue={profile.phoneNumber || ''}
                  placeholder="+91 9876543210"
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Avatar Image URL</label>
              <input
                type="text"
                name="avatarUrl"
                defaultValue={profile.avatarUrl || ''}
                placeholder="https://example.com/photo.jpg"
                className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Short Bio</label>
              <textarea
                name="bio"
                rows={3}
                defaultValue={profile.bio || ''}
                placeholder="Brief summary of your academic background and aspirations..."
                className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={updateProfileMutation.isPending}
                className="px-6 py-2.5 text-sm font-semibold bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50"
              >
                {updateProfileMutation.isPending ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </form>
        )}

        {activeTab === 'academic' && (
          <form onSubmit={handleUpdate} className="space-y-5">
            <h2 className="text-lg font-bold text-slate-900 border-b pb-3">Academic &amp; Institutional Profile</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Institution</label>
                <select
                  name="institutionId"
                  defaultValue={profile.institutionId || ''}
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                >
                  <option value="">Select Institution</option>
                  {institutions.map((inst) => (
                    <option key={inst.id} value={inst.id}>
                      {inst.name} ({inst.city || 'Campus'})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Degree / Program</label>
                <input
                  type="text"
                  name="degree"
                  defaultValue={profile.degree || ''}
                  placeholder="e.g. B.Tech / M.Sc"
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Branch / Department</label>
                <input
                  type="text"
                  name="department"
                  defaultValue={profile.department || ''}
                  placeholder="Computer Science & Engineering"
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Graduation Year</label>
                <input
                  type="number"
                  name="graduationYear"
                  defaultValue={profile.graduationYear || 2026}
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">CGPA / Percentage</label>
                <input
                  type="number"
                  step="0.01"
                  name="cgpa"
                  defaultValue={profile.cgpa || ''}
                  placeholder="8.5"
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>
            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={updateProfileMutation.isPending}
                className="px-6 py-2.5 text-sm font-semibold bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50"
              >
                {updateProfileMutation.isPending ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </form>
        )}

        {activeTab === 'career' && (
          <form onSubmit={handleUpdate} className="space-y-5">
            <h2 className="text-lg font-bold text-slate-900 border-b pb-3">Career Aspirations &amp; Preferences</h2>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Career Interests (comma separated)</label>
              <input
                type="text"
                name="careerInterests"
                defaultValue={profile.careerInterests?.join(', ') || ''}
                placeholder="Web Engineering, Cloud Systems, Open Source"
                className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Preferred Roles (comma separated)</label>
              <input
                type="text"
                name="preferredRoles"
                defaultValue={profile.preferredRoles?.join(', ') || ''}
                placeholder="Full Stack Engineer, Backend Developer, Frontend Developer"
                className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Preferred Locations (comma separated)</label>
              <input
                type="text"
                name="preferredLocations"
                defaultValue={profile.preferredLocations?.join(', ') || ''}
                placeholder="Bengaluru, Remote, Hyderabad"
                className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={updateProfileMutation.isPending}
                className="px-6 py-2.5 text-sm font-semibold bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50"
              >
                {updateProfileMutation.isPending ? 'Saving…' : 'Save Preferences'}
              </button>
            </div>
          </form>
        )}

        {activeTab === 'projects' && (
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-slate-900 border-b pb-3">Projects Showcase</h2>

            {/* List */}
            <div className="space-y-3">
              {profile.projects.length === 0 ? (
                <p className="text-xs text-slate-500 italic">No projects added yet.</p>
              ) : (
                profile.projects.map((proj) => (
                  <div key={proj.id} className="border border-slate-200 rounded-2xl p-4 flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">{proj.title}</h4>
                      <p className="text-xs text-slate-600 mt-1">{proj.description}</p>
                      {proj.technologies?.length > 0 && (
                        <div className="flex gap-1.5 flex-wrap mt-2">
                          {proj.technologies.map((t) => (
                            <span key={t} className="text-[10px] bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md font-mono text-slate-700">
                              {t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => deleteProjectMutation.mutate(proj.id)}
                      className="text-slate-400 hover:text-red-600 p-1 transition-colors"
                      title="Delete project"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Add Form */}
            <form onSubmit={handleAddProject} className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Plus className="w-4 h-4 text-blue-600" /> Add New Project
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Project Title *"
                  value={newProject.title}
                  onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
                  className="px-3.5 py-2 text-sm border border-slate-300 rounded-xl outline-none"
                  required
                />
                <input
                  type="text"
                  placeholder="Technologies (comma separated)"
                  value={newProject.techString}
                  onChange={(e) => setNewProject({ ...newProject, techString: e.target.value })}
                  className="px-3.5 py-2 text-sm border border-slate-300 rounded-xl outline-none"
                />
              </div>
              <textarea
                placeholder="Project Description *"
                value={newProject.description}
                onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                rows={2}
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl outline-none"
                required
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={addProjectMutation.isPending}
                  className="px-5 py-2 text-xs font-semibold bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                >
                  Add Project
                </button>
              </div>
            </form>
          </div>
        )}

        {activeTab === 'certifications' && (
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-slate-900 border-b pb-3">Certifications &amp; Credentials</h2>

            {/* List */}
            <div className="space-y-3">
              {profile.certifications.length === 0 ? (
                <p className="text-xs text-slate-500 italic">No certifications added yet.</p>
              ) : (
                profile.certifications.map((cert) => (
                  <div key={cert.id} className="border border-slate-200 rounded-2xl p-4 flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">{cert.name}</h4>
                      <p className="text-xs text-slate-600 mt-0.5">
                        Issued by <span className="font-semibold text-slate-800">{cert.issuingOrganization}</span> on{' '}
                        {new Date(cert.issueDate).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={() => deleteCertMutation.mutate(cert.id)}
                      className="text-slate-400 hover:text-red-600 p-1 transition-colors"
                      title="Delete certification"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Add Form */}
            <form onSubmit={handleAddCert} className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Plus className="w-4 h-4 text-blue-600" /> Add New Certification
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <input
                  type="text"
                  placeholder="Certification Name *"
                  value={newCert.name}
                  onChange={(e) => setNewCert({ ...newCert, name: e.target.value })}
                  className="px-3.5 py-2 text-sm border border-slate-300 rounded-xl outline-none"
                  required
                />
                <input
                  type="text"
                  placeholder="Issuing Organization *"
                  value={newCert.issuingOrganization}
                  onChange={(e) => setNewCert({ ...newCert, issuingOrganization: e.target.value })}
                  className="px-3.5 py-2 text-sm border border-slate-300 rounded-xl outline-none"
                  required
                />
                <input
                  type="date"
                  value={newCert.issueDate}
                  onChange={(e) => setNewCert({ ...newCert, issueDate: e.target.value })}
                  className="px-3.5 py-2 text-sm border border-slate-300 rounded-xl outline-none bg-white"
                  required
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={addCertMutation.isPending}
                  className="px-5 py-2 text-xs font-semibold bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                >
                  Add Certification
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { profileApi } from '../../lib/profile-api';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { BookOpen, CheckCircle2, AlertCircle } from 'lucide-react';

export const FacultyProfilePage: React.FC = () => {
  const queryClient = useQueryClient();
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const { data: profile, isLoading, isError } = useQuery({
    queryKey: ['facultyProfileMe'],
    queryFn: profileApi.getFacultyProfileMe,
  });

  const { data: institutions = [] } = useQuery({
    queryKey: ['institutionsList'],
    queryFn: profileApi.listInstitutions,
  });

  const updateMutation = useMutation({
    mutationFn: profileApi.updateFacultyProfileMe,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['facultyProfileMe'] });
      setMessage({ type: 'success', text: 'Faculty profile updated successfully!' });
      setTimeout(() => setMessage(null), 3000);
    },
    onError: (err: any) => {
      setMessage({ type: 'error', text: err.message || 'Update failed' });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <LoadingSpinner text="Loading faculty profile…" />
      </div>
    );
  }

  if (isError || !profile) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-red-800 flex items-center gap-3">
        <AlertCircle className="w-6 h-6 text-red-500" />
        <div>
          <h3 className="font-bold">Error loading faculty profile</h3>
          <p className="text-sm">Unable to load profile information.</p>
        </div>
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data: any = {};

    formData.forEach((value, key) => {
      if (value !== '') {
        if (key === 'areasOfExpertise' || key === 'researchInterests' || key === 'industryInterests') {
          data[key] = String(value).split(',').map((s) => s.trim()).filter(Boolean);
        } else {
          data[key] = value;
        }
      }
    });

    updateMutation.mutate(data);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-3xl p-6 sm:p-8 text-white shadow-md">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-2xl font-bold">
            <BookOpen className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{profile.fullName}</h1>
            <p className="text-emerald-100 text-sm">{profile.designation || 'Faculty Member'} — {profile.department || 'Department'}</p>
            <p className="text-emerald-200 text-xs">{profile.institution?.name || 'Institution not set'}</p>
          </div>
        </div>
      </div>

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

      <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900 border-b pb-3">Academic &amp; Professional Profile</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
            <input
              type="text"
              name="fullName"
              defaultValue={profile.fullName}
              className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Designation</label>
            <input
              type="text"
              name="designation"
              defaultValue={profile.designation || ''}
              placeholder="e.g. Associate Professor"
              className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Institution</label>
            <select
              name="institutionId"
              defaultValue={profile.institutionId || ''}
              className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl outline-none bg-white"
            >
              <option value="">Select Institution</option>
              {institutions.map((inst) => (
                <option key={inst.id} value={inst.id}>
                  {inst.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
            <input
              type="text"
              name="department"
              defaultValue={profile.department || ''}
              placeholder="Computer Science"
              className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Academic Background / Qualification</label>
          <textarea
            name="academicBackground"
            rows={2}
            defaultValue={profile.academicBackground || ''}
            placeholder="Ph.D. in Computer Science, M.Tech in Software Engineering..."
            className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Areas of Expertise (comma separated)</label>
          <input
            type="text"
            name="areasOfExpertise"
            defaultValue={profile.areasOfExpertise?.join(', ') || ''}
            placeholder="Machine Learning, Distributed Systems, Software Testing"
            className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Research Interests (comma separated)</label>
          <input
            type="text"
            name="researchInterests"
            defaultValue={profile.researchInterests?.join(', ') || ''}
            placeholder="Relational Optimization, Cloud Security"
            className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Industry Collaboration Interests (comma separated)</label>
          <input
            type="text"
            name="industryInterests"
            defaultValue={profile.industryInterests?.join(', ') || ''}
            placeholder="FDP Workshops, Joint Research, Student Mentorship"
            className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl outline-none"
          />
        </div>

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={updateMutation.isPending}
            className="px-6 py-2.5 text-sm font-semibold bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-50"
          >
            {updateMutation.isPending ? 'Saving…' : 'Save Faculty Profile'}
          </button>
        </div>
      </form>
    </div>
  );
};

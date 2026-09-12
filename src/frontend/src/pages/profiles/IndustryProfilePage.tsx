import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { profileApi } from '../../lib/profile-api';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Building2, CheckCircle2, AlertCircle } from 'lucide-react';

export const IndustryProfilePage: React.FC = () => {
  const queryClient = useQueryClient();
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const { data: profile, isLoading, isError } = useQuery({
    queryKey: ['industryProfileMe'],
    queryFn: profileApi.getIndustryProfileMe,
  });

  const updateMutation = useMutation({
    mutationFn: profileApi.updateIndustryProfileMe,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['industryProfileMe'] });
      setMessage({ type: 'success', text: 'Industry profile updated successfully!' });
      setTimeout(() => setMessage(null), 3000);
    },
    onError: (err: any) => {
      setMessage({ type: 'error', text: err.message || 'Update failed' });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <LoadingSpinner text="Loading industry profile…" />
      </div>
    );
  }

  if (isError || !profile) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-red-800 flex items-center gap-3">
        <AlertCircle className="w-6 h-6 text-red-500" />
        <div>
          <h3 className="font-bold">Error loading company profile</h3>
          <p className="text-sm">Unable to load company profile information.</p>
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
        data[key] = value;
      }
    });

    updateMutation.mutate(data);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-3xl p-6 sm:p-8 text-white shadow-md">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-2xl font-bold">
            <Building2 className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{profile.companyName}</h1>
            <p className="text-indigo-100 text-sm">{profile.industryType} — {profile.headquarters || 'Headquarters not set'}</p>
            <span className="inline-block mt-1 text-[11px] bg-white/20 text-indigo-50 border border-white/30 px-2.5 py-0.5 rounded-full">
              {profile.isVerified ? 'Verified Partner' : 'Verification Pending'}
            </span>
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
        <h2 className="text-lg font-bold text-slate-900 border-b pb-3">Company Details</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Company Name</label>
            <input
              type="text"
              name="companyName"
              defaultValue={profile.companyName}
              className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Industry / Sector</label>
            <input
              type="text"
              name="industryType"
              defaultValue={profile.industryType}
              placeholder="Enterprise Software, Cloud Services"
              className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Company Size</label>
            <input
              type="text"
              name="companySize"
              defaultValue={profile.companySize || ''}
              placeholder="e.g. 500-1000 employees"
              className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Headquarters / Location</label>
            <input
              type="text"
              name="headquarters"
              defaultValue={profile.headquarters || ''}
              placeholder="Bengaluru, India"
              className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Website URL</label>
            <input
              type="text"
              name="website"
              defaultValue={profile.website || ''}
              placeholder="https://company.example.com"
              className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Recruitment Contact Email</label>
            <input
              type="email"
              name="contactEmail"
              defaultValue={profile.contactEmail || ''}
              placeholder="careers@company.example.com"
              className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Company Overview</label>
          <textarea
            name="description"
            rows={3}
            defaultValue={profile.description || ''}
            placeholder="Brief overview of company business, core technical focus, and internship programs..."
            className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl outline-none"
          />
        </div>

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={updateMutation.isPending}
            className="px-6 py-2.5 text-sm font-semibold bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50"
          >
            {updateMutation.isPending ? 'Saving…' : 'Save Industry Profile'}
          </button>
        </div>
      </form>
    </div>
  );
};

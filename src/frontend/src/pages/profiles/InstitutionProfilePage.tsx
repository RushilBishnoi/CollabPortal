import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { profileApi } from '../../lib/profile-api';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { School, CheckCircle2, AlertCircle } from 'lucide-react';

export const InstitutionProfilePage: React.FC = () => {
  const queryClient = useQueryClient();
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const { data: profile, isLoading, isError } = useQuery({
    queryKey: ['institutionProfileMe'],
    queryFn: profileApi.getInstitutionProfileMe,
  });

  const updateMutation = useMutation({
    mutationFn: profileApi.updateInstitutionProfileMe,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['institutionProfileMe'] });
      setMessage({ type: 'success', text: 'Institution profile updated successfully!' });
      setTimeout(() => setMessage(null), 3000);
    },
    onError: (err: any) => {
      setMessage({ type: 'error', text: err.message || 'Update failed' });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <LoadingSpinner text="Loading institution profile…" />
      </div>
    );
  }

  if (isError || !profile) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-red-800 flex items-center gap-3">
        <AlertCircle className="w-6 h-6 text-red-500" />
        <div>
          <h3 className="font-bold">Error loading institution profile</h3>
          <p className="text-sm">Unable to load institution profile information.</p>
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
        if (key === 'departments') {
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
      <div className="bg-gradient-to-r from-amber-600 to-orange-600 rounded-3xl p-6 sm:p-8 text-white shadow-md">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-2xl font-bold">
            <School className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{profile.name}</h1>
            <p className="text-amber-100 text-sm">{profile.type} — {profile.city || 'City'}, {profile.state || 'State'}</p>
            <span className="inline-block mt-1 text-[11px] bg-white/20 text-amber-50 border border-white/30 px-2.5 py-0.5 rounded-full">
              {profile.isVerified ? 'Verified Institution' : 'Pending Administrative Audit'}
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
        <h2 className="text-lg font-bold text-slate-900 border-b pb-3">Institutional Administrative Record</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Institution Name</label>
            <input
              type="text"
              name="name"
              defaultValue={profile.name}
              className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">AISHE / Institution Code</label>
            <input
              type="text"
              name="code"
              defaultValue={profile.code || ''}
              placeholder="INST-BLR-001"
              className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Category / Type</label>
            <select
              name="type"
              defaultValue={profile.type}
              className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl outline-none bg-white"
            >
              <option value="UNIVERSITY">University</option>
              <option value="COLLEGE">Autonomous College</option>
              <option value="TECHNICAL_INSTITUTE">Technical Institute (IIT/NIT/IIIT)</option>
              <option value="POLYTECHNIC">Polytechnic / Vocational</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Website URL</label>
            <input
              type="text"
              name="website"
              defaultValue={profile.website || ''}
              placeholder="https://institution.example.edu"
              className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">City</label>
            <input
              type="text"
              name="city"
              defaultValue={profile.city || ''}
              placeholder="Bengaluru"
              className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">State</label>
            <input
              type="text"
              name="state"
              defaultValue={profile.state || ''}
              placeholder="Karnataka"
              className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Official Contact Email</label>
            <input
              type="email"
              name="contactEmail"
              defaultValue={profile.contactEmail || ''}
              placeholder="contact@institution.example.edu"
              className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Official Contact Phone</label>
            <input
              type="text"
              name="contactPhone"
              defaultValue={profile.contactPhone || ''}
              placeholder="+91 80 12345678"
              className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Departments Offered (comma separated)</label>
          <input
            type="text"
            name="departments"
            defaultValue={profile.departments?.join(', ') || ''}
            placeholder="Computer Science, Information Technology, Electronics, Mechanical"
            className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl outline-none"
          />
        </div>

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={updateMutation.isPending}
            className="px-6 py-2.5 text-sm font-semibold bg-amber-600 text-white rounded-xl hover:bg-amber-700 transition-colors shadow-sm disabled:opacity-50"
          >
            {updateMutation.isPending ? 'Saving…' : 'Save Institution Profile'}
          </button>
        </div>
      </form>
    </div>
  );
};

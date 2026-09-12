import React from 'react';
import { Search, Filter, RotateCcw } from 'lucide-react';
import { CollaborationType } from '../../types/collaboration';
import { useAuth } from '../../context/AuthContext';

interface CollaborationFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  collaborationType: string;
  onTypeChange: (value: string) => void;
  targetAudience: string;
  onAudienceChange: (value: string) => void;
  mode: string;
  onModeChange: (value: string) => void;
  department: string;
  onDepartmentChange: (value: string) => void;
  onReset: () => void;
  showAudienceFilter?: boolean;
}

const COLLABORATION_TYPES: { value: CollaborationType; label: string }[] = [
  { value: 'WORKSHOP', label: 'Workshop' },
  { value: 'FDP', label: 'Faculty Development Program' },
  { value: 'INDUSTRIAL_TRAINING', label: 'Industrial Training / Internship' },
  { value: 'GUEST_LECTURE', label: 'Guest Lecture' },
  { value: 'LIVE_PROJECT', label: 'Live Industry Project' },
  { value: 'RESEARCH', label: 'Research Collaboration' },
  { value: 'CONSULTANCY', label: 'Consultancy' },
];

export const CollaborationFilters: React.FC<CollaborationFiltersProps> = ({
  search,
  onSearchChange,
  collaborationType,
  onTypeChange,
  targetAudience,
  onAudienceChange,
  mode,
  onModeChange,
  department,
  onDepartmentChange,
  onReset,
  showAudienceFilter = true,
}) => {
  const { user, isAuthenticated } = useAuth();
  const isIndustry = isAuthenticated && user?.role === 'INDUSTRY';
  const isInstitution = isAuthenticated && user?.role === 'INSTITUTION_ADMIN';

  const hasActiveFilters =
    search ||
    collaborationType ||
    (showAudienceFilter && targetAudience) ||
    mode ||
    department;

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
      <div className="flex flex-col md:flex-row items-center gap-3">
        {/* Search Input */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={
              isInstitution
                ? 'Search by programme, company, domain, or collaboration area.'
                : isIndustry
                ? 'Search by program, institution, domain, or keyword...'
                : 'Search by title, keywords, domains, company...'
            }
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all placeholder:text-slate-400"
          />
        </div>

        {hasActiveFilters && (
          <button
            onClick={onReset}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Filters
          </button>
        )}
      </div>

      {/* Filter Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-100 text-xs">
        {/* Type Filter */}
        <div>
          <label className="block text-slate-500 font-medium mb-1 flex items-center gap-1">
            <Filter className="w-3 h-3" />
            {isIndustry ? 'Collaboration Type' : 'Type'}
          </label>
          <select
            value={collaborationType}
            onChange={(e) => onTypeChange(e.target.value)}
            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 text-slate-700"
          >
            <option value="">{isIndustry ? 'All Collaboration Types' : 'All Types'}</option>
            {COLLABORATION_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        {/* Audience Filter */}
        {showAudienceFilter && (
          <div>
            <label className="block text-slate-500 font-medium mb-1">
              Target Audience
            </label>
            <select
              value={targetAudience}
              onChange={(e) => onAudienceChange(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 text-slate-700"
            >
              <option value="">All Audiences</option>
              <option value="FACULTY">Faculty</option>
              <option value="STUDENT">Students</option>
              <option value="BOTH">Faculty &amp; Students</option>
            </select>
          </div>
        )}

        {/* Mode Filter */}
        <div>
          <label className="block text-slate-500 font-medium mb-1">Delivery Mode</label>
          <select
            value={mode}
            onChange={(e) => onModeChange(e.target.value)}
            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 text-slate-700"
          >
            <option value="">All Modes</option>
            <option value="ONLINE">Online / Virtual</option>
            <option value="IN_PERSON">In-Person</option>
            <option value="HYBRID">Hybrid</option>
          </select>
        </div>

        {/* Department Filter */}
        <div>
          <label className="block text-slate-500 font-medium mb-1">
            {isIndustry ? 'Academic Department' : 'Department'}
          </label>
          <input
            type="text"
            placeholder="e.g. Computer Science"
            value={department}
            onChange={(e) => onDepartmentChange(e.target.value)}
            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 text-slate-700 placeholder:text-slate-400"
          />
        </div>
      </div>
    </div>
  );
};

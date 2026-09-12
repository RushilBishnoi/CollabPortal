import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Briefcase,
  Plus,
  Building2,
  Edit,
  Eye,
  Users,
  AlertTriangle,
  MapPin,
} from 'lucide-react';
import { opportunityApi } from '../../lib/opportunity-api';
import { OpportunityBrief, OpportunityStatus } from '../../types/opportunities';

export const IndustryOpportunitiesPage: React.FC = () => {
  const queryClient = useQueryClient();

  const {
    data: postings = [],
    isLoading,
    isError,
  } = useQuery<OpportunityBrief[]>({
    queryKey: ['my-industry-postings'],
    queryFn: () => opportunityApi.getMyPostings(),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: OpportunityStatus }) =>
      opportunityApi.updatePostingStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-industry-postings'] });
    },
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-500">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="text-sm font-medium">Loading your corporate postings...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center max-w-lg mx-auto my-12">
        <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
        <h3 className="text-sm font-bold text-red-900">Failed to load opportunity postings</h3>
        <p className="text-xs text-red-600 mt-1">Please ensure your recruiter session is active.</p>
      </div>
    );
  }

  const publishedCount = postings.filter((p) => p.status === 'PUBLISHED').length;
  const draftCount = postings.filter((p) => p.status === 'DRAFT').length;
  const totalPositions = postings.reduce((acc, p) => acc + (p.positionsCount || 1), 0);

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-semibold">
              <Building2 className="w-3.5 h-3.5" /> Recruiter Opportunity Hub
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Manage Corporate Opportunities
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm max-w-xl leading-relaxed">
              Author and publish internships, jobs, apprenticeships, and live projects with structured skill requirements and academic eligibility gates.
            </p>
          </div>

          <Link
            to="/portal/industry/opportunities/new"
            className="inline-flex items-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-lg transition-colors self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" /> Post New Opportunity
          </Link>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-3 gap-4 mt-8 pt-6 border-t border-white/10 text-center sm:text-left">
          <div className="bg-white/5 backdrop-blur rounded-2xl p-4 border border-white/10">
            <p className="text-[11px] font-medium text-emerald-300 uppercase tracking-wider">
              Published Roles
            </p>
            <p className="text-2xl font-bold text-white mt-1">{publishedCount}</p>
          </div>
          <div className="bg-white/5 backdrop-blur rounded-2xl p-4 border border-white/10">
            <p className="text-[11px] font-medium text-amber-300 uppercase tracking-wider">
              Draft Postings
            </p>
            <p className="text-2xl font-bold text-white mt-1">{draftCount}</p>
          </div>
          <div className="bg-white/5 backdrop-blur rounded-2xl p-4 border border-white/10">
            <p className="text-[11px] font-medium text-blue-300 uppercase tracking-wider">
              Open Positions
            </p>
            <p className="text-2xl font-bold text-white mt-1">{totalPositions}</p>
          </div>
        </div>
      </div>

      {/* Postings Table */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-blue-600" />
              Active &amp; Draft Opportunities ({postings.length})
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Live matching engine automatically scores candidate profiles against your required skills.
            </p>
          </div>
        </div>

        {postings.length === 0 ? (
          <div className="text-center py-12 text-slate-400 border border-dashed border-slate-200 rounded-2xl">
            <Briefcase className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <h3 className="text-sm font-bold text-slate-700">No opportunities posted yet</h3>
            <p className="text-xs text-slate-500 mt-1">Get started by creating your first corporate posting.</p>
            <Link
              to="/portal/industry/opportunities/new"
              className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-sm hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" /> Post Opportunity
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold">
                  <th className="py-3 px-4 rounded-l-xl">Role Title</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Location / Remote</th>
                  <th className="py-3 px-4">Required Skills</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right rounded-r-xl">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {postings.map((opp) => (
                  <tr key={opp.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-4">
                      <p className="font-bold text-slate-900 text-sm">{opp.title}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5 font-mono">/{opp.slug}</p>
                    </td>
                    <td className="py-4 px-4 font-semibold text-slate-700">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] bg-blue-50 text-blue-700 border border-blue-100">
                        {opp.opportunityType.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>{opp.location}</span>
                        {opp.isRemote && (
                          <span className="text-[10px] bg-emerald-50 text-emerald-700 px-1.5 py-0.2 rounded font-bold">
                            Remote
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                        {opp.skills?.length || 0} skill(s)
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <select
                        value={opp.status}
                        onChange={(e) =>
                          statusMutation.mutate({
                            id: opp.id,
                            status: e.target.value as OpportunityStatus,
                          })
                        }
                        className={`text-xs font-bold rounded-lg px-2.5 py-1 border cursor-pointer focus:outline-none ${
                          opp.status === 'PUBLISHED'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : opp.status === 'DRAFT'
                            ? 'bg-amber-50 text-amber-800 border-amber-300'
                            : 'bg-slate-100 text-slate-700 border-slate-300'
                        }`}
                      >
                        <option value="PUBLISHED">PUBLISHED</option>
                        <option value="DRAFT">DRAFT</option>
                        <option value="CLOSED">CLOSED</option>
                        <option value="ARCHIVED">ARCHIVED</option>
                      </select>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/portal/industry/opportunities/${opp.id}/applications`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200"
                          title="View Candidate Applications"
                        >
                          <Users className="w-3.5 h-3.5" /> Candidates
                        </Link>
                        <Link
                          to={`/opportunities/${opp.slug}`}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View Public Posting"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <Link
                          to={`/portal/industry/opportunities/${opp.id}/edit`}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Edit Opportunity"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

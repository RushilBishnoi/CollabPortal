import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  GraduationCap,
  ShieldCheck,
  Search,
  IndianRupee,
  Building,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { placementApi } from '../../lib/placement-api';
import { OfferStatusBadge } from '../../components/placements/OfferStatusBadge';
import { TpoVerificationModal } from '../../components/placements/TpoVerificationModal';
import { Placement, PlacementStatus } from '../../types/placement';

export const InstitutionPlacementsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<PlacementStatus | ''>('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPlacement, setSelectedPlacement] = useState<Placement | null>(null);

  // Fetch placements
  const { data: placementsData, isLoading } = useQuery({
    queryKey: ['institution-placements', statusFilter, departmentFilter, searchTerm],
    queryFn: () =>
      placementApi.getInstitutionPlacements({
        status: statusFilter || undefined,
        department: departmentFilter || undefined,
        search: searchTerm || undefined,
      }),
  });

  // Fetch placement analytics
  const { data: analyticsData } = useQuery({
    queryKey: ['placement-analytics'],
    queryFn: () => placementApi.getPlacementAnalytics(),
  });

  const verifyMutation = useMutation({
    mutationFn: ({
      placementId,
      payload,
    }: {
      placementId: string;
      payload: {
        nocIssued?: boolean;
        nocReferenceNumber?: string;
        verificationNotes?: string;
      };
    }) => placementApi.verifyPlacement(placementId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['institution-placements'] });
      queryClient.invalidateQueries({ queryKey: ['placement-analytics'] });
    },
  });

  const confirmJoiningMutation = useMutation({
    mutationFn: (placementId: string) =>
      placementApi.confirmJoining(placementId, {
        actualJoiningDate: new Date().toISOString(),
        notes: 'Joining verified by TPO.',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['institution-placements'] });
      queryClient.invalidateQueries({ queryKey: ['placement-analytics'] });
    },
  });

  const placements = placementsData?.items || [];
  const summary = analyticsData?.summary;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-brand-950 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/20 text-brand-300 text-xs font-semibold mb-3 border border-brand-500/30">
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Training & Placement Officer Hub</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight mb-2">
            Placement Management and Outcomes
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed">
            Verify student placement records, issue institutional No-Objection Certificates (NOC), analyze compensation distributions across departments, and monitor corporate onboarding.
          </p>
        </div>
      </div>

      {/* Analytics KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">Total Placements</p>
            <h3 className="text-2xl font-extrabold text-slate-900">
              {summary?.totalPlacements ?? placements.length}
            </h3>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">Pending Verification</p>
            <h3 className="text-2xl font-extrabold text-amber-600">
              {summary?.pendingVerificationCount ??
                placements.filter((p) => p.status === 'PENDING_VERIFICATION').length}
            </h3>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">TPO Verified / NOC</p>
            <h3 className="text-2xl font-extrabold text-emerald-600">
              {summary?.verifiedCount ??
                placements.filter((p) => p.status === 'VERIFIED' || p.nocIssued).length}
            </h3>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <IndianRupee className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">Average CTC</p>
            <h3 className="text-2xl font-extrabold text-purple-600">
              ₹{summary?.averageCtcLpa ?? '0.0'} LPA
            </h3>
          </div>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200">
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto flex-1">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search student or company..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="w-full sm:w-48 px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
          >
            <option value="">All Departments</option>
            <option value="Computer Science">Computer Science</option>
            <option value="Information Technology">Information Technology</option>
            <option value="Electronics & Communication">Electronics & Comm.</option>
            <option value="Electrical Engineering">Electrical Engg.</option>
            <option value="Mechanical Engineering">Mechanical Engg.</option>
          </select>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          {(['', 'PENDING_VERIFICATION', 'VERIFIED', 'JOINED', 'REVOKED'] as const).map(
            (st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
                  statusFilter === st
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {st === '' ? 'All Placements' : st.replace(/_/g, ' ')}
              </button>
            ),
          )}
        </div>
      </div>

      {/* Placements Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-12 bg-slate-100 animate-pulse rounded-xl" />
            ))}
          </div>
        ) : placements.length === 0 ? (
          <div className="text-center py-16 p-8 space-y-3">
            <Building className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-900">
              No Student Placements Found
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Placements will appear here once enrolled students accept formal job or internship offers.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold text-[10px]">
                  <th className="py-4 px-6">Student Candidate</th>
                  <th className="py-4 px-6">Corporate Partner</th>
                  <th className="py-4 px-6">Role & Designation</th>
                  <th className="py-4 px-6">Package (CTC)</th>
                  <th className="py-4 px-6">Status & NOC</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {placements.map((plc) => (
                  <tr key={plc.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-4 px-6">
                      <div className="font-bold text-slate-900">
                        {plc.studentProfile?.fullName}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {plc.studentProfile?.department} • CGPA: {plc.studentProfile?.cgpa || 'N/A'}
                      </div>
                    </td>

                    <td className="py-4 px-6">
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        <Building className="w-3.5 h-3.5 text-brand-600" />
                        <span>{plc.companyNameSnapshot}</span>
                      </div>
                    </td>

                    <td className="py-4 px-6">
                      <span>{plc.jobTitleSnapshot}</span>
                    </td>

                    <td className="py-4 px-6">
                      <span className="font-bold text-emerald-700">
                        {plc.annualCtcSnapshot
                          ? `₹${(plc.annualCtcSnapshot / 100000).toFixed(1)} LPA`
                          : 'Undisclosed'}
                      </span>
                    </td>

                    <td className="py-4 px-6 space-y-1">
                      <OfferStatusBadge status={plc.status} isPlacement />
                      {plc.nocIssued && (
                        <div className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>{plc.nocReferenceNumber || 'NOC Active'}</span>
                        </div>
                      )}
                    </td>

                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {plc.status === 'PENDING_VERIFICATION' && (
                          <button
                            onClick={() => setSelectedPlacement(plc)}
                            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-colors"
                          >
                            Verify & NOC
                          </button>
                        )}

                        {plc.status === 'VERIFIED' && !plc.joiningConfirmed && (
                          <button
                            onClick={() => confirmJoiningMutation.mutate(plc.id)}
                            disabled={confirmJoiningMutation.isPending}
                            className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-sm transition-colors"
                          >
                            Confirm Joining
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* TPO Verification Modal */}
      {selectedPlacement && (
        <TpoVerificationModal
          isOpen={!!selectedPlacement}
          onClose={() => setSelectedPlacement(null)}
          placement={selectedPlacement}
          onConfirmVerify={async (placementId, payload) => {
            await verifyMutation.mutateAsync({ placementId, payload });
          }}
        />
      )}
    </div>
  );
};

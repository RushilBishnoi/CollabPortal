import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Building,
  Briefcase,
  Users,
  Search,
  IndianRupee,
  CheckCircle2,
} from 'lucide-react';
import { placementApi } from '../../lib/placement-api';
import { OfferCard } from '../../components/placements/OfferCard';
import { PlacementOffer, OfferStatus } from '../../types/placement';

export const IndustryPlacementsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<OfferStatus | ''>('');
  const [searchTerm, setSearchTerm] = useState('');

  const { data: offersData, isLoading } = useQuery({
    queryKey: ['industry-offers', statusFilter, searchTerm],
    queryFn: () =>
      placementApi.getIndustryOffers({
        status: statusFilter || undefined,
        search: searchTerm || undefined,
      }),
  });

  const issueMutation = useMutation({
    mutationFn: (offerId: string) => placementApi.issueOffer(offerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['industry-offers'] });
    },
  });

  const offers = offersData?.items || [];

  const draftCount = offers.filter((o) => o.status === 'DRAFT').length;
  const issuedCount = offers.filter((o) => o.status === 'ISSUED').length;
  const acceptedCount = offers.filter((o) => o.status === 'ACCEPTED').length;

  const validCtcs = offers
    .map((o) => o.ctcAnnual)
    .filter((c): c is number => typeof c === 'number' && c > 0);

  const avgCtc =
    validCtcs.length > 0
      ? (validCtcs.reduce((a, b) => a + b, 0) / validCtcs.length / 100000).toFixed(1)
      : '0.0';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-brand-950 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/20 text-brand-300 text-xs font-semibold mb-3 border border-brand-500/30">
            <Building className="w-3.5 h-3.5" />
            <span>Recruiter Placement Studio</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight mb-2">
            Placement & Offer Pipeline
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed">
            Manage formal offers for selected candidates, track acceptance decisions, configure compensation structures, and coordinate campus onboarding.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
            <Briefcase className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">Total Offers</p>
            <h3 className="text-2xl font-extrabold text-slate-900">{offers.length}</h3>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">Draft / Issued</p>
            <h3 className="text-2xl font-extrabold text-slate-900">
              {draftCount} / {issuedCount}
            </h3>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">Offers Accepted</p>
            <h3 className="text-2xl font-extrabold text-emerald-600">{acceptedCount}</h3>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <IndianRupee className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">Average Package</p>
            <h3 className="text-2xl font-extrabold text-purple-600">₹{avgCtc} LPA</h3>
          </div>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search candidate, role, or title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          {(['', 'DRAFT', 'ISSUED', 'ACCEPTED', 'DECLINED', 'EXPIRED'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
                statusFilter === st
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st === '' ? 'All Offers' : st.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Offers Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-64 rounded-2xl bg-slate-100 animate-pulse border border-slate-200"
            />
          ))}
        </div>
      ) : offers.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-8 space-y-3">
          <Briefcase className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-900">Select a Candidate to Create an Offer</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            Select a candidate from Candidates, then create and issue a formal offer.
          </p>
          <div className="pt-1">
            <Link
              to="/portal/industry/opportunities"
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
            >
              <Users className="w-4 h-4" /> View Candidates
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {offers.map((offer: PlacementOffer) => (
            <OfferCard
              key={offer.id}
              offer={offer}
              roleView="industry"
              onIssue={(o) => issueMutation.mutate(o.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

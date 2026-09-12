import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Briefcase,
  CheckCircle2,
  Award,
  Search,
  Sparkles,
} from 'lucide-react';
import { placementApi } from '../../lib/placement-api';
import { OfferCard } from '../../components/placements/OfferCard';
import { AcceptDeclineOfferModal } from '../../components/placements/AcceptDeclineOfferModal';
import { PlacementOffer, OfferStatus } from '../../types/placement';

export const StudentOffersPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<OfferStatus | ''>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOffer, setSelectedOffer] = useState<PlacementOffer | null>(null);
  const [modalMode, setModalMode] = useState<'accept' | 'decline'>('accept');

  // Fetch offers
  const { data: offersData, isLoading: offersLoading } = useQuery({
    queryKey: ['student-offers', statusFilter, searchTerm],
    queryFn: () =>
      placementApi.getStudentOffers({
        status: statusFilter || undefined,
        search: searchTerm || undefined,
      }),
  });

  // Fetch confirmed placements
  const { data: placementsData } = useQuery({
    queryKey: ['student-my-placements'],
    queryFn: () => placementApi.getMyPlacements(),
  });

  const acceptMutation = useMutation({
    mutationFn: ({ offerId, notes }: { offerId: string; notes?: string }) =>
      placementApi.acceptOffer(offerId, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-offers'] });
      queryClient.invalidateQueries({ queryKey: ['student-my-placements'] });
    },
  });

  const declineMutation = useMutation({
    mutationFn: ({
      offerId,
      reason,
      notes,
    }: {
      offerId: string;
      reason: string;
      notes?: string;
    }) => placementApi.declineOffer(offerId, reason, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student-offers'] });
    },
  });

  const handleOpenAccept = (offer: PlacementOffer) => {
    setSelectedOffer(offer);
    setModalMode('accept');
  };

  const handleOpenDecline = (offer: PlacementOffer) => {
    setSelectedOffer(offer);
    setModalMode('decline');
  };

  const offers = offersData?.items || [];
  const placements = placementsData || [];

  const pendingOffersCount = offers.filter(
    (o) =>
      o.status === 'ISSUED' &&
      new Date(o.offerExpiryDate).getTime() > Date.now(),
  ).length;

  const acceptedOffersCount = offers.filter((o) => o.status === 'ACCEPTED').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-brand-950 to-slate-900 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/20 text-brand-300 text-xs font-semibold mb-3 border border-brand-500/30">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Post-Selection Career Hub</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight mb-2">
            My Offers & Official Placements
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed">
            Review formal compensation packages from corporate partners, accept or decline employment offers, and track your institutional TPO placement verification.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
            <Briefcase className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">Active Offers Received</p>
            <h3 className="text-2xl font-extrabold text-slate-900">{offers.length}</h3>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">Action Required (Pending)</p>
            <h3 className="text-2xl font-extrabold text-amber-600">
              {pendingOffersCount}
            </h3>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">Verified Placements</p>
            <h3 className="text-2xl font-extrabold text-emerald-600">
              {placements.length || acceptedOffersCount}
            </h3>
          </div>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by role or company..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          {(['', 'ISSUED', 'ACCEPTED', 'DECLINED', 'EXPIRED'] as const).map((st) => (
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
      {offersLoading ? (
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
          <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
            <Briefcase className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-900">No Offers Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Once you are selected by a hiring corporate partner, your official placement offers and terms will appear here for review.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {offers.map((offer) => (
            <OfferCard
              key={offer.id}
              offer={offer}
              roleView="student"
              onAccept={handleOpenAccept}
              onDecline={handleOpenDecline}
            />
          ))}
        </div>
      )}

      {/* Verified Placement Record Section */}
      {placements.length > 0 && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <h2 className="text-lg font-bold text-slate-900">
              Institutional Placement Records
            </h2>
          </div>

          <div className="divide-y divide-slate-100">
            {placements.map((plc) => (
              <div
                key={plc.id}
                className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    {plc.jobTitleSnapshot} at {plc.companyNameSnapshot}
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {plc.annualCtcSnapshot
                      ? `₹${(plc.annualCtcSnapshot / 100000).toFixed(1)} LPA`
                      : 'Package N/A'}{' '}
                    • {plc.status.replace(/_/g, ' ')}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {plc.nocIssued && (
                    <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-semibold">
                      NOC: {plc.nocReferenceNumber || 'Verified'}
                    </span>
                  )}
                  {plc.joiningConfirmed && (
                    <span className="px-3 py-1 bg-purple-50 text-purple-700 border border-purple-200 rounded-full text-xs font-semibold">
                      Joined
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal */}
      {selectedOffer && (
        <AcceptDeclineOfferModal
          isOpen={!!selectedOffer}
          onClose={() => setSelectedOffer(null)}
          offer={selectedOffer}
          mode={modalMode}
          onConfirmAccept={async (id, notes) => {
            await acceptMutation.mutateAsync({ offerId: id, notes });
          }}
          onConfirmDecline={async (id, reason, notes) => {
            await declineMutation.mutateAsync({ offerId: id, reason, notes });
          }}
        />
      )}
    </div>
  );
};

import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Building,
  MapPin,
  Calendar,
  IndianRupee,
  Clock,
  ArrowLeft,
  FileText,
  Download,
  Mail,
  User,
  ShieldCheck,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { placementApi } from '../../lib/placement-api';
import { OfferStatusBadge } from '../../components/placements/OfferStatusBadge';
import { PlacementTimeline } from '../../components/placements/PlacementTimeline';
import { AcceptDeclineOfferModal } from '../../components/placements/AcceptDeclineOfferModal';
import { useAuth } from '../../context/AuthContext';

export const OfferDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const isStudent = user?.role === 'STUDENT';
  const isIndustry = user?.role === 'INDUSTRY';

  const [isAcceptModalOpen, setIsAcceptModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'accept' | 'decline'>('accept');

  // Fetch offer
  const { data: offer, isLoading, error } = useQuery({
    queryKey: ['offer-detail', id, user?.role],
    queryFn: () => {
      if (!id) throw new Error('No offer ID provided');
      return isStudent
        ? placementApi.getStudentOfferById(id)
        : placementApi.getIndustryOfferById(id);
    },
    enabled: !!id,
  });

  const issueMutation = useMutation({
    mutationFn: () => placementApi.issueOffer(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['offer-detail', id] });
    },
  });

  const withdrawMutation = useMutation({
    mutationFn: () => placementApi.withdrawOffer(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['offer-detail', id] });
    },
  });

  const acceptMutation = useMutation({
    mutationFn: ({ notes }: { notes?: string }) =>
      placementApi.acceptOffer(id!, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['offer-detail', id] });
    },
  });

  const declineMutation = useMutation({
    mutationFn: ({ reason, notes }: { reason: string; notes?: string }) =>
      placementApi.declineOffer(id!, reason, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['offer-detail', id] });
    },
  });

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12 space-y-6">
        <div className="h-48 rounded-3xl bg-slate-100 animate-pulse border border-slate-200" />
        <div className="h-96 rounded-3xl bg-slate-100 animate-pulse border border-slate-200" />
      </div>
    );
  }

  if (error || !offer) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-white rounded-3xl border border-slate-200 text-center space-y-4">
        <XCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h3 className="text-base font-bold text-slate-900">Offer Not Found</h3>
        <p className="text-xs text-slate-500">
          This placement offer does not exist or you do not have permission to view it.
        </p>
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold"
        >
          Go Back
        </button>
      </div>
    );
  }

  const isExpired =
    offer.status === 'ISSUED' &&
    new Date(offer.offerExpiryDate).getTime() < Date.now();

  const effectiveStatus = isExpired ? 'EXPIRED' : offer.status;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Breadcrumb */}
      <Link
        to={isStudent ? '/portal/student/offers' : '/portal/industry/placements'}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to {isStudent ? 'My Offers' : 'Placements Dashboard'}</span>
      </Link>

      {/* Header Banner */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <OfferStatusBadge status={effectiveStatus} />
              <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-md">
                {offer.employmentType.replace(/_/g, ' ')}
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
              {offer.title}
            </h1>
            <div className="flex items-center gap-2 text-xs text-slate-600 font-medium mt-1">
              <Building className="w-4 h-4 text-brand-600" />
              <span className="font-bold text-slate-900">
                {offer.industryProfile?.companyName || 'Corporate Partner'}
              </span>
              {offer.department && <span>• {offer.department}</span>}
            </div>
          </div>

          {/* Action Triggers */}
          <div className="flex items-center gap-3">
            {isStudent && offer.status === 'ISSUED' && !isExpired && (
              <>
                <button
                  onClick={() => {
                    setModalMode('decline');
                    setIsAcceptModalOpen(true);
                  }}
                  className="px-4 py-2.5 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-bold transition-colors"
                >
                  Decline Offer
                </button>
                <button
                  onClick={() => {
                    setModalMode('accept');
                    setIsAcceptModalOpen(true);
                  }}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-colors flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Accept Offer</span>
                </button>
              </>
            )}

            {isIndustry && offer.status === 'DRAFT' && (
              <button
                onClick={() => issueMutation.mutate()}
                disabled={issueMutation.isPending}
                className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-sm transition-colors"
              >
                {issueMutation.isPending ? 'Issuing...' : 'Issue Offer to Candidate'}
              </button>
            )}

            {isIndustry && offer.status === 'ISSUED' && (
              <button
                onClick={() => withdrawMutation.mutate()}
                disabled={withdrawMutation.isPending}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold transition-colors"
              >
                {withdrawMutation.isPending ? 'Withdrawing...' : 'Withdraw Offer'}
              </button>
            )}
          </div>
        </div>

        {/* Highlight Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-100">
            <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1">
              <IndianRupee className="w-3.5 h-3.5" />
              Annual CTC
            </span>
            <p className="text-lg font-extrabold text-emerald-900 mt-1">
              {offer.ctcAnnual
                ? `₹${(offer.ctcAnnual / 100000).toFixed(1)} LPA`
                : offer.stipendMonthly
                ? `₹${offer.stipendMonthly.toLocaleString()}/mo`
                : 'Undisclosed'}
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              Location & Mode
            </span>
            <p className="text-sm font-bold text-slate-900 mt-1">
              {offer.workLocation} ({offer.workMode})
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              Joining Date
            </span>
            <p className="text-sm font-bold text-slate-900 mt-1">
              {new Date(offer.joiningDate).toLocaleDateString()}
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              Offer Expiry
            </span>
            <p className="text-sm font-bold text-slate-900 mt-1">
              {new Date(offer.offerExpiryDate).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid: Details + Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Details & Terms */}
        <div className="lg:col-span-2 space-y-6">
          {/* Candidate & Recruiter Summary */}
          {offer.studentProfile && (
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Candidate Profile
              </h3>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    {offer.studentProfile.fullName}
                  </h4>
                  <p className="text-xs text-slate-500">
                    {offer.studentProfile.department} • CGPA: {offer.studentProfile.cgpa || 'N/A'} • Class of {offer.studentProfile.graduationYear}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Description & Benefits */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-sm space-y-6">
            <div>
              <h3 className="text-sm font-bold text-slate-900 mb-2">
                Position & Role Overview
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                {offer.description || 'Standard corporate appointment guidelines apply.'}
              </p>
            </div>

            {offer.benefitsSummary && (
              <div>
                <h3 className="text-sm font-bold text-slate-900 mb-2">
                  Benefits, Health & Perks
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {offer.benefitsSummary}
                </p>
              </div>
            )}

            {offer.termsAndConditions && (
              <div>
                <h3 className="text-sm font-bold text-slate-900 mb-2">
                  Employment Terms & Conditions
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  {offer.termsAndConditions}
                </p>
              </div>
            )}

            {/* Contact Person */}
            {(offer.contactPerson || offer.contactEmail) && (
              <div className="pt-4 border-t border-slate-100 flex items-center gap-3 text-xs text-slate-600">
                <Mail className="w-4 h-4 text-slate-400" />
                <span>
                  HR Contact: {offer.contactPerson} ({offer.contactEmail})
                </span>
              </div>
            )}
          </div>

          {/* Documents Section */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-brand-600" />
              <h3 className="text-base font-bold text-slate-900">
                Official Placement Documents
              </h3>
            </div>

            {offer.documents && offer.documents.length > 0 ? (
              <div className="space-y-2">
                {offer.documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-100 text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <FileText className="w-4 h-4 text-brand-600" />
                      <span className="font-bold text-slate-900">
                        {doc.originalFilename}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        ({(doc.sizeBytes / 1024).toFixed(1)} KB)
                      </span>
                    </div>

                    <a
                      href={`/api/v1/placements/documents/${doc.id}/download`}
                      download
                      className="inline-flex items-center gap-1 text-xs font-bold text-brand-600 hover:text-brand-800 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </a>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">
                No formal PDF attachment uploaded yet.
              </p>
            )}
          </div>
        </div>

        {/* Right Col: Timeline & Audit Trail */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 mb-4">
              Placement Progress Pipeline
            </h3>
            <PlacementTimeline
              offerStatus={offer.status}
              placementStatus={offer.placement?.status}
              issuedAt={offer.issuedAt}
              acceptedAt={offer.studentResponseAt}
              verifiedAt={offer.placement?.verifiedAt}
              joinedAt={offer.placement?.joiningConfirmedAt}
            />
          </div>

          {/* Institutional NOC Badge */}
          {offer.placement?.nocIssued && (
            <div className="bg-emerald-50 rounded-3xl border border-emerald-200 p-6 space-y-2 text-xs">
              <div className="flex items-center gap-2 text-emerald-800 font-bold">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <span>Institutional NOC Issued</span>
              </div>
              <p className="text-emerald-700">
                Reference Code: <strong>{offer.placement.nocReferenceNumber}</strong>
              </p>
              {offer.placement.verificationNotes && (
                <p className="text-[11px] text-emerald-600 italic">
                  "{offer.placement.verificationNotes}"
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      <AcceptDeclineOfferModal
        isOpen={isAcceptModalOpen}
        onClose={() => setIsAcceptModalOpen(false)}
        offer={offer}
        mode={modalMode}
        onConfirmAccept={async (_offerId, notes) => {
          await acceptMutation.mutateAsync({ notes });
        }}
        onConfirmDecline={async (_offerId, reason, notes) => {
          await declineMutation.mutateAsync({ reason, notes });
        }}
      />
    </div>
  );
};

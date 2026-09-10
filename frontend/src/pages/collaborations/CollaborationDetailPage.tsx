import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Calendar,
  Clock,
  MapPin,
  Globe,
  Users,
  Building2,
  CheckCircle2,
  Mail,
  User,
  Tag,
  ArrowLeft,
  Send,
  Loader2,
  AlertCircle,
  FileText,
  DollarSign,
  ShieldCheck,
} from 'lucide-react';
import { collaborationApi } from '../../lib/collaboration-api';
import { CollaborationTypeBadge } from '../../components/collaborations/CollaborationTypeBadge';
import { CollaborationStatusBadge } from '../../components/collaborations/CollaborationStatusBadge';
import { ParticipateModal } from '../../components/collaborations/ParticipateModal';
import { useAuth } from '../../context/AuthContext';

export const CollaborationDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const { data: collaboration, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['collaboration-detail', id],
    queryFn: () => collaborationApi.getCollaborationById(id!),
    enabled: Boolean(id),
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-brand-600 mb-3" />
        <p className="text-sm font-medium text-slate-500">Loading collaboration details...</p>
      </div>
    );
  }

  if (isError || !collaboration) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-slate-900">Collaboration Not Found</h2>
        <p className="text-sm text-slate-600 mt-2">
          {(error as any)?.message || 'The requested collaboration engagement could not be found.'}
        </p>
        <button
          onClick={() => navigate('/collaborations')}
          className="mt-6 inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-brand-600 rounded-xl hover:bg-brand-700"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Collaborations
        </button>
      </div>
    );
  }

  const isDeadlinePassed =
    collaboration.deadline && new Date(collaboration.deadline) < new Date();
  const isOpen = collaboration.status === 'OPEN';

  const canParticipate =
    isAuthenticated &&
    isOpen &&
    !isDeadlinePassed &&
    (user?.role === 'FACULTY' || user?.role === 'STUDENT') &&
    (collaboration.targetAudience === 'BOTH' ||
      collaboration.targetAudience === (user?.role as any));

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-300">
      {/* Back button */}
      <Link
        to="/collaborations"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Marketplace
      </Link>

      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-800 text-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Columns: Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header Card */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <CollaborationTypeBadge type={collaboration.collaborationType} />
              <CollaborationStatusBadge status={collaboration.status} />
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                {collaboration.mode === 'ONLINE'
                  ? 'Online / Virtual'
                  : collaboration.mode === 'IN_PERSON'
                  ? 'In-Person'
                  : 'Hybrid'}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {collaboration.title}
            </h1>

            {/* Host info snippet */}
            <div className="flex items-center gap-2 text-sm text-slate-600 pt-2 border-t border-slate-100">
              <Building2 className="w-4 h-4 text-brand-600" />
              <span className="font-semibold text-slate-800">
                {collaboration.industryProfile?.companyName || 'Host Industry'}
              </span>
              {collaboration.industryProfile?.isVerified && (
                <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Verified Partner
                </span>
              )}
            </div>
          </div>

          {/* Description Section */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-brand-600" />
              Overview & Objectives
            </h2>
            <div className="prose prose-sm text-slate-600 leading-relaxed whitespace-pre-line">
              {collaboration.description}
            </div>
          </div>

          {/* Instructions / Prerequisites */}
          {collaboration.instructions && (
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-3">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-brand-600" />
                Instructions & Prerequisites
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                {collaboration.instructions}
              </p>
            </div>
          )}

          {/* Department & Domain Tags */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-900">Eligibility & Domains</h2>
            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-500 font-medium block mb-1.5">Eligible Departments:</span>
                {collaboration.eligibleDepartments && collaboration.eligibleDepartments.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {collaboration.eligibleDepartments.map((dept, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 font-medium border border-blue-100"
                      >
                        {dept}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-slate-600 font-medium">All academic departments eligible</span>
                )}
              </div>

              {collaboration.domainTags && collaboration.domainTags.length > 0 && (
                <div className="pt-2">
                  <span className="text-slate-500 font-medium block mb-1.5">Domains & Technologies:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {collaboration.domainTags.map((tag, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-medium"
                      >
                        <Tag className="w-3 h-3 text-slate-400" />
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Key Details & CTA Sidebar */}
        <div className="space-y-6">
          {/* Action / Enrollment Card */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900">Participation</h3>

            {canParticipate ? (
              <button
                onClick={() => setIsModalOpen(true)}
                className="w-full py-3 px-4 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md shadow-brand-500/20"
              >
                <Send className="w-4 h-4" />
                Request Participation
              </button>
            ) : !isAuthenticated ? (
              <div className="text-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-xs text-slate-600 mb-3">Sign in as a student or faculty member to participate.</p>
                <Link
                  to="/login"
                  className="inline-block w-full py-2 text-xs font-bold text-white bg-brand-600 rounded-xl hover:bg-brand-700"
                >
                  Sign In
                </Link>
              </div>
            ) : !isOpen ? (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs text-center font-medium">
                This engagement is currently not open for new applications ({collaboration.status}).
              </div>
            ) : isDeadlinePassed ? (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs text-center font-medium">
                The application deadline for this collaboration has passed.
              </div>
            ) : (
              <div className="p-3 bg-slate-100 rounded-xl text-slate-600 text-xs text-center">
                This collaboration is designated for <strong>{collaboration.targetAudience}</strong> only.
              </div>
            )}

            {/* Quick Facts List */}
            <div className="space-y-3 pt-4 border-t border-slate-100 text-xs text-slate-600">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-slate-500">
                  <Users className="w-4 h-4 text-slate-400" />
                  Target Audience
                </span>
                <span className="font-semibold text-slate-800">
                  {collaboration.targetAudience === 'BOTH'
                    ? 'Faculty & Students'
                    : collaboration.targetAudience === 'FACULTY'
                    ? 'Faculty'
                    : 'Students'}
                </span>
              </div>

              {collaboration.maxParticipants && (
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-500">
                    <Users className="w-4 h-4 text-slate-400" />
                    Capacity
                  </span>
                  <span className="font-semibold text-slate-800">
                    {collaboration.maxParticipants} max participants
                  </span>
                </div>
              )}

              {collaboration.durationDays && (
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-500">
                    <Clock className="w-4 h-4 text-slate-400" />
                    Duration
                  </span>
                  <span className="font-semibold text-slate-800">
                    {collaboration.durationDays} Days ({collaboration.sessionCount || 1} Sessions)
                  </span>
                </div>
              )}

              {collaboration.startDate && (
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-500">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    Start Date
                  </span>
                  <span className="font-semibold text-slate-800">
                    {new Date(collaboration.startDate).toLocaleDateString()}
                  </span>
                </div>
              )}

              {collaboration.deadline && (
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-500">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    Deadline
                  </span>
                  <span className="font-semibold text-slate-800">
                    {new Date(collaboration.deadline).toLocaleDateString()}
                  </span>
                </div>
              )}

              {collaboration.stipend !== null && collaboration.stipend !== undefined && (
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-500">
                    <DollarSign className="w-4 h-4 text-slate-400" />
                    Honorarium / Stipend
                  </span>
                  <span className="font-semibold text-slate-800">
                    {collaboration.stipendCurrency} {collaboration.stipend.toLocaleString()}
                  </span>
                </div>
              )}

              {collaboration.location && (
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-500">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    Venue
                  </span>
                  <span className="font-semibold text-slate-800 truncate max-w-[150px]">
                    {collaboration.location}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Host Industry Card */}
          {collaboration.industryProfile && (
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3">
              <h3 className="text-sm font-bold text-slate-900">Host Organization</h3>
              <div>
                <h4 className="text-base font-bold text-slate-800">{collaboration.industryProfile.companyName}</h4>
                <p className="text-xs text-slate-500">{collaboration.industryProfile.industryType}</p>
              </div>

              {collaboration.industryProfile.description && (
                <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                  {collaboration.industryProfile.description}
                </p>
              )}

              {collaboration.industryProfile.website && (
                <a
                  href={collaboration.industryProfile.website}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-brand-600 hover:text-brand-700 font-semibold"
                >
                  <Globe className="w-3.5 h-3.5" />
                  Visit Website
                </a>
              )}
            </div>
          )}

          {/* Contact Coordinator */}
          {(collaboration.contactPerson || collaboration.contactEmail) && (
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-2 text-xs">
              <h3 className="text-sm font-bold text-slate-900">Coordinator</h3>
              {collaboration.contactPerson && (
                <div className="flex items-center gap-1.5 text-slate-700">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-medium">{collaboration.contactPerson}</span>
                </div>
              )}
              {collaboration.contactEmail && (
                <div className="flex items-center gap-1.5 text-slate-700">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>{collaboration.contactEmail}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Participation Request Modal */}
      {collaboration && (
        <ParticipateModal
          collaboration={collaboration}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => {
            setSuccessMessage(
              'Your participation request has been successfully submitted! Track its review status on your dashboard.',
            );
            refetch();
          }}
        />
      )}
    </div>
  );
};

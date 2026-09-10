import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Building2,
  MapPin,
  Calendar,
  Clock,
  Video,
  FileText,
  Download,
  AlertTriangle,
  X,
  ExternalLink,
} from 'lucide-react';
import { applicationApi } from '../../lib/application-api';
import { ApplicationTimeline } from '../../components/applications/ApplicationTimeline';
import { StudentApplicationItem } from '../../types/applications';

export const ApplicationDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const [showWithdrawDialog, setShowWithdrawDialog] = useState(false);
  const [withdrawError, setWithdrawError] = useState<string | null>(null);

  const {
    data: application,
    isLoading,
    isError,
  } = useQuery<StudentApplicationItem>({
    queryKey: ['my-application-detail', id],
    queryFn: () => applicationApi.getMyApplicationById(id!),
    enabled: !!id,
  });

  const withdrawMutation = useMutation({
    mutationFn: () => applicationApi.withdrawApplication(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-application-detail', id] });
      queryClient.invalidateQueries({ queryKey: ['my-applications'] });
      setShowWithdrawDialog(false);
    },
    onError: (err: any) => {
      setWithdrawError(err.message || 'Failed to withdraw application.');
    },
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-500">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="text-sm font-medium">Loading application details and timeline...</p>
      </div>
    );
  }

  if (isError || !application) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-3xl p-8 text-center max-w-lg mx-auto my-12">
        <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
        <h3 className="text-sm font-bold text-red-900">Application Not Found</h3>
        <p className="text-xs text-red-600 mt-1">Unable to load the requested application.</p>
        <Link
          to="/applications"
          className="inline-flex items-center gap-1.5 mt-4 text-xs font-bold text-blue-600 hover:underline"
        >
          <ArrowLeft className="w-4 h-4" /> Back to My Applications
        </Link>
      </div>
    );
  }

  const isWithdrawn = application.status === 'WITHDRAWN';
  const isDecided = application.status === 'SELECTED' || application.status === 'REJECTED';
  const canWithdraw = !isWithdrawn && !isDecided;

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Back link */}
      <div>
        <Link
          to="/applications"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to My Applications
        </Link>
      </div>

      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100">
                {application.opportunity.opportunityType.replace('_', ' ')}
              </span>
              {application.opportunity.isRemote && (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                  100% Remote
                </span>
              )}
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                {application.opportunity.industryProfile?.companyName || 'Enterprise Partner'}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              {application.opportunity.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-slate-400" /> {application.opportunity.location}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-slate-400" /> Submitted on{' '}
                {new Date(application.submittedAt).toLocaleDateString()}
              </span>
              {application.matchScore !== undefined && (
                <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                  Match Score: {application.matchScore}%
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end gap-3">
            <Link
              to={`/opportunities/${application.opportunity.slug}`}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-colors"
            >
              View Opportunity <ExternalLink className="w-3.5 h-3.5" />
            </Link>

            {canWithdraw && (
              <button
                onClick={() => setShowWithdrawDialog(true)}
                className="px-4 py-2 text-xs font-bold text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl transition-colors"
              >
                Withdraw Application
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Stage Progression Timeline */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-slate-900">Recruitment Progression Timeline</h2>
        <ApplicationTimeline
          currentStatus={application.status}
          statusHistory={application.statusHistory || []}
          submittedAt={application.submittedAt}
        />
      </div>

      {/* Scheduled Interviews Card (if any) */}
      {application.interviews && application.interviews.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-600" /> Scheduled Interview Rounds
          </h2>

          <div className="space-y-4">
            {application.interviews.map((interview) => (
              <div
                key={interview.id}
                className="p-5 rounded-2xl bg-indigo-50/50 border border-indigo-100 space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-100 text-indigo-800">
                      {interview.mode.replace('_', ' ')}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 mt-1">{interview.title}</h3>
                  </div>

                  <div className="text-left sm:text-right text-xs">
                    <p className="font-bold text-indigo-950 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-indigo-600" />
                      {new Date(interview.scheduledAt).toLocaleString()} ({interview.durationMins} mins)
                    </p>
                    {interview.interviewer && (
                      <p className="text-slate-500 mt-0.5">Interviewer: {interview.interviewer}</p>
                    )}
                  </div>
                </div>

                {interview.instructions && (
                  <div className="p-3 bg-white rounded-xl border border-indigo-100/80 text-xs text-slate-700">
                    <p className="font-bold text-slate-900 mb-0.5">Candidate Preparation Instructions:</p>
                    <p className="leading-relaxed">{interview.instructions}</p>
                  </div>
                )}

                {interview.meetingLink && (
                  <div className="pt-1">
                    <a
                      href={interview.meetingLink.startsWith('http') ? interview.meetingLink : `https://${interview.meetingLink}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm transition-colors"
                    >
                      <Video className="w-3.5 h-3.5" /> Join Meeting / View Location
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Documents & Cover Letter */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cover letter */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-3">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" /> Submitted Cover Letter
          </h2>
          {application.coverLetter ? (
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line bg-slate-50 p-4 rounded-2xl border border-slate-100">
              {application.coverLetter}
            </p>
          ) : (
            <p className="text-xs text-slate-400 italic">No text cover letter attached with application.</p>
          )}
        </div>

        {/* Uploaded Documents */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-3">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Download className="w-5 h-5 text-blue-600" /> Application Documents
          </h2>

          <div className="space-y-2">
            {application.documents && application.documents.length > 0 ? (
              application.documents.map((doc) => (
                <div
                  key={doc.id}
                  className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900 truncate">{doc.originalFilename}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {doc.documentType} • {(doc.sizeBytes / 1024).toFixed(1)} KB
                    </p>
                  </div>

                  <a
                    href={`/api/v1/applications/me/${application.id}/documents/${doc.id}/download`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 text-blue-600 hover:bg-blue-100/60 rounded-xl transition-colors flex-shrink-0"
                    title="Download Document"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 italic">No document files attached.</p>
            )}
          </div>
        </div>
      </div>

      {/* Withdrawal Confirmation Dialog */}
      {showWithdrawDialog && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-start justify-between gap-3">
              <div className="w-10 h-10 rounded-2xl bg-red-50 flex items-center justify-center text-red-600 flex-shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <button
                onClick={() => setShowWithdrawDialog(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-900">Withdraw Application?</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Are you sure you want to withdraw your application for{' '}
                <span className="font-semibold text-slate-700">{application.opportunity.title}</span>? This will
                conclude your candidacy and cannot be undone.
              </p>
            </div>

            {withdrawError && (
              <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200">
                {withdrawError}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowWithdrawDialog(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={() => withdrawMutation.mutate()}
                disabled={withdrawMutation.isPending}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-sm transition-colors disabled:opacity-50"
              >
                {withdrawMutation.isPending ? 'Withdrawing...' : 'Yes, Withdraw Application'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

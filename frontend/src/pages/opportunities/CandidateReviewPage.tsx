import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  GraduationCap,
  Sparkles,
  Award,
  CheckCircle2,
  Calendar,
  Clock,
  Download,
  FileText,
  AlertTriangle,
  Mail,
  Phone,
  Building,
  PlusCircle,
} from 'lucide-react';
import { applicationApi } from '../../lib/application-api';
import { placementApi } from '../../lib/placement-api';
import { ScheduleInterviewModal } from '../../components/applications/ScheduleInterviewModal';
import { StatusTransitionModal } from '../../components/applications/StatusTransitionModal';
import { CreateOfferModal } from '../../components/placements/CreateOfferModal';
import {
  RecruiterCandidateApplication,
  ApplicationStatus,
} from '../../types/applications';

export const CandidateReviewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const [activeModal, setActiveModal] = useState<'NONE' | 'INTERVIEW' | 'STATUS'>('NONE');
  const [targetStatus, setTargetStatus] = useState<ApplicationStatus>('UNDER_REVIEW');
  const [isCreateOfferOpen, setIsCreateOfferOpen] = useState(false);

  const {
    data: application,
    isLoading,
    isError,
  } = useQuery<RecruiterCandidateApplication>({
    queryKey: ['recruiter-candidate-review', id],
    queryFn: () => applicationApi.getCandidateReview(id!),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-500">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="text-sm font-medium">Loading candidate profile and evaluation metrics...</p>
      </div>
    );
  }

  if (isError || !application) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-3xl p-8 text-center max-w-lg mx-auto my-12">
        <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
        <h3 className="text-sm font-bold text-red-900">Candidate Not Found</h3>
        <p className="text-xs text-red-600 mt-1">
          Unable to retrieve candidate evaluation data or unauthorized access.
        </p>
        <Link
          to="/portal/industry/opportunities"
          className="inline-flex items-center gap-1.5 mt-4 text-xs font-bold text-blue-600 hover:underline"
        >
          <ArrowLeft className="w-4 h-4" /> Back to My Opportunities
        </Link>
      </div>
    );
  }

  const profile = application.studentProfile;
  const snapshotBreakdown = application.matchBreakdownSnapshot?.breakdown;
  const snapshotSkills = application.matchBreakdownSnapshot?.skillRequirements || [];

  const handleOpenStatusModal = (status: ApplicationStatus) => {
    setTargetStatus(status);
    setActiveModal('STATUS');
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Back link */}
      <div>
        <Link
          to={`/portal/industry/opportunities/${application.opportunityId}/applications`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Opportunity Candidate Pipeline
        </Link>
      </div>

      {/* Main Candidate Header Card */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white font-black text-2xl shadow-md flex-shrink-0">
              {profile.fullName.charAt(0)}
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-extrabold text-slate-900">{profile.fullName}</h1>
                <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200">
                  {application.status.replace('_', ' ')}
                </span>
              </div>

              <p className="text-xs text-slate-600 flex flex-wrap items-center gap-3 pt-0.5">
                <span className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-slate-400" /> {profile.user?.email || 'N/A'}
                </span>
                {profile.phoneNumber && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-slate-400" /> {profile.phoneNumber}
                  </span>
                )}
                {profile.institution && (
                  <span className="flex items-center gap-1">
                    <Building className="w-3.5 h-3.5 text-slate-400" /> {profile.institution.name}
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Match Score Badge */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200/80 rounded-2xl p-4 flex items-center gap-4 self-start lg:self-auto">
            <div>
              <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">
                Candidate Fit Score
              </p>
              <p className="text-3xl font-black text-blue-900">{application.matchScoreSnapshot}%</p>
            </div>
            <Sparkles className="w-8 h-8 text-blue-600/80" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Columns: Candidate Details, Skills & Match Snapshot */}
        <div className="lg:col-span-2 space-y-6">
          {/* Academic & Background */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-blue-600" /> Academic &amp; Profile Summary
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-slate-400 font-medium">Degree &amp; Program</p>
                <p className="font-bold text-slate-900 mt-0.5">{profile.degree || 'B.Tech'}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-slate-400 font-medium">Department</p>
                <p className="font-bold text-slate-900 mt-0.5">{profile.department || 'Computer Science'}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-slate-400 font-medium">Graduation Batch</p>
                <p className="font-bold text-slate-900 mt-0.5">{profile.graduationYear || '2026'}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-slate-400 font-medium">Academic CGPA</p>
                <p className="font-bold text-slate-900 mt-0.5">{profile.cgpa ? `${profile.cgpa} / 10` : 'N/A'}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-slate-400 font-medium">Preferred Roles</p>
                <p className="font-bold text-slate-900 mt-0.5 truncate">
                  {profile.preferredRoles?.join(', ') || 'Software Engineer'}
                </p>
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-slate-400 font-medium">Applied On</p>
                <p className="font-bold text-slate-900 mt-0.5">
                  {new Date(application.submittedAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          {/* Snapshotted 5-Factor Match Breakdown */}
          {snapshotBreakdown && (
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-600" /> Deterministic Match Breakdown (At Submission)
              </h2>

              <div className="space-y-3">
                {Object.entries(snapshotBreakdown).map(([key, item]: [string, any]) => (
                  <div key={key} className="space-y-1 text-xs">
                    <div className="flex items-center justify-between font-semibold text-slate-700">
                      <span className="capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                      <span>
                        {item.score} / {item.max} pts ({item.percentage}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 rounded-full transition-all"
                        style={{ width: `${Math.min(100, item.percentage)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Evaluated Skills Matrix */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Award className="w-5 h-5 text-blue-600" /> Required Skills &amp; Proficiency Evaluation
            </h2>

            <div className="space-y-2">
              {snapshotSkills.map((req: any, idx: number) => (
                <div
                  key={idx}
                  className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{req.skillName}</span>
                      {req.isVerified && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.2 rounded">
                          <CheckCircle2 className="w-3 h-3" /> Assessment Verified
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Required: <span className="font-semibold">{req.requiredProficiency}</span> • Student:{' '}
                      <span className="font-semibold">{req.studentProficiency || 'None'}</span>
                    </p>
                  </div>

                  <span
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-bold ${
                      req.status === 'SATISFIED'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-amber-50 text-amber-800 border border-amber-200'
                    }`}
                  >
                    {req.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Cover Letter & Documents */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" /> Candidate Cover Letter &amp; Documents
            </h2>

            {application.coverLetter && (
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                {application.coverLetter}
              </div>
            )}

            <div className="space-y-2 pt-2">
              {application.documents && application.documents.length > 0 ? (
                application.documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="p-3.5 bg-blue-50/50 rounded-2xl border border-blue-100 flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-bold text-slate-900">{doc.originalFilename}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {doc.documentType} • {(doc.sizeBytes / 1024).toFixed(1)} KB
                      </p>
                    </div>

                    <a
                      href={`/api/v1/industry/applications/${application.id}/documents/${doc.id}/download`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white font-bold rounded-xl shadow-sm hover:bg-blue-700 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" /> Download
                    </a>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 italic">No document files uploaded by candidate.</p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Recruitment Controls, Interview Schedule & Notes */}
        <div className="space-y-6">
          {/* Stage Transition Control Card */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-900">Recruitment Stage Actions</h2>

            <div className="flex flex-col gap-2 text-xs">
              <button
                onClick={() => handleOpenStatusModal('UNDER_REVIEW')}
                className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-left transition-colors flex items-center justify-between"
              >
                <span>Mark Under Review</span>
                <Clock className="w-4 h-4 text-slate-500" />
              </button>

              <button
                onClick={() => handleOpenStatusModal('SHORTLISTED')}
                className="w-full py-2.5 px-4 bg-blue-50 hover:bg-blue-100 text-blue-900 font-bold rounded-xl text-left transition-colors flex items-center justify-between border border-blue-200"
              >
                <span>Shortlist Candidate</span>
                <CheckCircle2 className="w-4 h-4 text-blue-600" />
              </button>

              <button
                onClick={() => setActiveModal('INTERVIEW')}
                className="w-full py-2.5 px-4 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 font-bold rounded-xl text-left transition-colors flex items-center justify-between border border-indigo-200"
              >
                <span>Schedule Interview Round</span>
                <Calendar className="w-4 h-4 text-indigo-600" />
              </button>

              <button
                onClick={() => handleOpenStatusModal('SELECTED')}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-left transition-colors flex items-center justify-between shadow-sm"
              >
                <span>Confirm Selection (Hire)</span>
                <Award className="w-4 h-4 text-white" />
              </button>

              {/* Phase 13: Create Placement Offer for SELECTED candidates */}
              {application.status === 'SELECTED' && (
                <button
                  onClick={() => setIsCreateOfferOpen(true)}
                  className="w-full py-2.5 px-4 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-left transition-colors flex items-center justify-between shadow-sm mt-1"
                >
                  <span>Create Placement Offer</span>
                  <PlusCircle className="w-4 h-4 text-white" />
                </button>
              )}

              <button
                onClick={() => handleOpenStatusModal('REJECTED')}
                className="w-full py-2.5 px-4 bg-red-50 hover:bg-red-100 text-red-700 font-bold rounded-xl text-left transition-colors flex items-center justify-between border border-red-200 mt-2"
              >
                <span>Reject Candidate</span>
                <AlertTriangle className="w-4 h-4 text-red-600" />
              </button>
            </div>
          </div>

          {/* Scheduled Interviews Log */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-600" /> Interview Rounds
              </h2>
              <button
                onClick={() => setActiveModal('INTERVIEW')}
                className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1"
              >
                <PlusCircle className="w-3.5 h-3.5" /> Add Round
              </button>
            </div>

            <div className="space-y-3">
              {application.interviews && application.interviews.length > 0 ? (
                application.interviews.map((interview) => (
                  <div
                    key={interview.id}
                    className="p-3.5 rounded-2xl bg-indigo-50/50 border border-indigo-100 text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between font-bold text-slate-900">
                      <span>{interview.title}</span>
                      <span className="text-[10px] text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded">
                        {interview.status}
                      </span>
                    </div>
                    <p className="text-slate-600 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {new Date(interview.scheduledAt).toLocaleString()} ({interview.durationMins} mins)
                    </p>
                    {interview.meetingLink && (
                      <p className="text-[11px] text-blue-600 truncate">
                        Link: {interview.meetingLink}
                      </p>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 italic">No interview rounds scheduled yet.</p>
              )}
            </div>
          </div>

          {/* Private Recruiter Notes */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-3">
            <h2 className="text-base font-bold text-slate-900">Private Recruiter Notes</h2>
            {application.recruiterNotes ? (
              <p className="text-xs text-slate-700 bg-slate-50 p-3.5 rounded-2xl border border-slate-100 whitespace-pre-line">
                {application.recruiterNotes}
              </p>
            ) : (
              <p className="text-xs text-slate-400 italic">No private internal notes recorded.</p>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <ScheduleInterviewModal
        applicationId={application.id}
        candidateName={profile.fullName}
        isOpen={activeModal === 'INTERVIEW'}
        onClose={() => setActiveModal('NONE')}
      />

      <StatusTransitionModal
        applicationId={application.id}
        candidateName={profile.fullName}
        targetStatus={targetStatus}
        isOpen={activeModal === 'STATUS'}
        onClose={() => setActiveModal('NONE')}
      />

      {/* Phase 13: Create Placement Offer Modal */}
      <CreateOfferModal
        isOpen={isCreateOfferOpen}
        onClose={() => setIsCreateOfferOpen(false)}
        applicationId={application.id}
        candidateName={profile.fullName}
        opportunityTitle={application.opportunity?.title || ''}
        onSubmit={async (payload) => {
          await placementApi.createOffer(application.id, payload);
        }}
      />
    </div>
  );
};

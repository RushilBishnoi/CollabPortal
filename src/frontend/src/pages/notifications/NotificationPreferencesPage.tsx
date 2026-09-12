import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Settings,
  Lock,
  CheckCircle2,
  AlertCircle,
  Save,
} from 'lucide-react';
import { notificationsApi } from '../../lib/notifications-api';
import { NotificationPreference, NotificationType } from '../../types/notifications';

interface CategoryGroup {
  name: string;
  description: string;
  types: {
    type: NotificationType;
    label: string;
    description: string;
  }[];
}

const NOTIFICATION_CATEGORIES: CategoryGroup[] = [
  {
    name: 'Placements & Formal Offers (Mandatory)',
    description: 'Official employment offers, formal offer issuance, response confirmations, and TPO verification notices.',
    types: [
      {
        type: 'PLACEMENT_OFFER_ISSUED',
        label: 'Placement Offer Issued',
        description: 'Instant notification when an employer issues a formal job or internship offer.',
      },
      {
        type: 'PLACEMENT_OFFER_ACCEPTED',
        label: 'Offer Accepted / Declined',
        description: 'Updates when a candidate accepts or declines an issued placement offer.',
      },
      {
        type: 'PLACEMENT_VERIFIED',
        label: 'Placement Institutional Verification',
        description: 'Notices when an institutional administrator or TPO approves a placement record.',
      },
      {
        type: 'PLACEMENT_REVOKED',
        label: 'Placement Revocation',
        description: 'Critical notifications if an offer or placement verification status is revoked.',
      },
    ],
  },
  {
    name: 'Interviews & Schedules (Mandatory)',
    description: 'Meeting schedules, interview round invitations, reschedules, and cancellations.',
    types: [
      {
        type: 'INTERVIEW_SCHEDULED',
        label: 'Interview Scheduled',
        description: 'When an employer schedules an interview or assessment round with meeting details.',
      },
      {
        type: 'INTERVIEW_UPDATED',
        label: 'Interview Rescheduled / Updated',
        description: 'Changes to interview timing, link, mode, or interviewer details.',
      },
      {
        type: 'INTERVIEW_CANCELLED',
        label: 'Interview Cancelled',
        description: 'Cancellation of an upcoming interview session.',
      },
    ],
  },
  {
    name: 'Applications & Opportunities',
    description: 'Status updates on submitted applications and alerts for matching posted opportunities.',
    types: [
      {
        type: 'OPPORTUNITY_PUBLISHED',
        label: 'New Matching Opportunities',
        description: 'Alerts when relevant internships or job openings matching your skill profile are published.',
      },
      {
        type: 'APPLICATION_SUBMITTED',
        label: 'Application Submissions',
        description: 'Confirmation when an application is successfully received by recruiters.',
      },
      {
        type: 'APPLICATION_SHORTLISTED',
        label: 'Shortlisted Applications',
        description: 'Alerts when your application is shortlisted for further evaluation.',
      },
      {
        type: 'APPLICATION_STATUS_CHANGED',
        label: 'Application Status Updates',
        description: 'General progress updates across application workflow stages.',
      },
    ],
  },
  {
    name: 'Mentorship & 1-on-1 Sessions',
    description: 'Mentorship requests, mentor confirmations, session bookings, and rescheduling.',
    types: [
      {
        type: 'MENTOR_REQUEST_RECEIVED',
        label: 'Mentorship Request Received',
        description: 'When a mentee requests mentorship from a mentor.',
      },
      {
        type: 'MENTOR_REQUEST_ACCEPTED',
        label: 'Mentorship Request Response',
        description: 'When a mentor accepts or responds to a student mentorship request.',
      },
      {
        type: 'MENTORSHIP_SESSION_SCHEDULED',
        label: 'Mentorship Session Bookings',
        description: 'When a 1-on-1 session is booked with calendar meeting links.',
      },
      {
        type: 'MENTORSHIP_SESSION_RESCHEDULED',
        label: 'Session Rescheduling & Updates',
        description: 'When a session date or time is modified by either participant.',
      },
      {
        type: 'MENTORSHIP_SESSION_CANCELLED',
        label: 'Session Cancellations',
        description: 'When a scheduled mentorship session is cancelled.',
      },
    ],
  },
  {
    name: 'Industry Collaborations & Projects',
    description: 'Participation requests, faculty and student project approvals, and engagement milestones.',
    types: [
      {
        type: 'COLLABORATION_PUBLISHED',
        label: 'New Collaboration Engagements',
        description: 'When industry partners publish R&D, curriculum, or joint lab opportunities.',
      },
      {
        type: 'COLLABORATION_PARTICIPATION_REQUESTED',
        label: 'Participation Requests',
        description: 'When faculty or students request to join an active industry collaboration.',
      },
      {
        type: 'COLLABORATION_PARTICIPATION_APPROVED',
        label: 'Participation Approvals',
        description: 'When industry organizers approve your collaboration participation.',
      },
      {
        type: 'COLLABORATION_STATUS_CHANGED',
        label: 'Project Milestone Status',
        description: 'Stage transitions across collaboration lifecycle.',
      },
    ],
  },
  {
    name: 'Learning Paths & Skill Diagnostics',
    description: 'Learning path enrollments, completions, assessments, and skill recommendations.',
    types: [
      {
        type: 'LEARNING_PATH_ENROLLED',
        label: 'Path Enrollment Confirmations',
        description: 'When you enroll in curated learning paths.',
      },
      {
        type: 'LEARNING_PATH_COMPLETED',
        label: 'Path Completion & Certifications',
        description: 'Achievements upon completing 100% of items in a learning path.',
      },
      {
        type: 'ASSESSMENT_ASSIGNED',
        label: 'Skill Diagnostic Tests',
        description: 'When assessments are assigned to benchmark technical competencies.',
      },
      {
        type: 'LEARNING_PATH_RECOMMENDED',
        label: 'Automated Skill Recommendations',
        description: 'Suggestions generated from skill gap analysis.',
      },
    ],
  },
  {
    name: 'Platform Announcements',
    description: 'System maintenance notices, governance bulletins, and platform updates.',
    types: [
      {
        type: 'SYSTEM_ANNOUNCEMENT',
        label: 'Administrative Bulletins',
        description: 'Important platform-wide announcements from system administrators.',
      },
    ],
  },
];

export const NotificationPreferencesPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [prefsState, setPrefsState] = useState<Record<string, boolean>>({});
  const [saveSuccess, setSaveSuccess] = useState(false);

  const { data: serverPrefs, isLoading } = useQuery({
    queryKey: ['notifications', 'preferences'],
    queryFn: () => notificationsApi.getPreferences(),
  });

  useEffect(() => {
    if (serverPrefs) {
      const stateMap: Record<string, boolean> = {};
      serverPrefs.forEach((p) => {
        stateMap[p.notificationType] = p.inAppEnabled;
      });
      setPrefsState(stateMap);
    }
  }, [serverPrefs]);

  const updateMutation = useMutation({
    mutationFn: () => {
      const items = Object.entries(prefsState).map(([type, enabled]) => ({
        notificationType: type as NotificationType,
        inAppEnabled: enabled,
      }));
      return notificationsApi.updatePreferences(items);
    },
    onSuccess: () => {
      setSaveSuccess(true);
      queryClient.invalidateQueries({ queryKey: ['notifications', 'preferences'] });
      setTimeout(() => setSaveSuccess(false), 4000);
    },
  });

  const handleToggle = (type: NotificationType, isMandatory: boolean) => {
    if (isMandatory) return; // Prevent disabling mandatory types on UI
    setPrefsState((prev) => ({
      ...prev,
      [type]: !(prev[type] ?? true),
    }));
  };

  const getPrefItem = (type: NotificationType): NotificationPreference | undefined => {
    return serverPrefs?.find((p) => p.notificationType === type);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Back Link */}
      <div>
        <Link
          to="/notifications"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Notifications</span>
        </Link>
      </div>

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 rounded-xl">
              <Settings className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Notification Preferences
            </h1>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Control which in-app notices and activity digests you receive.
          </p>
        </div>

        <button
          data-testid="save-preferences-btn"
          onClick={() => updateMutation.mutate()}
          disabled={updateMutation.isPending || isLoading}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-sm disabled:opacity-50 transition-colors"
        >
          <Save className="w-4 h-4" />
          <span>{updateMutation.isPending ? 'Saving...' : 'Save Preferences'}</span>
        </button>
      </div>

      {/* Success / Error Alerts */}
      {saveSuccess && (
        <div
          data-testid="pref-save-success-alert"
          className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center gap-2.5 text-xs text-emerald-800 dark:text-emerald-300 animate-in fade-in"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>Your notification preferences have been saved successfully.</span>
        </div>
      )}

      {updateMutation.isError && (
        <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 flex items-center gap-2.5 text-xs text-red-800 dark:text-red-300">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
          <span>Failed to save preferences: {(updateMutation.error as Error)?.message}</span>
        </div>
      )}

      {/* Categories Accordion/Cards */}
      <div className="space-y-6">
        {NOTIFICATION_CATEGORIES.map((cat, idx) => (
          <div
            key={idx}
            className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden"
          >
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                {cat.name}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {cat.description}
              </p>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {cat.types.map((item) => {
                const pref = getPrefItem(item.type);
                const isMandatory = pref?.isMandatory ?? (item.type.startsWith('PLACEMENT_OFFER') || item.type.startsWith('INTERVIEW'));
                const isChecked = isMandatory ? true : (prefsState[item.type] ?? true);

                return (
                  <div
                    key={item.type}
                    data-testid={`pref-row-${item.type}`}
                    className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <div className="space-y-0.5 max-w-xl">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                          {item.label}
                        </span>
                        {isMandatory && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                            <Lock className="w-2.5 h-2.5" />
                            <span>Mandatory</span>
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {item.description}
                      </p>
                    </div>

                    {/* Toggle Switch */}
                    <div className="flex items-center flex-shrink-0">
                      <button
                        type="button"
                        role="switch"
                        aria-checked={isChecked}
                        disabled={isMandatory}
                        data-testid={`toggle-${item.type}`}
                        onClick={() => handleToggle(item.type, isMandatory)}
                        className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                          isChecked
                            ? 'bg-blue-600'
                            : 'bg-slate-200 dark:bg-slate-700'
                        } ${isMandatory ? 'opacity-60 cursor-not-allowed' : ''}`}
                      >
                        <span
                          aria-hidden="true"
                          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            isChecked ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  X,
  Calendar,
  Clock,
  Video,
  User,
  FileText,
  AlertTriangle,
} from 'lucide-react';
import { applicationApi } from '../../lib/application-api';
import { InterviewMode } from '../../types/applications';

interface ScheduleInterviewModalProps {
  applicationId: string;
  candidateName: string;
  isOpen: boolean;
  onClose: () => void;
}

export const ScheduleInterviewModal: React.FC<ScheduleInterviewModalProps> = ({
  applicationId,
  candidateName,
  isOpen,
  onClose,
}) => {
  const queryClient = useQueryClient();

  const [title, setTitle] = useState('Technical Screening Round 1');
  const [scheduledAt, setScheduledAt] = useState('');
  const [durationMins, setDurationMins] = useState(45);
  const [mode, setMode] = useState<InterviewMode>('ONLINE_MEETING');
  const [meetingLink, setMeetingLink] = useState('');
  const [interviewer, setInterviewer] = useState('');
  const [instructions, setInstructions] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const scheduleMutation = useMutation({
    mutationFn: () => {
      if (!scheduledAt) {
        throw new Error('Please select an interview date and time.');
      }

      return applicationApi.scheduleInterview(applicationId, {
        title,
        scheduledAt: new Date(scheduledAt).toISOString(),
        durationMins: Number(durationMins) || 45,
        mode,
        meetingLink: meetingLink.trim() || undefined,
        interviewer: interviewer.trim() || undefined,
        instructions: instructions.trim() || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recruiter-candidate-review', applicationId] });
      queryClient.invalidateQueries({ queryKey: ['recruiter-opportunity-applications'] });
      onClose();
    },
    onError: (err: any) => {
      setErrorMsg(err.message || 'Failed to schedule interview round.');
    },
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 mb-1.5">
              <Calendar className="w-3.5 h-3.5" /> Recruitment Stage Action
            </div>
            <h2 className="text-xl font-bold text-slate-900">Schedule Interview</h2>
            <p className="text-xs text-slate-500 mt-0.5">Candidate: {candidateName}</p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-2.5 text-xs text-red-800">
            <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            setErrorMsg(null);
            scheduleMutation.mutate();
          }}
          className="space-y-4 text-xs"
        >
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700">Interview Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. Technical Round 1, System Design Interview"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" /> Date &amp; Time *
              </label>
              <input
                type="datetime-local"
                required
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" /> Duration (mins)
              </label>
              <input
                type="number"
                min={15}
                max={240}
                value={durationMins}
                onChange={(e) => setDurationMins(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700">Interview Mode</label>
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value as InterviewMode)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              >
                <option value="ONLINE_MEETING">Online Video Meeting</option>
                <option value="IN_PERSON">In-Person at Campus / Office</option>
                <option value="TELEPHONIC">Telephonic Screening</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-slate-400" /> Interviewer / Panel
              </label>
              <input
                type="text"
                placeholder="e.g. Lead Engineer, Hiring Manager"
                value={interviewer}
                onChange={(e) => setInterviewer(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 flex items-center gap-1">
              <Video className="w-3.5 h-3.5 text-slate-400" /> Video Meeting Link or Venue Address
            </label>
            <input
              type="text"
              placeholder="e.g. https://meet.google.com/xyz-abc or Office Room 402"
              value={meetingLink}
              onChange={(e) => setMeetingLink(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-slate-400" /> Instructions for Candidate
            </label>
            <textarea
              rows={3}
              placeholder="Please have your laptop ready with your project code repository..."
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
            />
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 font-semibold text-slate-600 hover:text-slate-900 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={scheduleMutation.isPending}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-sm transition-colors disabled:opacity-50"
            >
              {scheduleMutation.isPending ? 'Scheduling...' : 'Confirm Schedule'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

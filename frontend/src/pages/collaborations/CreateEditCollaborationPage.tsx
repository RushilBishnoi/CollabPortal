import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  Save,
  Send,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { collaborationApi } from '../../lib/collaboration-api';
import {
  CollaborationType,
  CollaborationStatus,
  CollaborationAudience,
  CollaborationMode,
} from '../../types/collaboration';

export const CreateEditCollaborationPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [collaborationType, setCollaborationType] = useState<CollaborationType>('WORKSHOP');
  const [targetAudience, setTargetAudience] = useState<CollaborationAudience>('BOTH');
  const [mode, setMode] = useState<CollaborationMode>('ONLINE');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [durationDays, setDurationDays] = useState<number | ''>('');
  const [sessionCount, setSessionCount] = useState<number | ''>('');
  const [location, setLocation] = useState('');
  const [meetingLink, setMeetingLink] = useState('');
  const [maxParticipants, setMaxParticipants] = useState<number | ''>('');
  const [eligibleDepartmentsInput, setEligibleDepartmentsInput] = useState('');
  const [domainTagsInput, setDomainTagsInput] = useState('');
  const [stipend, setStipend] = useState<number | ''>('');
  const [stipendCurrency, setStipendCurrency] = useState('INR');
  const [contactPerson, setContactPerson] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [instructions, setInstructions] = useState('');
  const [deadline, setDeadline] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch existing collaboration if editing
  const { data: existingData, isLoading: isLoadingExisting } = useQuery({
    queryKey: ['collaboration-edit', id],
    queryFn: () => collaborationApi.getCollaborationById(id!),
    enabled: isEditing,
  });

  useEffect(() => {
    if (existingData) {
      setTitle(existingData.title || '');
      setDescription(existingData.description || '');
      setCollaborationType(existingData.collaborationType || 'WORKSHOP');
      setTargetAudience(existingData.targetAudience || 'BOTH');
      setMode(existingData.mode || 'ONLINE');
      setStartDate(existingData.startDate ? existingData.startDate.slice(0, 10) : '');
      setEndDate(existingData.endDate ? existingData.endDate.slice(0, 10) : '');
      setDurationDays(existingData.durationDays || '');
      setSessionCount(existingData.sessionCount || '');
      setLocation(existingData.location || '');
      setMeetingLink(existingData.meetingLink || '');
      setMaxParticipants(existingData.maxParticipants || '');
      setEligibleDepartmentsInput((existingData.eligibleDepartments || []).join(', '));
      setDomainTagsInput((existingData.domainTags || []).join(', '));
      setStipend(existingData.stipend !== null && existingData.stipend !== undefined ? existingData.stipend : '');
      setStipendCurrency(existingData.stipendCurrency || 'INR');
      setContactPerson(existingData.contactPerson || '');
      setContactEmail(existingData.contactEmail || '');
      setInstructions(existingData.instructions || '');
      setDeadline(existingData.deadline ? existingData.deadline.slice(0, 10) : '');
    }
  }, [existingData]);

  const handleSubmit = async (publishNow: boolean) => {
    setIsSubmitting(true);
    setError(null);

    const eligibleDepartments = eligibleDepartmentsInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const domainTags = domainTagsInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const payload: any = {
      title,
      description,
      collaborationType,
      targetAudience,
      mode,
      startDate: startDate ? new Date(startDate).toISOString() : undefined,
      endDate: endDate ? new Date(endDate).toISOString() : undefined,
      durationDays: durationDays ? Number(durationDays) : undefined,
      sessionCount: sessionCount ? Number(sessionCount) : undefined,
      location: location || undefined,
      meetingLink: meetingLink || undefined,
      maxParticipants: maxParticipants ? Number(maxParticipants) : undefined,
      eligibleDepartments,
      domainTags,
      stipend: stipend !== '' ? Number(stipend) : undefined,
      stipendCurrency,
      contactPerson: contactPerson || undefined,
      contactEmail: contactEmail || undefined,
      instructions: instructions || undefined,
      deadline: deadline ? new Date(deadline).toISOString() : undefined,
      ...(!isEditing && {
        status: publishNow ? ('OPEN' as CollaborationStatus) : ('DRAFT' as CollaborationStatus),
      }),
    };

    try {
      if (isEditing) {
        await collaborationApi.updateCollaboration(id!, payload);
        if (publishNow && existingData?.status === 'DRAFT') {
          await collaborationApi.updateCollaborationStatus(id!, 'OPEN');
        }
      } else {
        await collaborationApi.createCollaboration(payload);
      }

      navigate('/industry/collaborations');
    } catch (err: any) {
      setError(err.message || 'Failed to save collaboration engagement');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isEditing && isLoadingExisting) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-brand-600 mb-3" />
        <p className="text-sm font-medium text-slate-500">Loading collaboration form...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-in fade-in duration-300">
      {/* Back button */}
      <Link
        to="/industry/collaborations"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to My Collaborations
      </Link>

      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {isEditing ? 'Edit Collaboration Engagement' : 'Create New Collaboration Engagement'}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Publish workshops, faculty internships, FDPs, consultancy, or live student projects.
          </p>
        </div>

        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-6">
          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Next-Gen Cloud & Microservices Industrial Workshop"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 placeholder:text-slate-400"
            />
          </div>

          {/* Type, Audience, Mode Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Collaboration Type <span className="text-rose-500">*</span>
              </label>
              <select
                value={collaborationType}
                onChange={(e) => setCollaborationType(e.target.value as CollaborationType)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 text-slate-800"
              >
                <option value="WORKSHOP">Workshop</option>
                <option value="FDP">Faculty Development Program (FDP)</option>
                <option value="INDUSTRIAL_TRAINING">Industrial Training / Faculty Internship</option>
                <option value="GUEST_LECTURE">Guest Lecture</option>
                <option value="LIVE_PROJECT">Live Industry Project</option>
                <option value="RESEARCH">Research Collaboration</option>
                <option value="CONSULTANCY">Consultancy</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Target Audience <span className="text-rose-500">*</span>
              </label>
              <select
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value as CollaborationAudience)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 text-slate-800"
              >
                <option value="BOTH">Faculty & Students</option>
                <option value="FACULTY">Faculty Only</option>
                <option value="STUDENT">Students Only</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Delivery Mode <span className="text-rose-500">*</span>
              </label>
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value as CollaborationMode)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 text-slate-800"
              >
                <option value="ONLINE">Online / Virtual</option>
                <option value="IN_PERSON">In-Person</option>
                <option value="HYBRID">Hybrid</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Detailed Description & Syllabus <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={5}
              required
              placeholder="Outline the schedule, learning outcomes, deliverables, and requirements..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 placeholder:text-slate-400"
            />
          </div>

          {/* Schedule & Duration Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 text-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 text-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Duration (Days)</label>
              <input
                type="number"
                min="1"
                placeholder="e.g. 5"
                value={durationDays}
                onChange={(e) => setDurationDays(e.target.value ? Number(e.target.value) : '')}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 text-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Session Count</label>
              <input
                type="number"
                min="1"
                placeholder="e.g. 10"
                value={sessionCount}
                onChange={(e) => setSessionCount(e.target.value ? Number(e.target.value) : '')}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 text-slate-800"
              />
            </div>
          </div>

          {/* Capacity & Deadline */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Participant Capacity (Max Allowed)
              </label>
              <input
                type="number"
                min="1"
                placeholder="Leave blank for unlimited"
                value={maxParticipants}
                onChange={(e) => setMaxParticipants(e.target.value ? Number(e.target.value) : '')}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 text-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Application Deadline</label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 text-slate-800"
              />
            </div>
          </div>

          {/* Location / Meeting URL */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Venue / Physical Location</label>
              <input
                type="text"
                placeholder="e.g. Innovation Hub, Block C, Bengaluru Campus"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 text-slate-800 placeholder:text-slate-400"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Virtual Meeting Link</label>
              <input
                type="url"
                placeholder="e.g. https://meet.google.com/xyz-abc"
                value={meetingLink}
                onChange={(e) => setMeetingLink(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 text-slate-800 placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Department & Domain Tags (Comma Separated) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Eligible Departments (Comma-separated)
              </label>
              <input
                type="text"
                placeholder="e.g. Computer Science, Information Technology, Electronics"
                value={eligibleDepartmentsInput}
                onChange={(e) => setEligibleDepartmentsInput(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 text-slate-800 placeholder:text-slate-400"
              />
              <p className="text-[11px] text-slate-400 mt-1">Leave empty to allow all departments.</p>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Domain / Technology Tags (Comma-separated)
              </label>
              <input
                type="text"
                placeholder="e.g. Cloud, DevOps, Kubernetes, AI"
                value={domainTagsInput}
                onChange={(e) => setDomainTagsInput(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 text-slate-800 placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Honorarium / Stipend */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Honorarium / Stipend Amount (Optional)
              </label>
              <input
                type="number"
                min="0"
                placeholder="e.g. 15000"
                value={stipend}
                onChange={(e) => setStipend(e.target.value ? Number(e.target.value) : '')}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 text-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Currency</label>
              <input
                type="text"
                value={stipendCurrency}
                onChange={(e) => setStipendCurrency(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 text-slate-800"
              />
            </div>
          </div>

          {/* Contact Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Coordinator Name</label>
              <input
                type="text"
                placeholder="e.g. Priya Nair (Lead Cloud Architect)"
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 text-slate-800 placeholder:text-slate-400"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Coordinator Email</label>
              <input
                type="email"
                placeholder="e.g. priya.nair@company.com"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 text-slate-800 placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Instructions / Prerequisites */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Instructions & Prerequisites (Optional)
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Laptop with 8GB RAM required. Prior familiarity with Linux CLI recommended."
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 placeholder:text-slate-400"
            />
          </div>

          {/* Form Actions */}
          <div className="pt-6 border-t border-slate-100 flex items-center justify-end gap-3">
            <Link
              to="/industry/collaborations"
              className="px-5 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </Link>

            <button
              type="button"
              disabled={isSubmitting || !title || !description}
              onClick={() => handleSubmit(false)}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              Save as Draft
            </button>

            <button
              type="button"
              disabled={isSubmitting || !title || !description}
              onClick={() => handleSubmit(true)}
              className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl transition-all shadow-md shadow-brand-500/20 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              {isSubmitting ? 'Publishing...' : 'Publish to Marketplace'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

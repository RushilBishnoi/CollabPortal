import React, { useState, useEffect } from 'react';
import { X, Calendar, Video, Clock } from 'lucide-react';
import { MentorProfile, CalculatedBookingSlot } from '../../types/mentorship';
import { mentorshipApi } from '../../lib/mentorship-api';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  mentor: MentorProfile;
  mentorshipId?: string;
  onSubmit: (payload: {
    title: string;
    description?: string;
    scheduledAt: string;
    durationMinutes?: number;
    meetingPlatform?: string;
    meetingLink?: string;
    mentorshipId?: string;
  }) => Promise<void>;
}

export const BookSessionModal: React.FC<Props> = ({
  isOpen,
  onClose,
  mentor,
  mentorshipId,
  onSubmit,
}) => {
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(tomorrow);
  const [slots, setSlots] = useState<CalculatedBookingSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<CalculatedBookingSlot | null>(null);
  const [title, setTitle] = useState('1-on-1 Mentorship & Code Review');
  const [description, setDescription] = useState('');
  const [meetingPlatform, setMeetingPlatform] = useState(mentor.defaultMeetingPlatform || 'GOOGLE_MEET');
  const [meetingLink, setMeetingLink] = useState(mentor.defaultMeetingLink || '');
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && mentor.id) {
      loadSlots(selectedDate);
    }
  }, [isOpen, mentor.id, selectedDate]);

  const loadSlots = async (dateStr: string) => {
    try {
      setIsLoadingSlots(true);
      const data = await mentorshipApi.getAvailableSlots(mentor.id, dateStr);
      setSlots(data);
      setSelectedSlot(null);
    } catch {
      setSlots([]);
    } finally {
      setIsLoadingSlots(false);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot) {
      setError('Please select an available time slot.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onSubmit({
        title,
        description: description || undefined,
        scheduledAt: selectedSlot.scheduledAt,
        durationMinutes: selectedSlot.durationMinutes,
        meetingPlatform,
        meetingLink: meetingLink || undefined,
        mentorshipId,
      });
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Failed to book session.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Video className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Book 1-on-1 Mentorship Session</h2>
            <p className="text-xs text-slate-500">
              Select an available slot with <span className="font-semibold text-slate-800">{mentor.headline}</span>
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Date Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Select Session Date
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="date"
                min={new Date().toISOString().split('T')[0]}
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-500"
                required
              />
            </div>
          </div>

          {/* Slots Grid */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Available Time Slots ({selectedDate})
            </label>
            {isLoadingSlots ? (
              <div className="p-4 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
                Checking mentor availability and booked calendar...
              </div>
            ) : slots.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-500 bg-slate-50 rounded-xl">
                No slots configured or available on this day. Please select another date.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-1">
                {slots.map((s, idx) => (
                  <button
                    key={idx}
                    type="button"
                    disabled={s.isBooked}
                    onClick={() => setSelectedSlot(s)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border flex items-center justify-between ${
                      s.isBooked
                        ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed line-through'
                        : selectedSlot?.scheduledAt === s.scheduledAt
                        ? 'bg-brand-600 text-white border-brand-600 shadow-sm'
                        : 'bg-white hover:bg-brand-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    <span>
                      {s.startTime} - {s.endTime}
                    </span>
                    <Clock className="w-3 h-3 opacity-60" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Session Title / Topic <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-500"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Discussion Agenda / Notes (Optional)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What questions or code repositories would you like to review during this call?"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {/* Meeting Platform & Link */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Meeting Platform
              </label>
              <select
                value={meetingPlatform}
                onChange={(e) => setMeetingPlatform(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
              >
                <option value="GOOGLE_MEET">Google Meet</option>
                <option value="ZOOM">Zoom Video</option>
                <option value="MS_TEAMS">Microsoft Teams</option>
                <option value="IN_PERSON">In-Person Meeting</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Meeting Link (Optional)
              </label>
              <input
                type="text"
                placeholder="https://meet.google.com/..."
                value={meetingLink}
                onChange={(e) => setMeetingLink(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !selectedSlot}
              className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold transition-colors shadow-sm disabled:opacity-50 inline-flex items-center gap-1.5"
            >
              <Video className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Confirming Booking...' : 'Confirm Session Booking'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

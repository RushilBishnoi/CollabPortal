import React, { useState } from 'react';
import { Clock, Plus, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';
import { MentorAvailabilitySlot } from '../../types/mentorship';

const DAYS_OF_WEEK = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

interface Props {
  initialSlots?: MentorAvailabilitySlot[];
  onSave: (slots: MentorAvailabilitySlot[]) => Promise<void>;
}

export const MentorAvailabilityConfig: React.FC<Props> = ({
  initialSlots = [],
  onSave,
}) => {
  const [slots, setSlots] = useState<MentorAvailabilitySlot[]>(
    initialSlots.length > 0
      ? initialSlots
      : [
          { dayOfWeek: 1, startTime: '15:00', endTime: '18:00', slotDurationMins: 45 },
          { dayOfWeek: 3, startTime: '15:00', endTime: '18:00', slotDurationMins: 45 },
          { dayOfWeek: 5, startTime: '15:00', endTime: '18:00', slotDurationMins: 45 },
        ],
  );

  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const addSlot = () => {
    setSlots([
      ...slots,
      { dayOfWeek: 1, startTime: '14:00', endTime: '17:00', slotDurationMins: 45 },
    ]);
  };

  const removeSlot = (index: number) => {
    setSlots(slots.filter((_, i) => i !== index));
  };

  const updateSlot = (index: number, field: keyof MentorAvailabilitySlot, value: any) => {
    const updated = [...slots];
    updated[index] = { ...updated[index], [field]: value };
    setSlots(updated);
  };

  const handleSave = async () => {
    // Validate time logic
    for (let i = 0; i < slots.length; i++) {
      const slot = slots[i];
      const [sh, sm] = slot.startTime.split(':').map(Number);
      const [eh, em] = slot.endTime.split(':').map(Number);
      if (sh * 60 + sm >= eh * 60 + em) {
        setErrorMsg(`Slot #${i + 1} (${DAYS_OF_WEEK[slot.dayOfWeek]}): Start time must be earlier than End time.`);
        return;
      }
    }

    try {
      setIsSaving(true);
      setErrorMsg(null);
      await onSave(slots);
      setSuccessMsg('Weekly availability schedule saved successfully!');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to save availability schedule.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-brand-600" />
            <span>Weekly Recurring Availability Slots</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure your regular weekly office hours. Students can book 1-on-1 calls only during these designated windows.
          </p>
        </div>

        <button
          type="button"
          onClick={addSlot}
          className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors inline-flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Add Day Window
        </button>
      </div>

      {successMsg && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-bold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-500" />
          <span>{errorMsg}</span>
        </div>
      )}

      {slots.length === 0 ? (
        <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl">
          No active availability windows set. Click "Add Day Window" above to open your calendar.
        </div>
      ) : (
        <div className="space-y-3">
          {slots.map((slot, idx) => (
            <div
              key={idx}
              className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200"
            >
              {/* Day of Week */}
              <div className="w-full sm:w-40">
                <label className="block text-[11px] font-bold text-slate-500 mb-1">
                  Day of Week
                </label>
                <select
                  value={slot.dayOfWeek}
                  onChange={(e) => updateSlot(idx, 'dayOfWeek', Number(e.target.value))}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  {DAYS_OF_WEEK.map((day, dIdx) => (
                    <option key={dIdx} value={dIdx}>
                      {day}
                    </option>
                  ))}
                </select>
              </div>

              {/* Start Time */}
              <div className="w-full sm:w-32">
                <label className="block text-[11px] font-bold text-slate-500 mb-1">
                  Start Time
                </label>
                <input
                  type="time"
                  value={slot.startTime}
                  onChange={(e) => updateSlot(idx, 'startTime', e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-medium bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              {/* End Time */}
              <div className="w-full sm:w-32">
                <label className="block text-[11px] font-bold text-slate-500 mb-1">
                  End Time
                </label>
                <input
                  type="time"
                  value={slot.endTime}
                  onChange={(e) => updateSlot(idx, 'endTime', e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-medium bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              {/* Slot Duration */}
              <div className="w-full sm:w-36">
                <label className="block text-[11px] font-bold text-slate-500 mb-1">
                  Slot Length
                </label>
                <select
                  value={slot.slotDurationMins}
                  onChange={(e) => updateSlot(idx, 'slotDurationMins', Number(e.target.value))}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-medium bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value={30}>30 Minutes</option>
                  <option value={45}>45 Minutes (Standard)</option>
                  <option value={60}>60 Minutes (1 Hour)</option>
                  <option value={90}>90 Minutes</option>
                </select>
              </div>

              {/* Delete */}
              <div className="sm:self-end sm:pb-1">
                <button
                  type="button"
                  onClick={() => removeSlot(idx)}
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                  title="Remove Window"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="pt-3 flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold transition-colors shadow-sm disabled:opacity-50"
        >
          {isSaving ? 'Saving Calendar...' : 'Save Availability Schedule'}
        </button>
      </div>
    </div>
  );
};

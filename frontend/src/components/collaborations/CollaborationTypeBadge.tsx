import React from 'react';
import { CollaborationType } from '../../types/collaboration';

interface CollaborationTypeBadgeProps {
  type: CollaborationType;
  className?: string;
}

const TYPE_CONFIG: Record<CollaborationType, { label: string; bg: string; text: string; border: string }> = {
  GUEST_LECTURE: {
    label: 'Guest Lecture',
    bg: 'bg-indigo-50',
    text: 'text-indigo-700',
    border: 'border-indigo-200',
  },
  WORKSHOP: {
    label: 'Workshop',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
  },
  FDP: {
    label: 'Faculty Development Program',
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    border: 'border-purple-200',
  },
  INDUSTRIAL_TRAINING: {
    label: 'Industrial Training / Faculty Internship',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
  },
  RESEARCH: {
    label: 'Research Collaboration',
    bg: 'bg-teal-50',
    text: 'text-teal-700',
    border: 'border-teal-200',
  },
  CONSULTANCY: {
    label: 'Consultancy',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
  },
  LIVE_PROJECT: {
    label: 'Live Industry Project',
    bg: 'bg-sky-50',
    text: 'text-sky-700',
    border: 'border-sky-200',
  },
};

export const CollaborationTypeBadge: React.FC<CollaborationTypeBadgeProps> = ({ type, className = '' }) => {
  const config = TYPE_CONFIG[type] || {
    label: type,
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-200',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${config.bg} ${config.text} ${config.border} ${className}`}
    >
      {config.label}
    </span>
  );
};

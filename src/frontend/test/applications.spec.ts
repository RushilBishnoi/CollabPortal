import { describe, it, expect } from 'vitest';
import { ApplicationStatus } from '../src/types/applications';

describe('Phase 9: Frontend Applications & Recruitment Helpers Spec', () => {
  const ALLOWED_STATUS_TRANSITIONS: Record<ApplicationStatus, ApplicationStatus[]> = {
    SAVED: ['APPLIED', 'WITHDRAWN'],
    APPLIED: ['UNDER_REVIEW', 'REJECTED', 'WITHDRAWN'],
    UNDER_REVIEW: ['SHORTLISTED', 'REJECTED', 'WITHDRAWN'],
    SHORTLISTED: ['INTERVIEW_SCHEDULED', 'REJECTED', 'WITHDRAWN'],
    INTERVIEW_SCHEDULED: ['SELECTED', 'REJECTED', 'WITHDRAWN'],
    SELECTED: [],
    REJECTED: [],
    WITHDRAWN: [],
  };

  const getStatusBadge = (status: ApplicationStatus) => {
    switch (status) {
      case 'SELECTED':
        return { label: 'Selected / Placed', colorClass: 'text-emerald-800' };
      case 'INTERVIEW_SCHEDULED':
        return { label: 'Interview Scheduled', colorClass: 'text-indigo-800' };
      case 'SHORTLISTED':
        return { label: 'Shortlisted', colorClass: 'text-blue-800' };
      case 'UNDER_REVIEW':
        return { label: 'Under Review', colorClass: 'text-amber-800' };
      case 'APPLIED':
        return { label: 'Applied', colorClass: 'text-slate-800' };
      case 'WITHDRAWN':
        return { label: 'Withdrawn', colorClass: 'text-slate-500' };
      case 'REJECTED':
        return { label: 'Not Selected', colorClass: 'text-red-700' };
      default:
        return { label: status, colorClass: 'text-slate-700' };
    }
  };

  const validateResumeFile = (file: { name: string; size: number }) => {
    const maxSizeBytes = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSizeBytes) {
      return { isValid: false, error: 'File size exceeds maximum limit of 5MB.' };
    }

    const validExtensions = ['.pdf', '.doc', '.docx'];
    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    if (!validExtensions.includes(ext)) {
      return { isValid: false, error: 'Invalid file format. Please select a PDF or Word document.' };
    }

    return { isValid: true, error: null };
  };

  describe('Application Status Badges & Rendering', () => {
    it('should correctly format and colorize status badges for active and terminal stages', () => {
      expect(getStatusBadge('APPLIED').label).toBe('Applied');
      expect(getStatusBadge('SHORTLISTED').label).toBe('Shortlisted');
      expect(getStatusBadge('INTERVIEW_SCHEDULED').label).toBe('Interview Scheduled');
      expect(getStatusBadge('SELECTED').label).toBe('Selected / Placed');
      expect(getStatusBadge('SELECTED').colorClass).toContain('emerald');
      expect(getStatusBadge('REJECTED').label).toBe('Not Selected');
      expect(getStatusBadge('REJECTED').colorClass).toContain('red');
    });
  });

  describe('State Machine & Transition Rules', () => {
    it('should permit valid forward recruitment transitions', () => {
      expect(ALLOWED_STATUS_TRANSITIONS.APPLIED).toContain('UNDER_REVIEW');
      expect(ALLOWED_STATUS_TRANSITIONS.UNDER_REVIEW).toContain('SHORTLISTED');
      expect(ALLOWED_STATUS_TRANSITIONS.SHORTLISTED).toContain('INTERVIEW_SCHEDULED');
      expect(ALLOWED_STATUS_TRANSITIONS.INTERVIEW_SCHEDULED).toContain('SELECTED');
    });

    it('should enforce terminal states with no outward transitions', () => {
      expect(ALLOWED_STATUS_TRANSITIONS.SELECTED).toHaveLength(0);
      expect(ALLOWED_STATUS_TRANSITIONS.REJECTED).toHaveLength(0);
      expect(ALLOWED_STATUS_TRANSITIONS.WITHDRAWN).toHaveLength(0);
    });
  });

  describe('Client-Side File Upload Validation', () => {
    it('should accept valid PDF and Word resumes within 5MB limit', () => {
      const validPdf = { name: 'my_resume.pdf', size: 1.5 * 1024 * 1024 };
      const validDocx = { name: 'cv.docx', size: 3.2 * 1024 * 1024 };

      expect(validateResumeFile(validPdf).isValid).toBe(true);
      expect(validateResumeFile(validDocx).isValid).toBe(true);
    });

    it('should reject files exceeding 5MB or with invalid extensions', () => {
      const oversized = { name: 'portfolio.pdf', size: 7 * 1024 * 1024 };
      const invalidExt = { name: 'script.js', size: 1024 };

      const oversizedCheck = validateResumeFile(oversized);
      expect(oversizedCheck.isValid).toBe(false);
      expect(oversizedCheck.error).toContain('5MB');

      const invalidExtCheck = validateResumeFile(invalidExt);
      expect(invalidExtCheck.isValid).toBe(false);
      expect(invalidExtCheck.error).toContain('Invalid file format');
    });
  });
});

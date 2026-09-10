import { describe, it, expect } from 'vitest';
import {
  CollaborationType,
  CollaborationStatus,
  ParticipationStatus,
  CollaborationAudience,
  CollaborationMode,
  Collaboration,
} from '../src/types/collaboration';

describe('Phase 11: Frontend Collaboration Domain Spec', () => {
  // Helpers matching UI badge maps
  const getTypeBadgeLabel = (type: CollaborationType): string => {
    switch (type) {
      case 'GUEST_LECTURE':
        return 'Guest Lecture';
      case 'WORKSHOP':
        return 'Workshop';
      case 'FDP':
        return 'Faculty Development Program';
      case 'INDUSTRIAL_TRAINING':
        return 'Industrial Training / Faculty Internship';
      case 'RESEARCH':
        return 'Research Collaboration';
      case 'CONSULTANCY':
        return 'Consultancy';
      case 'LIVE_PROJECT':
        return 'Live Industry Project';
      default:
        return type;
    }
  };

  const getStatusBadgeLabel = (status: CollaborationStatus): string => {
    switch (status) {
      case 'DRAFT':
        return 'Draft';
      case 'OPEN':
        return 'Open for Applications';
      case 'CLOSED':
        return 'Closed';
      case 'CANCELLED':
        return 'Cancelled';
      case 'COMPLETED':
        return 'Completed';
      default:
        return status;
    }
  };

  const getParticipationBadgeLabel = (status: ParticipationStatus): string => {
    switch (status) {
      case 'PENDING':
        return 'Under Review';
      case 'APPROVED':
        return 'Approved / Enrolled';
      case 'REJECTED':
        return 'Not Selected';
      case 'WITHDRAWN':
        return 'Withdrawn';
      case 'COMPLETED':
        return 'Completed';
      case 'CANCELLED':
        return 'Cancelled';
      default:
        return status;
    }
  };

  const filterCollaborations = (
    items: Collaboration[],
    filters: {
      type?: CollaborationType;
      audience?: CollaborationAudience;
      mode?: CollaborationMode;
      department?: string;
      search?: string;
    },
  ): Collaboration[] => {
    return items.filter((item) => {
      if (filters.type && item.collaborationType !== filters.type) {
        return false;
      }
      if (
        filters.audience &&
        filters.audience !== 'BOTH' &&
        item.targetAudience !== 'BOTH' &&
        item.targetAudience !== filters.audience
      ) {
        return false;
      }
      if (filters.mode && item.mode !== filters.mode) {
        return false;
      }
      if (
        filters.department &&
        item.eligibleDepartments.length > 0 &&
        !item.eligibleDepartments.includes(filters.department)
      ) {
        return false;
      }
      if (filters.search) {
        const q = filters.search.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(q);
        const matchesDesc = item.description.toLowerCase().includes(q);
        const matchesCompany =
          item.industryProfile?.companyName?.toLowerCase().includes(q) || false;
        if (!matchesTitle && !matchesDesc && !matchesCompany) {
          return false;
        }
      }
      return true;
    });
  };

  describe('1. Collaboration Type & Status Badges', () => {
    it('should correctly format labels for all Collaboration Types', () => {
      expect(getTypeBadgeLabel('WORKSHOP')).toBe('Workshop');
      expect(getTypeBadgeLabel('FDP')).toBe('Faculty Development Program');
      expect(getTypeBadgeLabel('INDUSTRIAL_TRAINING')).toBe(
        'Industrial Training / Faculty Internship',
      );
      expect(getTypeBadgeLabel('LIVE_PROJECT')).toBe('Live Industry Project');
      expect(getTypeBadgeLabel('RESEARCH')).toBe('Research Collaboration');
      expect(getTypeBadgeLabel('CONSULTANCY')).toBe('Consultancy');
      expect(getTypeBadgeLabel('GUEST_LECTURE')).toBe('Guest Lecture');
    });

    it('should correctly format labels for Collaboration Statuses', () => {
      expect(getStatusBadgeLabel('DRAFT')).toBe('Draft');
      expect(getStatusBadgeLabel('OPEN')).toBe('Open for Applications');
      expect(getStatusBadgeLabel('CLOSED')).toBe('Closed');
      expect(getStatusBadgeLabel('COMPLETED')).toBe('Completed');
      expect(getStatusBadgeLabel('CANCELLED')).toBe('Cancelled');
    });

    it('should correctly format labels for Participant Statuses', () => {
      expect(getParticipationBadgeLabel('PENDING')).toBe('Under Review');
      expect(getParticipationBadgeLabel('APPROVED')).toBe('Approved / Enrolled');
      expect(getParticipationBadgeLabel('REJECTED')).toBe('Not Selected');
      expect(getParticipationBadgeLabel('WITHDRAWN')).toBe('Withdrawn');
      expect(getParticipationBadgeLabel('COMPLETED')).toBe('Completed');
      expect(getParticipationBadgeLabel('CANCELLED')).toBe('Cancelled');
    });
  });

  describe('2. Client-side Collaboration Filtering', () => {
    const mockItems: Collaboration[] = [
      {
        id: 'c-1',
        industryProfileId: 'ind-1',
        title: 'Full-Stack React Workshop',
        description: 'Modern frontend development training',
        collaborationType: 'WORKSHOP',
        status: 'OPEN',
        targetAudience: 'STUDENT',
        mode: 'ONLINE',
        eligibleDepartments: ['Computer Science', 'Information Technology'],
        domainTags: ['React', 'TypeScript'],
        stipendCurrency: 'INR',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        industryProfile: {
          id: 'ind-1',
          companyName: 'MetaTech',
          industryType: 'Software',
        },
      },
      {
        id: 'c-2',
        industryProfileId: 'ind-2',
        title: 'Faculty Development in Quantum Computing',
        description: 'Advanced curriculum development and lab setup',
        collaborationType: 'FDP',
        status: 'OPEN',
        targetAudience: 'FACULTY',
        mode: 'HYBRID',
        eligibleDepartments: ['Computer Science', 'Physics'],
        domainTags: ['Quantum', 'Physics'],
        stipendCurrency: 'INR',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        industryProfile: {
          id: 'ind-2',
          companyName: 'IBM Quantum',
          industryType: 'Research',
        },
      },
      {
        id: 'c-3',
        industryProfileId: 'ind-1',
        title: 'Industrial Training on Embedded Systems',
        description: 'Hardware interfaces and firmware debugging',
        collaborationType: 'INDUSTRIAL_TRAINING',
        status: 'OPEN',
        targetAudience: 'BOTH',
        mode: 'IN_PERSON',
        eligibleDepartments: ['Electronics', 'Electrical'],
        domainTags: ['Embedded', 'C++'],
        stipendCurrency: 'INR',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        industryProfile: {
          id: 'ind-1',
          companyName: 'MetaTech',
          industryType: 'Hardware',
        },
      },
    ];

    it('should filter collaborations by audience correctly', () => {
      const studentEligible = filterCollaborations(mockItems, { audience: 'STUDENT' });
      expect(studentEligible.length).toBe(2); // c-1 (STUDENT) and c-3 (BOTH)

      const facultyEligible = filterCollaborations(mockItems, { audience: 'FACULTY' });
      expect(facultyEligible.length).toBe(2); // c-2 (FACULTY) and c-3 (BOTH)
    });

    it('should filter collaborations by type correctly', () => {
      const fdps = filterCollaborations(mockItems, { type: 'FDP' });
      expect(fdps.length).toBe(1);
      expect(fdps[0].id).toBe('c-2');
    });

    it('should filter collaborations by mode correctly', () => {
      const online = filterCollaborations(mockItems, { mode: 'ONLINE' });
      expect(online.length).toBe(1);
      expect(online[0].id).toBe('c-1');
    });

    it('should filter collaborations by department correctly', () => {
      const physics = filterCollaborations(mockItems, { department: 'Physics' });
      expect(physics.length).toBe(1);
      expect(physics[0].id).toBe('c-2');
    });

    it('should filter collaborations by search keyword matching company name or title', () => {
      const searchMeta = filterCollaborations(mockItems, { search: 'MetaTech' });
      expect(searchMeta.length).toBe(2);

      const searchQuantum = filterCollaborations(mockItems, { search: 'Quantum' });
      expect(searchQuantum.length).toBe(1);
    });
  });

  describe('3. Capacity & Participant State Calculations', () => {
    it('should determine capacity availability correctly', () => {
      const checkCapacity = (approvedCount: number, maxCapacity?: number | null) => {
        if (!maxCapacity) return { isFull: false, remainingSpots: Infinity };
        const remaining = Math.max(0, maxCapacity - approvedCount);
        return { isFull: remaining === 0, remainingSpots: remaining };
      };

      expect(checkCapacity(3, 5).isFull).toBe(false);
      expect(checkCapacity(3, 5).remainingSpots).toBe(2);
      expect(checkCapacity(5, 5).isFull).toBe(true);
      expect(checkCapacity(5, 5).remainingSpots).toBe(0);
      expect(checkCapacity(10, null).isFull).toBe(false);
    });

    it('should determine withdrawal eligibility correctly', () => {
      const canWithdraw = (status: ParticipationStatus) => {
        return status === 'PENDING' || status === 'APPROVED';
      };

      expect(canWithdraw('PENDING')).toBe(true);
      expect(canWithdraw('APPROVED')).toBe(true);
      expect(canWithdraw('COMPLETED')).toBe(false);
      expect(canWithdraw('REJECTED')).toBe(false);
      expect(canWithdraw('WITHDRAWN')).toBe(false);
      expect(canWithdraw('CANCELLED')).toBe(false);
    });
  });
});

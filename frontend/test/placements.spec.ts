import { describe, it, expect } from 'vitest';
import {
  PlacementOffer,
  Placement,
  OfferStatus,
  PlacementStatus,
  EmploymentType,
} from '../src/types/placement';

describe('Phase 13: Frontend Placement Workflow & Offer Management Spec', () => {
  // Compensation formatter helper
  const formatCompensation = (offer: {
    ctcAnnual?: number | null;
    stipendMonthly?: number | null;
    baseSalaryMonthly?: number | null;
  }): string => {
    if (offer.ctcAnnual) {
      const lpa = (offer.ctcAnnual / 100000).toFixed(1);
      return `₹${lpa} LPA CTC`;
    }
    if (offer.stipendMonthly) {
      return `₹${offer.stipendMonthly.toLocaleString()}/month`;
    }
    if (offer.baseSalaryMonthly) {
      return `₹${offer.baseSalaryMonthly.toLocaleString()}/month Base`;
    }
    return 'Undisclosed Package';
  };

  // Expiry evaluator helper
  const isOfferExpired = (offer: {
    status: OfferStatus;
    offerExpiryDate: string;
  }): boolean => {
    if (offer.status !== 'ISSUED') return false;
    return new Date(offer.offerExpiryDate).getTime() < Date.now();
  };

  // Timeline step generator helper
  const computeTimelineSteps = (
    offerStatus: OfferStatus,
    placementStatus?: PlacementStatus | null,
  ) => {
    const isDeclined = offerStatus === 'DECLINED';
    const isExpired = offerStatus === 'EXPIRED';
    const isWithdrawn = offerStatus === 'WITHDRAWN';
    const isRevoked = placementStatus === 'REVOKED';

    return [
      {
        title: 'Candidate Selected',
        status: 'completed',
      },
      {
        title: 'Offer Formally Issued',
        status:
          offerStatus === 'DRAFT'
            ? 'current'
            : offerStatus === 'CANCELLED'
            ? 'cancelled'
            : 'completed',
      },
      {
        title: 'Student Response',
        status:
          offerStatus === 'ACCEPTED'
            ? 'completed'
            : isDeclined || isExpired || isWithdrawn
            ? 'error'
            : offerStatus === 'ISSUED'
            ? 'current'
            : 'pending',
      },
      {
        title: 'Institutional TPO Verification',
        status:
          placementStatus === 'VERIFIED' ||
          placementStatus === 'CONFIRMED' ||
          placementStatus === 'JOINED'
            ? 'completed'
            : isRevoked
            ? 'error'
            : offerStatus === 'ACCEPTED'
            ? 'current'
            : 'pending',
      },
      {
        title: 'Corporate Joining Confirmation',
        status:
          placementStatus === 'JOINED'
            ? 'completed'
            : placementStatus === 'CONFIRMED' || placementStatus === 'VERIFIED'
            ? 'current'
            : 'pending',
      },
    ];
  };

  // 1. Offer Status formatting
  it('correctly formats annual CTC compensation into LPA string', () => {
    expect(formatCompensation({ ctcAnnual: 1200000 })).toBe('₹12.0 LPA CTC');
    expect(formatCompensation({ ctcAnnual: 850000 })).toBe('₹8.5 LPA CTC');
    expect(formatCompensation({ ctcAnnual: 2400000 })).toBe('₹24.0 LPA CTC');
  });

  it('correctly formats monthly stipend for internships', () => {
    expect(formatCompensation({ stipendMonthly: 45000 })).toBe('₹45,000/month');
    expect(formatCompensation({ stipendMonthly: 25000 })).toBe('₹25,000/month');
  });

  it('correctly formats base salary or returns undisclosed when empty', () => {
    expect(formatCompensation({ baseSalaryMonthly: 80000 })).toBe('₹80,000/month Base');
    expect(formatCompensation({})).toBe('Undisclosed Package');
  });

  // 2. Expiry detection
  it('identifies expired offers when current date is past offerExpiryDate', () => {
    const pastDate = new Date(Date.now() - 86400000 * 2).toISOString();
    const futureDate = new Date(Date.now() + 86400000 * 7).toISOString();

    expect(isOfferExpired({ status: 'ISSUED', offerExpiryDate: pastDate })).toBe(true);
    expect(isOfferExpired({ status: 'ISSUED', offerExpiryDate: futureDate })).toBe(false);
    expect(isOfferExpired({ status: 'DRAFT', offerExpiryDate: pastDate })).toBe(false);
    expect(isOfferExpired({ status: 'ACCEPTED', offerExpiryDate: pastDate })).toBe(false);
  });

  // 3. Action permissions based on offer state
  it('evaluates student action availability accurately', () => {
    const canStudentRespond = (status: OfferStatus, expiryDate: string): boolean => {
      if (status !== 'ISSUED') return false;
      return new Date(expiryDate).getTime() > Date.now();
    };

    const futureDate = new Date(Date.now() + 86400000).toISOString();
    const pastDate = new Date(Date.now() - 86400000).toISOString();

    expect(canStudentRespond('ISSUED', futureDate)).toBe(true);
    expect(canStudentRespond('ISSUED', pastDate)).toBe(false);
    expect(canStudentRespond('DRAFT', futureDate)).toBe(false);
    expect(canStudentRespond('ACCEPTED', futureDate)).toBe(false);
    expect(canStudentRespond('DECLINED', futureDate)).toBe(false);
  });

  // 4. Industry action permissions
  it('evaluates recruiter action availability accurately', () => {
    const canRecruiterIssue = (status: OfferStatus): boolean => status === 'DRAFT';
    const canRecruiterWithdraw = (status: OfferStatus): boolean => status === 'ISSUED';

    expect(canRecruiterIssue('DRAFT')).toBe(true);
    expect(canRecruiterIssue('ISSUED')).toBe(false);
    expect(canRecruiterWithdraw('ISSUED')).toBe(true);
    expect(canRecruiterWithdraw('ACCEPTED')).toBe(false);
  });

  // 5. Timeline progression calculations
  it('computes correct timeline state for fresh ISSUED offer', () => {
    const steps = computeTimelineSteps('ISSUED', null);
    expect(steps[0].status).toBe('completed'); // Selected
    expect(steps[1].status).toBe('completed'); // Issued
    expect(steps[2].status).toBe('current'); // Awaiting student response
    expect(steps[3].status).toBe('pending');
    expect(steps[4].status).toBe('pending');
  });

  it('computes correct timeline state for ACCEPTED offer awaiting TPO verification', () => {
    const steps = computeTimelineSteps('ACCEPTED', 'PENDING_VERIFICATION');
    expect(steps[0].status).toBe('completed');
    expect(steps[1].status).toBe('completed');
    expect(steps[2].status).toBe('completed'); // Student accepted
    expect(steps[3].status).toBe('current'); // TPO verification in progress
    expect(steps[4].status).toBe('pending');
  });

  it('computes correct timeline state for VERIFIED placement awaiting joining', () => {
    const steps = computeTimelineSteps('ACCEPTED', 'VERIFIED');
    expect(steps[3].status).toBe('completed'); // TPO verified
    expect(steps[4].status).toBe('current'); // Awaiting joining
  });

  it('computes correct timeline state for fully JOINED placement', () => {
    const steps = computeTimelineSteps('ACCEPTED', 'JOINED');
    expect(steps.every((s) => s.status === 'completed')).toBe(true);
  });

  it('computes correct timeline state for DECLINED offer', () => {
    const steps = computeTimelineSteps('DECLINED', null);
    expect(steps[2].status).toBe('error');
    expect(steps[3].status).toBe('pending');
  });

  // 6. Placement filtering
  it('filters placement records by status and department', () => {
    const mockPlacements: Partial<Placement>[] = [
      {
        id: 'plc-1',
        status: 'PENDING_VERIFICATION',
        studentProfile: { fullName: 'Aarav Sharma', department: 'Computer Science' } as any,
      },
      {
        id: 'plc-2',
        status: 'VERIFIED',
        studentProfile: { fullName: 'Priya Patel', department: 'Information Technology' } as any,
      },
      {
        id: 'plc-3',
        status: 'JOINED',
        studentProfile: { fullName: 'Rohan Gupta', department: 'Computer Science' } as any,
      },
    ];

    const filterPlacements = (
      items: typeof mockPlacements,
      status?: PlacementStatus,
      dept?: string,
    ) => {
      return items.filter((p) => {
        if (status && p.status !== status) return false;
        if (dept && p.studentProfile?.department !== dept) return false;
        return true;
      });
    };

    expect(filterPlacements(mockPlacements, 'PENDING_VERIFICATION')).toHaveLength(1);
    expect(filterPlacements(mockPlacements, undefined, 'Computer Science')).toHaveLength(2);
    expect(filterPlacements(mockPlacements, 'VERIFIED', 'Information Technology')).toHaveLength(1);
  });

  // 7. Offer search query matching
  it('filters offers by keyword search matching company, role, or title', () => {
    const mockOffers: Partial<PlacementOffer>[] = [
      {
        id: 'off-1',
        title: 'Backend Software Engineer',
        designation: 'SDE-1',
        industryProfile: { companyName: 'Google Cloud' } as any,
      },
      {
        id: 'off-2',
        title: 'Frontend React Developer',
        designation: 'UI Engineer',
        industryProfile: { companyName: 'Microsoft' } as any,
      },
    ];

    const searchOffers = (items: typeof mockOffers, query: string) => {
      const q = query.toLowerCase();
      return items.filter(
        (o) =>
          o.title?.toLowerCase().includes(q) ||
          o.designation?.toLowerCase().includes(q) ||
          o.industryProfile?.companyName?.toLowerCase().includes(q),
      );
    };

    expect(searchOffers(mockOffers, 'Google')).toHaveLength(1);
    expect(searchOffers(mockOffers, 'Engineer')).toHaveLength(2);
    expect(searchOffers(mockOffers, 'React')).toHaveLength(1);
    expect(searchOffers(mockOffers, 'Amazon')).toHaveLength(0);
  });

  // 8. Decline reason validation
  it('validates decline reason requirements', () => {
    const isValidDecline = (reason?: string): boolean => {
      return typeof reason === 'string' && reason.trim().length >= 3;
    };

    expect(isValidDecline('Accepted another offer')).toBe(true);
    expect(isValidDecline('Compensation mismatch')).toBe(true);
    expect(isValidDecline('')).toBe(false);
    expect(isValidDecline('  ')).toBe(false);
    expect(isValidDecline(undefined)).toBe(false);
  });
});

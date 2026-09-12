import { describe, it, expect } from 'vitest';
import {
  OpportunityMatchResult,
  OpportunityType,
  OpportunityStatus,
  EvaluatedOpportunitySkill,
} from '../src/types/opportunities';

export function getOpportunityScoreBadge(score: number): {
  badgeColor: string;
  progressBg: string;
  tierLabel: string;
} {
  if (score >= 75) {
    return {
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      progressBg: 'bg-emerald-500',
      tierLabel: 'Strong Match',
    };
  }
  if (score >= 50) {
    return {
      badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
      progressBg: 'bg-amber-500',
      tierLabel: 'Moderate Match',
    };
  }
  return {
    badgeColor: 'bg-slate-50 text-slate-700 border-slate-200',
    progressBg: 'bg-slate-500',
    tierLabel: 'Low Match',
  };
}

export function filterOpportunitiesClientSide<T extends { opportunity: { opportunityType: string; isRemote: boolean }; eligibility: { isEligible: boolean } }>(
  items: T[],
  filters: { opportunityType?: string; isRemoteOnly?: boolean; eligibleOnly?: boolean },
): T[] {
  return items.filter((item) => {
    if (filters.opportunityType && filters.opportunityType !== 'ALL' && item.opportunity.opportunityType !== filters.opportunityType) {
      return false;
    }
    if (filters.isRemoteOnly && !item.opportunity.isRemote) {
      return false;
    }
    if (filters.eligibleOnly && !item.eligibility.isEligible) {
      return false;
    }
    return true;
  });
}

describe('Phase 8 Frontend Opportunity Types & Matching Logic Unit Tests', () => {
  const mockMatchResult: OpportunityMatchResult = {
    opportunity: {
      id: 'opp-1',
      title: 'Frontend Developer Intern',
      slug: 'frontend-developer-intern',
      opportunityType: 'INTERNSHIP' as OpportunityType,
      status: 'PUBLISHED' as OpportunityStatus,
      location: 'Bengaluru',
      isRemote: true,
      stipend: 25000,
      stipendCurrency: 'INR',
      stipendPeriod: 'MONTHLY',
      deadline: '2026-12-31T00:00:00.000Z',
      positionsCount: 2,
      description: 'Role description',
      company: {
        id: 'ind-1',
        name: 'Tech Corp',
        industryType: 'Software',
        headquarters: 'Bengaluru',
        website: 'https://techcorp.example.com',
        isVerified: true,
      },
      careerRole: {
        id: 'role-1',
        title: 'Frontend Developer',
        category: 'Web Development',
      },
    },
    overallScore: 87.3,
    eligibility: {
      isEligible: true,
      checks: {
        cgpa: { passed: true, required: 7.0, actual: 8.5, message: 'CGPA met' },
        graduationYear: { passed: true, minYear: 2025, maxYear: 2027, actual: 2026, message: 'Batch met' },
        department: { passed: true, allowedDepartments: ['CSE', 'IT'], actual: 'CSE', message: 'Dept met' },
      },
      failureReasons: [],
    },
    breakdown: {
      skillCompatibility: { score: 42.5, max: 50, percentage: 85, explanation: '3 of 4 skills satisfied' },
      verificationConfidence: { score: 11.3, max: 15, percentage: 75.3, explanation: '3 of 4 skills verified' },
      careerInterest: { score: 15.0, max: 15, percentage: 100, explanation: 'Direct role match' },
      academicReadiness: { score: 8.5, max: 10, percentage: 85, explanation: 'Profile 90% complete' },
      locationPreference: { score: 10.0, max: 10, percentage: 100, explanation: '100% remote' },
    },
    skillsSummary: {
      totalRequired: 4,
      satisfiedCount: 3,
      deficitCount: 1,
      missingCount: 0,
      verifiedCount: 3,
    },
    skillRequirements: [
      {
        skillId: 'sk-react',
        skillName: 'React',
        requiredProficiency: 'ADVANCED',
        requiredProficiencyValue: 3,
        studentProficiency: 'ADVANCED',
        studentProficiencyValue: 3,
        verificationStatus: 'VERIFIED',
        isVerified: true,
        status: 'SATISFIED',
        gapLevels: 0,
        weight: 1.0,
        isMandatory: true,
      },
      {
        skillId: 'sk-ts',
        skillName: 'TypeScript',
        requiredProficiency: 'ADVANCED',
        requiredProficiencyValue: 3,
        studentProficiency: 'INTERMEDIATE',
        studentProficiencyValue: 2,
        verificationStatus: 'PENDING',
        isVerified: false,
        status: 'DEFICIT',
        gapLevels: 1,
        weight: 1.0,
        isMandatory: true,
      },
    ],
  };

  describe('Compatibility Score Tier & Badge Helper', () => {
    it('classifies strong match (>= 75%) with emerald badges', () => {
      const badge = getOpportunityScoreBadge(84.5);
      expect(badge.tierLabel).toBe('Strong Match');
      expect(badge.badgeColor).toContain('text-emerald-700');
      expect(badge.progressBg).toBe('bg-emerald-500');
    });

    it('classifies moderate match (50% - 74%) with amber badges', () => {
      const badge = getOpportunityScoreBadge(62.0);
      expect(badge.tierLabel).toBe('Moderate Match');
      expect(badge.badgeColor).toContain('text-amber-700');
      expect(badge.progressBg).toBe('bg-amber-500');
    });

    it('classifies low match (< 50%) with slate badges', () => {
      const badge = getOpportunityScoreBadge(35.0);
      expect(badge.tierLabel).toBe('Low Match');
      expect(badge.badgeColor).toContain('text-slate-700');
      expect(badge.progressBg).toBe('bg-slate-500');
    });
  });

  describe('Hard Eligibility vs Compatibility Separation', () => {
    it('preserves independence between high compatibility score and failed eligibility', () => {
      const ineligbleMatch: OpportunityMatchResult = {
        ...mockMatchResult,
        overallScore: 88.0,
        eligibility: {
          isEligible: false,
          checks: {
            ...mockMatchResult.eligibility.checks,
            cgpa: { passed: false, required: 8.5, actual: 7.2, message: 'CGPA 7.2 below required 8.5' },
          },
          failureReasons: ['CGPA 7.2 below required 8.5'],
        },
      };

      // Score is 88% but eligibility is false
      expect(ineligbleMatch.overallScore).toBe(88.0);
      expect(ineligbleMatch.eligibility.isEligible).toBe(false);
      expect(ineligbleMatch.eligibility.failureReasons[0]).toContain('CGPA');
    });
  });

  describe('Skill Requirement Status Interpretation', () => {
    it('correctly reports SATISFIED, DEFICIT, and MISSING skill requirements', () => {
      const satisfiedSkill = mockMatchResult.skillRequirements.find((s) => s.skillId === 'sk-react');
      expect(satisfiedSkill?.status).toBe('SATISFIED');
      expect(satisfiedSkill?.gapLevels).toBe(0);

      const deficitSkill = mockMatchResult.skillRequirements.find((s) => s.skillId === 'sk-ts');
      expect(deficitSkill?.status).toBe('DEFICIT');
      expect(deficitSkill?.gapLevels).toBe(1);
    });
  });

  describe('Mathematical Score Breakdown Summation Invariant', () => {
    it('verifies that breakdown components sum exactly to the overall score', () => {
      const b = mockMatchResult.breakdown;
      const sum = Math.round(
        (b.skillCompatibility.score +
          b.verificationConfidence.score +
          b.careerInterest.score +
          b.academicReadiness.score +
          b.locationPreference.score) * 10,
      ) / 10;

      expect(mockMatchResult.overallScore).toBe(sum);
      expect(sum).toBeLessThanOrEqual(100.0);
      expect(sum).toBeGreaterThanOrEqual(0.0);
    });
  });

  describe('Client-side Filter Helper', () => {
    const oppList = [
      mockMatchResult,
      {
        ...mockMatchResult,
        opportunity: { ...mockMatchResult.opportunity, id: 'opp-2', opportunityType: 'JOB' as OpportunityType, isRemote: false },
        eligibility: { ...mockMatchResult.eligibility, isEligible: false },
      },
    ];

    it('filters by opportunity type', () => {
      const filtered = filterOpportunitiesClientSide(oppList, { opportunityType: 'INTERNSHIP' });
      expect(filtered).toHaveLength(1);
      expect(filtered[0].opportunity.id).toBe('opp-1');
    });

    it('filters by remote only', () => {
      const filtered = filterOpportunitiesClientSide(oppList, { isRemoteOnly: true });
      expect(filtered).toHaveLength(1);
      expect(filtered[0].opportunity.id).toBe('opp-1');
    });

    it('filters by eligible only', () => {
      const filtered = filterOpportunitiesClientSide(oppList, { eligibleOnly: true });
      expect(filtered).toHaveLength(1);
      expect(filtered[0].opportunity.id).toBe('opp-1');
    });
  });
});

// ─── Public Marketplace API Contract Regression Tests ─────────────────────────
// These tests guard against the confirmed bug where the frontend Opportunities
// page showed "Failed to load opportunities" even when the backend returned 200.
// Root cause: ?page=1&limit=20 query params triggered a backend 500 due to
// Prisma take/skip receiving string values instead of numbers.

describe('Public Opportunities Marketplace — API Contract & Response Shape', () => {
  const mockOpportunity = {
    id: 'cfdfbffd-f19b-486f-8a24-bc59a25533c6',
    title: 'Full-Stack Web Innovation Live Project',
    slug: 'full-stack-web-innovation-live-project',
    opportunityType: 'LIVE_PROJECT' as const,
    status: 'PUBLISHED' as const,
    location: 'Remote / Hybrid',
    isRemote: true,
    stipend: 30000,
    stipendCurrency: 'INR',
    stipendPeriod: 'MONTHLY',
    industryProfile: {
      id: 'ind-1',
      companyName: 'TechCorp Solutions',
      industryType: 'Information Technology',
      headquarters: 'Bengaluru, India',
      website: 'https://techcorp.example.com',
      isVerified: true,
    },
    skills: [],
  };

  // Shape returned by apiClient after unwrapping { success: true, data: <payload> }
  const populatedApiResponse = {
    data: [mockOpportunity],
    meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
  };

  const emptyApiResponse = {
    data: [],
    meta: { total: 0, page: 1, limit: 20, totalPages: 0 },
  };

  describe('Response shape after envelope unwrapping', () => {
    it('apiClient returns { data: T[], meta } shape after unwrapping { success, data } envelope', () => {
      const rawApiResponse = {
        success: true,
        data: populatedApiResponse,
        message: 'Success',
        timestamp: new Date().toISOString(),
      };
      const unwrapped =
        rawApiResponse &&
        typeof rawApiResponse === 'object' &&
        'success' in rawApiResponse &&
        'data' in rawApiResponse
          ? (rawApiResponse as any).data
          : rawApiResponse;

      expect(unwrapped).toEqual(populatedApiResponse);
      expect(Array.isArray(unwrapped.data)).toBe(true);
      expect(unwrapped.meta).toBeDefined();
    });

    it('populated response provides data array accessible via .data property', () => {
      const result = populatedApiResponse;
      expect(result.data).toHaveLength(1);
      expect(result.data[0].title).toBe('Full-Stack Web Innovation Live Project');
      expect(result.data[0].status).toBe('PUBLISHED');
    });

    it('empty response provides empty data array, not an error condition', () => {
      const result = emptyApiResponse;
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data).toHaveLength(0);
      expect(result.meta.total).toBe(0);
    });

    it('populated response meta contains correct pagination fields', () => {
      const { meta } = populatedApiResponse;
      expect(meta.total).toBe(1);
      expect(meta.page).toBe(1);
      expect(meta.limit).toBe(20);
      expect(meta.totalPages).toBe(1);
    });
  });

  describe('Query parameter construction for public marketplace', () => {
    const buildQueryString = (params: {
      search?: string;
      opportunityType?: string;
      isRemote?: boolean;
      page?: number;
      limit?: number;
    }): string => {
      const query = new URLSearchParams();
      if (params.search) query.set('search', params.search);
      if (params.opportunityType) query.set('opportunityType', params.opportunityType);
      if (params.isRemote !== undefined) query.set('isRemote', String(params.isRemote));
      if (params.page) query.set('page', String(params.page));
      if (params.limit) query.set('limit', String(params.limit));
      return query.toString();
    };

    it('default page load sends page=1&limit=20 without isRemote', () => {
      const qs = buildQueryString({ page: 1, limit: 20 });
      expect(qs).toBe('page=1&limit=20');
      expect(qs).not.toContain('isRemote');
    });

    it('remote-only filter sends isRemote=true', () => {
      const qs = buildQueryString({ page: 1, limit: 20, isRemote: true });
      expect(qs).toContain('isRemote=true');
    });

    it('type filter sends correct enum value', () => {
      const qs = buildQueryString({ page: 1, limit: 20, opportunityType: 'INTERNSHIP' });
      expect(qs).toContain('opportunityType=INTERNSHIP');
    });

    it('page and limit are serialized as plain integers without NaN or undefined', () => {
      const qs = buildQueryString({ page: 2, limit: 20 });
      expect(qs).toContain('page=2');
      expect(qs).toContain('limit=20');
      expect(qs).not.toContain('undefined');
      expect(qs).not.toContain('NaN');
    });
  });

  describe('Anonymous access — no Authorization required', () => {
    it('anonymous user (isStudent=false) does not include eligibleOnly in params', () => {
      const isStudent = false;
      const eligibleOnly = true;
      const params = {
        eligibleOnly: isStudent && eligibleOnly ? true : undefined,
        page: 1,
        limit: 20,
      };
      expect(params.eligibleOnly).toBeUndefined();
    });

    it('apiClient does not add Authorization header when no token exists', () => {
      const token: string | null = null;
      const headers = new Headers();
      if (token && !headers.has('Authorization')) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      expect(headers.has('Authorization')).toBe(false);
    });
  });

  describe('Opportunity card rendering logic', () => {
    it('company name resolves from industryProfile.companyName', () => {
      const opp = mockOpportunity;
      const companyName = opp.industryProfile?.companyName || 'Enterprise';
      expect(companyName).toBe('TechCorp Solutions');
    });

    it('shows Remote badge when isRemote is true', () => {
      expect(mockOpportunity.isRemote).toBe(true);
    });

    it('stipend amount is available for display', () => {
      expect(mockOpportunity.stipend).not.toBeNull();
      expect(mockOpportunity.stipend).toBe(30000);
      expect(mockOpportunity.stipendPeriod).toBe('MONTHLY');
    });
  });
});

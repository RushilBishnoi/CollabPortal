import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import { AnalyticsService } from '../src/modules/analytics/services/analytics.service';
import { ApplicationStatus, VerificationStatus } from '@prisma/client';

describe('Phase 10: Institutional & Placement Analytics Spec', () => {
  let analyticsService: AnalyticsService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      institutionProfile: {
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        update: vi.fn(),
        create: vi.fn(),
        count: vi.fn(),
      },
      user: {
        findUnique: vi.fn(),
      },
      industryProfile: {
        count: vi.fn(),
      },
      studentProfile: {
        findMany: vi.fn(),
        count: vi.fn(),
      },
      opportunity: {
        count: vi.fn(),
      },
      application: {
        count: vi.fn(),
      },
      assessment: {
        count: vi.fn(),
      },
    };

    analyticsService = new AnalyticsService(mockPrisma);
  });

  describe('Institution Profile Scoping & IDOR Prevention', () => {
    it('should throw NotFoundException when user does not exist in database', async () => {
      mockPrisma.institutionProfile.findUnique.mockResolvedValue(null);
      mockPrisma.institutionProfile.findFirst.mockResolvedValue(null);
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        analyticsService.getInstitutionOverview('unlinked-user-id'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should fallback to primary institution profile when unlinked admin user accesses analytics', async () => {
      mockPrisma.institutionProfile.findUnique.mockResolvedValue(null);
      mockPrisma.institutionProfile.findFirst.mockResolvedValue({
        id: 'inst-primary',
        name: 'Primary Institute',
        userId: null,
      });
      mockPrisma.institutionProfile.update.mockResolvedValue({
        id: 'inst-primary',
        name: 'Primary Institute',
        userId: 'admin-user-1',
      });
      mockPrisma.studentProfile.findMany.mockResolvedValue([]);

      const result = await analyticsService.getInstitutionOverview('admin-user-1');
      expect(result.institution.id).toBe('inst-primary');
    });

    it('should scope student queries strictly to authenticated institutionId', async () => {
      mockPrisma.institutionProfile.findUnique.mockResolvedValue({
        id: 'inst-1',
        name: 'National Institute of Engineering',
        userId: 'admin-user-1',
      });

      mockPrisma.studentProfile.findMany.mockResolvedValue([]);

      await analyticsService.getInstitutionOverview('admin-user-1');

      expect(mockPrisma.studentProfile.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            institutionId: 'inst-1',
          }),
        }),
      );
    });
  });

  describe('Institutional & Placement Metric Calculations', () => {
    const mockInstitution = {
      id: 'inst-1',
      name: 'National Institute of Engineering',
      code: 'NIE01',
      city: 'Mysore',
      state: 'Karnataka',
    };

    const mockStudents = [
      {
        id: 'student-1',
        fullName: 'Rahul Verma',
        department: 'Computer Science',
        graduationYear: 2026,
        cgpa: 9.0,
        studentSkills: [
          {
            verificationStatus: VerificationStatus.VERIFIED,
            skill: { id: 's1', name: 'TypeScript' },
          },
          {
            verificationStatus: VerificationStatus.PENDING,
            skill: { id: 's2', name: 'Docker' },
          },
        ],
        assessmentAttempts: [
          { id: 'att-1', score: 90, passed: true },
        ],
        applications: [
          {
            id: 'app-1',
            status: ApplicationStatus.SELECTED,
            opportunity: {
              id: 'opp-1',
              title: 'Software Engineer',
              opportunityType: 'FULL_TIME_JOB',
              industryProfile: { companyName: 'Google' },
            },
          },
        ],
      },
      {
        id: 'student-2',
        fullName: 'Priya Sharma',
        department: 'Computer Science',
        graduationYear: 2026,
        cgpa: 8.0,
        studentSkills: [
          {
            verificationStatus: VerificationStatus.VERIFIED,
            skill: { id: 's1', name: 'TypeScript' },
          },
        ],
        assessmentAttempts: [
          { id: 'att-2', score: 50, passed: false },
        ],
        applications: [
          {
            id: 'app-2',
            status: ApplicationStatus.SHORTLISTED,
            opportunity: {
              id: 'opp-2',
              title: 'Frontend Intern',
              opportunityType: 'INTERNSHIP',
              industryProfile: { companyName: 'Microsoft' },
            },
          },
        ],
      },
      {
        id: 'student-3',
        fullName: 'Amit Patel',
        department: 'Electrical Engineering',
        graduationYear: 2025,
        cgpa: 7.0,
        studentSkills: [],
        assessmentAttempts: [],
        applications: [],
      },
    ];

    beforeEach(() => {
      mockPrisma.institutionProfile.findUnique.mockResolvedValue(mockInstitution);
      mockPrisma.studentProfile.findMany.mockResolvedValue(mockStudents);
    });

    it('should compute exact placement rate and application funnel metrics', async () => {
      const result = await analyticsService.getInstitutionOverview('admin-user-1');

      expect(result.summary.totalStudents).toBe(3);
      expect(result.summary.placedStudentsCount).toBe(1); // student-1 has SELECTED status
      expect(result.summary.placementRate).toBe(33.3); // 1 / 3 * 100

      expect(result.summary.totalApplications).toBe(2);
      expect(result.summary.selectedCount).toBe(1);
      expect(result.summary.shortlistedCount).toBe(1);
      expect(result.summary.applicationConversionRate).toBe(50.0); // 1 / 2 * 100

      expect(result.funnel.applied).toBe(2);
      expect(result.funnel.shortlisted).toBe(1);
      expect(result.funnel.selected).toBe(1);
    });

    it('should compute verified skills and assessment pass rates', async () => {
      const result = await analyticsService.getInstitutionOverview('admin-user-1');

      expect(result.summary.totalSkillsRecorded).toBe(3);
      expect(result.summary.totalVerifiedSkills).toBe(2);
      expect(result.summary.skillVerificationRate).toBe(66.7); // 2 / 3 * 100

      expect(result.summary.totalAssessmentAttempts).toBe(2);
      expect(result.summary.assessmentPassRate).toBe(50.0); // 1 / 2 * 100
      expect(result.summary.averageAssessmentScore).toBe(70.0); // (90 + 50) / 2
    });

    it('should aggregate department metrics and graduation batch trends', async () => {
      const result = await analyticsService.getInstitutionOverview('admin-user-1');

      const csDept = result.departmentAnalytics.find((d) => d.department === 'Computer Science');
      expect(csDept).toBeDefined();
      expect(csDept?.totalStudents).toBe(2);
      expect(csDept?.placedStudents).toBe(1);
      expect(csDept?.placementRate).toBe(50.0);
      expect(csDept?.averageCgpa).toBe(8.5); // (9.0 + 8.0) / 2

      const eeDept = result.departmentAnalytics.find((d) => d.department === 'Electrical Engineering');
      expect(eeDept).toBeDefined();
      expect(eeDept?.totalStudents).toBe(1);
      expect(eeDept?.placedStudents).toBe(0);
      expect(eeDept?.placementRate).toBe(0);

      const batch2026 = result.batchTrends.find((b) => b.graduationYear === 2026);
      expect(batch2026).toBeDefined();
      expect(batch2026?.totalStudents).toBe(2);
      expect(batch2026?.placedStudents).toBe(1);
      expect(batch2026?.placementRate).toBe(50.0);
    });
  });

  describe('Super Admin: Global Platform Overview', () => {
    it('should aggregate global platform statistics across all stakeholders', async () => {
      mockPrisma.institutionProfile.count.mockResolvedValue(15);
      mockPrisma.industryProfile.count.mockResolvedValue(45);
      mockPrisma.studentProfile.count.mockResolvedValue(1200);
      mockPrisma.opportunity.count.mockResolvedValue(80);
      mockPrisma.application.count.mockImplementation((args?: any) => {
        if (args?.where?.status === 'SELECTED') return Promise.resolve(480);
        return Promise.resolve(2500);
      });
      mockPrisma.assessment.count.mockResolvedValue(30);

      const result = await analyticsService.getPlatformOverview();

      expect(result.summary.totalInstitutions).toBe(15);
      expect(result.summary.totalIndustries).toBe(45);
      expect(result.summary.totalStudents).toBe(1200);
      expect(result.summary.totalOpportunities).toBe(80);
      expect(result.summary.totalApplications).toBe(2500);
      expect(result.summary.selectedApplications).toBe(480);
      expect(result.summary.globalPlacementRate).toBe(40.0); // 480 / 1200 * 100
    });
  });

  describe('Reporting & CSV Export', () => {
    it('should generate valid CSV department report for authorized institution', async () => {
      mockPrisma.institutionProfile.findUnique.mockResolvedValue({
        id: 'inst-1',
        name: 'Tech Institute',
      });
      mockPrisma.studentProfile.findMany.mockResolvedValue([]);

      const csv = await analyticsService.exportInstitutionReport('admin-user-1', 'departments');

      expect(csv).toContain('Department,Total Students,Placed Students,Placement Rate (%)');
    });

    it('should generate valid CSV placement summary report', async () => {
      mockPrisma.institutionProfile.findUnique.mockResolvedValue({
        id: 'inst-1',
        name: 'Tech Institute',
      });
      mockPrisma.studentProfile.findMany.mockResolvedValue([]);

      const csv = await analyticsService.exportInstitutionReport('admin-user-1', 'placements');

      expect(csv).toContain('"Institution Name","Tech Institute"');
      expect(csv).toContain('"Total Enrolled Students",0');
    });
  });
});

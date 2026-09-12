import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { LearningResourcesService } from '../src/modules/learning/services/learning-resources.service';
import { LearningPathsService } from '../src/modules/learning/services/learning-paths.service';
import { StudentLearningService } from '../src/modules/learning/services/student-learning.service';
import { LearningRemediationService } from '../src/modules/learning/services/learning-remediation.service';
import { AnalyticsService } from '../src/modules/analytics/services/analytics.service';
import {
  UserRole,
  ProficiencyLevel,
  LearningResourceType,
  LearningResourceDifficulty,
  LearningPathStatus,
  StudentResourceStatus,
  StudentPathEnrollmentStatus,
} from '@prisma/client';

describe('Phase 12: Learning Resources & Guided Learning Paths Spec', () => {
  let resourcesService: LearningResourcesService;
  let pathsService: LearningPathsService;
  let studentLearningService: StudentLearningService;
  let remediationService: LearningRemediationService;
  let analyticsService: AnalyticsService;
  let mockSkillGapService: any;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      $transaction: vi.fn((cb) => cb(mockPrisma)),
      learningResource: {
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        count: vi.fn(),
        groupBy: vi.fn(),
      },
      learningPath: {
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        count: vi.fn(),
      },
      learningPathItem: {
        findMany: vi.fn(),
        create: vi.fn(),
        createMany: vi.fn(),
        deleteMany: vi.fn(),
      },
      studentResourceProgress: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        count: vi.fn(),
      },
      studentPathEnrollment: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        count: vi.fn(),
      },
      skill: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
      },
      careerRole: {
        findUnique: vi.fn(),
      },
      studentProfile: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
        count: vi.fn(),
      },
      user: {
        findUnique: vi.fn(),
      },
      assessment: {
        findMany: vi.fn(),
        count: vi.fn(),
      },
      institutionProfile: {
        findUnique: vi.fn(),
        count: vi.fn(),
      },
      industryProfile: {
        findUnique: vi.fn(),
        count: vi.fn(),
      },
      opportunity: {
        count: vi.fn(),
      },
      application: {
        count: vi.fn(),
      },
    };

    mockSkillGapService = {
      getRoleSkillGap: vi.fn(),
      getStudentReadinessOverview: vi.fn(),
    };

    resourcesService = new LearningResourcesService(mockPrisma as any);
    pathsService = new LearningPathsService(mockPrisma as any);
    studentLearningService = new StudentLearningService(mockPrisma as any);
    remediationService = new LearningRemediationService(
      mockPrisma as any,
      mockSkillGapService as any,
    );
    analyticsService = new AnalyticsService(mockPrisma as any);
  });

  describe('LearningResourcesService', () => {
    it('should create a curated learning resource for a valid skill', async () => {
      mockPrisma.skill.findUnique.mockResolvedValue({ id: 'skill-1', name: 'TypeScript' });
      mockPrisma.learningResource.findUnique.mockResolvedValue(null);
      mockPrisma.learningResource.create.mockImplementation(({ data }: { data: Record<string, unknown> }) =>
        Promise.resolve({ id: 'res-1', ...data }),
      );

      const result = await resourcesService.create('user-faculty-1', UserRole.FACULTY, {
        title: 'Mastering TypeScript Generics',
        description: 'Deep dive into advanced TypeScript type systems and conditional types',
        url: 'https://example.com/ts-generics',
        skillId: 'skill-1',
        resourceType: LearningResourceType.ARTICLE,
        difficulty: LearningResourceDifficulty.ADVANCED,
        targetProficiency: ProficiencyLevel.ADVANCED,
        estimatedMinutes: 45,
      });

      expect(result.id).toBe('res-1');
      expect(result.title).toBe('Mastering TypeScript Generics');
      expect(result.slug).toBe('mastering-typescript-generics');
      expect(result.authorRole).toBe(UserRole.FACULTY);
      expect(result.isVerified).toBe(false);
    });

    it('should auto-verify resources created by SUPER_ADMIN', async () => {
      mockPrisma.skill.findUnique.mockResolvedValue({ id: 'skill-1', name: 'TypeScript' });
      mockPrisma.learningResource.findUnique.mockResolvedValue(null);
      mockPrisma.learningResource.create.mockImplementation(({ data }: { data: Record<string, unknown> }) =>
        Promise.resolve({ id: 'res-admin', ...data }),
      );

      const result = await resourcesService.create('user-admin-1', UserRole.SUPER_ADMIN, {
        title: 'Official Node.js Docs',
        description: 'Core runtime documentation',
        url: 'https://nodejs.org/docs',
        skillId: 'skill-1',
      });

      expect(result.isVerified).toBe(true);
    });

    it('should reject resource creation when skillId is invalid', async () => {
      mockPrisma.skill.findUnique.mockResolvedValue(null);

      await expect(
        resourcesService.create('user-1', UserRole.FACULTY, {
          title: 'Unknown Tech Guide',
          description: 'Testing',
          url: 'https://example.com',
          skillId: 'invalid-skill',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should enforce IDOR protection when updating a resource', async () => {
      mockPrisma.learningResource.findUnique.mockResolvedValue({
        id: 'res-1',
        authorUserId: 'author-user-1',
        title: 'Initial Title',
      });

      // Different user trying to edit
      await expect(
        resourcesService.update('attacker-user', UserRole.FACULTY, 'res-1', {
          title: 'Hacked Title',
        }),
      ).rejects.toThrow(ForbiddenException);

      // Super admin can edit any resource
      mockPrisma.learningResource.update.mockResolvedValue({
        id: 'res-1',
        title: 'Admin Edited Title',
      });
      const adminEdit = await resourcesService.update('admin-user', UserRole.SUPER_ADMIN, 'res-1', {
        title: 'Admin Edited Title',
      });
      expect(adminEdit.title).toBe('Admin Edited Title');
    });

    it('should allow admins to verify and endorse resources', async () => {
      mockPrisma.learningResource.findUnique.mockResolvedValue({ id: 'res-1', isVerified: false });
      mockPrisma.learningResource.update.mockResolvedValue({ id: 'res-1', isVerified: true });

      const verified = await resourcesService.verify('res-1', true);
      expect(verified.isVerified).toBe(true);
    });
  });

  describe('LearningPathsService', () => {
    it('should create a structured learning path with validated ordered items', async () => {
      mockPrisma.careerRole.findUnique.mockResolvedValue({ id: 'role-1', title: 'Backend Engineer' });
      mockPrisma.learningResource.findMany.mockResolvedValue([
        { id: 'res-1' },
        { id: 'res-2' },
      ]);
      mockPrisma.learningPath.findUnique.mockResolvedValue(null);
      mockPrisma.learningPath.create.mockResolvedValue({
        id: 'path-1',
        title: 'Backend Mastery Path',
        slug: 'backend-mastery-path',
        items: [
          { resourceId: 'res-1', order: 1 },
          { resourceId: 'res-2', order: 2 },
        ],
      });

      const path = await pathsService.create('user-industry-1', UserRole.INDUSTRY, {
        title: 'Backend Mastery Path',
        description: 'Complete syllabus for backend engineers',
        careerRoleId: 'role-1',
        targetProficiency: ProficiencyLevel.ADVANCED,
        estimatedHours: 25,
        items: [
          { resourceId: 'res-1', order: 1, isMandatory: true },
          { resourceId: 'res-2', order: 2, isMandatory: true },
        ],
      });

      expect(path.id).toBe('path-1');
      expect(path.items.length).toBe(2);
    });

    it('should reject path creation with duplicate resource IDs', async () => {
      await expect(
        pathsService.create('user-1', UserRole.FACULTY, {
          title: 'Duplicate Items Path',
          description: 'Testing',
          items: [
            { resourceId: 'res-1', order: 1 },
            { resourceId: 'res-1', order: 2 },
          ],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject path creation with duplicate order indices', async () => {
      mockPrisma.learningResource.findMany.mockResolvedValue([
        { id: 'res-1' },
        { id: 'res-2' },
      ]);

      await expect(
        pathsService.create('user-1', UserRole.FACULTY, {
          title: 'Duplicate Orders Path',
          description: 'Testing',
          items: [
            { resourceId: 'res-1', order: 1 },
            { resourceId: 'res-2', order: 1 },
          ],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should enforce IDOR protection when deleting a path', async () => {
      mockPrisma.learningPath.findUnique.mockResolvedValue({
        id: 'path-1',
        authorUserId: 'author-1',
      });

      await expect(
        pathsService.delete('attacker-user', UserRole.FACULTY, 'path-1'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('StudentLearningService', () => {
    it('should enroll student in a learning path and calculate initial progress', async () => {
      mockPrisma.studentProfile.findUnique.mockResolvedValue({ id: 'student-profile-1' });
      mockPrisma.learningPath.findUnique.mockResolvedValue({
        id: 'path-1',
        status: LearningPathStatus.PUBLISHED,
        items: [{ resourceId: 'res-1' }, { resourceId: 'res-2' }],
      });
      mockPrisma.studentPathEnrollment.findUnique.mockResolvedValue(null);
      mockPrisma.studentResourceProgress.findMany.mockResolvedValue([]);
      mockPrisma.studentPathEnrollment.create.mockResolvedValue({
        id: 'enrollment-1',
        studentProfileId: 'student-profile-1',
        learningPathId: 'path-1',
        status: StudentPathEnrollmentStatus.ENROLLED,
        progressPercentage: 0,
        totalItemsCount: 2,
      });

      const enrollment = await studentLearningService.enrollInPath('user-student-1', 'path-1');
      expect(enrollment.id).toBe('enrollment-1');
      expect(enrollment.status).toBe(StudentPathEnrollmentStatus.ENROLLED);
      expect(enrollment.progressPercentage).toBe(0);
    });

    it('should update resource progress and deterministically recalculate enrolled path progress to 100% COMPLETED', async () => {
      mockPrisma.studentProfile.findUnique.mockResolvedValue({ id: 'student-profile-1' });
      mockPrisma.learningResource.findUnique.mockResolvedValue({ id: 'res-1' });
      mockPrisma.studentResourceProgress.findUnique.mockResolvedValue(null);
      mockPrisma.studentResourceProgress.create.mockResolvedValue({
        id: 'prog-1',
        status: StudentResourceStatus.COMPLETED,
        timeSpentMinutes: 30,
      });

      // Path item lookup for recalculation
      mockPrisma.learningPathItem.findMany.mockResolvedValue([
        { learningPathId: 'path-1' },
      ]);
      mockPrisma.studentPathEnrollment.findMany.mockResolvedValue([
        {
          id: 'enrollment-1',
          studentProfileId: 'student-profile-1',
          learningPathId: 'path-1',
          learningPath: {
            items: [{ resourceId: 'res-1' }], // 1 total item
          },
        },
      ]);
      // 1 of 1 item completed
      mockPrisma.studentResourceProgress.count.mockResolvedValue(1);

      await studentLearningService.updateResourceProgress('user-student-1', 'res-1', {
        status: StudentResourceStatus.COMPLETED,
        timeSpentMinutes: 30,
        rating: 5,
      });

      expect(mockPrisma.studentPathEnrollment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'enrollment-1' },
          data: expect.objectContaining({
            progressPercentage: 100,
            completedItemsCount: 1,
            status: StudentPathEnrollmentStatus.COMPLETED,
          }),
        }),
      );
    });
  });

  describe('LearningRemediationService', () => {
    it('should deterministically generate a skill gap remediation plan with linked assessment and resources', async () => {
      mockSkillGapService.getRoleSkillGap.mockResolvedValue({
        careerRole: {
          id: 'role-backend',
          title: 'Backend Engineer',
          slug: 'backend-engineer',
          category: 'Software Engineering',
        },
        overallScore: 65,
        skillRequirements: [
          {
            skillId: 'skill-docker',
            skillName: 'Docker',
            categoryName: 'DevOps',
            requiredProficiency: 'ADVANCED',
            studentProficiency: 'BEGINNER',
            status: 'DEFICIT',
            gapLevels: 2,
          },
          {
            skillId: 'skill-react',
            skillName: 'React',
            categoryName: 'Frontend',
            requiredProficiency: 'INTERMEDIATE',
            studentProficiency: 'INTERMEDIATE',
            status: 'SATISFIED',
            gapLevels: 0,
          },
        ],
      });

      mockPrisma.learningResource.findMany.mockResolvedValue([
        {
          id: 'res-docker-1',
          skillId: 'skill-docker',
          title: 'Docker Deep Dive',
          isVerified: true,
          rating: 4.8,
          estimatedMinutes: 60,
          skill: { id: 'skill-docker', name: 'Docker' },
        },
      ]);

      mockPrisma.assessment.findMany.mockResolvedValue([
        {
          id: 'assessment-docker',
          skillId: 'skill-docker',
          title: 'Docker Advanced Assessment',
          passingScore: 75,
          durationMinutes: 30,
        },
      ]);

      mockPrisma.learningPath.findMany.mockResolvedValue([
        {
          id: 'path-devops',
          title: 'DevOps for Backend',
          careerRole: { id: 'role-backend', title: 'Backend Engineer' },
          items: [],
          _count: { enrollments: 12, items: 3 },
        },
      ]);

      const plan = await remediationService.getRemediationForCareerRole('user-1', 'backend-engineer');

      expect(plan.careerRole.title).toBe('Backend Engineer');
      expect(plan.totalDeficitSkillsCount).toBe(1);
      expect(plan.totalEstimatedRemediationHours).toBe(30); // 2 gap levels * 15 hrs
      expect(plan.skillRemediations[0].skillName).toBe('Docker');
      expect(plan.skillRemediations[0].resources.length).toBe(1);
      expect(plan.skillRemediations[0].linkedAssessment?.title).toBe('Docker Advanced Assessment');
      expect(plan.recommendedPaths.length).toBe(1);
    });
  });

  describe('AnalyticsService (Learning Integration)', () => {
    it('should aggregate global learning resources, paths, and enrollments for Super Admin', async () => {
      mockPrisma.learningResource.count.mockResolvedValueOnce(25); // total
      mockPrisma.learningResource.count.mockResolvedValueOnce(18); // verified
      mockPrisma.learningPath.count.mockResolvedValue(10);
      mockPrisma.studentPathEnrollment.count.mockResolvedValueOnce(50); // total
      mockPrisma.studentPathEnrollment.count.mockResolvedValueOnce(20); // completed
      mockPrisma.learningResource.groupBy.mockResolvedValueOnce([
        { resourceType: 'ARTICLE', _count: { id: 15 } },
        { resourceType: 'VIDEO', _count: { id: 10 } },
      ]);
      mockPrisma.learningResource.groupBy.mockResolvedValueOnce([
        { difficulty: 'BEGINNER', _count: { id: 12 } },
        { difficulty: 'ADVANCED', _count: { id: 13 } },
      ]);
      mockPrisma.learningResource.groupBy.mockResolvedValueOnce([
        { authorRole: 'FACULTY', _count: { id: 14 } },
        { authorRole: 'INDUSTRY', _count: { id: 11 } },
      ]);

      const analytics = await analyticsService.getLearningAnalytics('admin-user', UserRole.SUPER_ADMIN);

      expect(analytics.scope).toBe('PLATFORM');
      expect(analytics.summary.totalResources).toBe(25);
      expect(analytics.summary.verifiedResources).toBe(18);
      expect(analytics.summary.totalPaths).toBe(10);
      expect(analytics.summary.totalEnrollments).toBe(50);
      expect(analytics.summary.completedEnrollments).toBe(20);
      expect(analytics.summary.globalCompletionRate).toBe(40);
    });
  });
});

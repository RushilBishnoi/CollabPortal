import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AssessmentsService } from '../src/modules/assessments/services/assessments.service';
import { OpportunitiesService } from '../src/modules/opportunities/services/opportunities.service';
import { OpportunityMatchingService } from '../src/modules/opportunities/services/opportunity-matching.service';
import { SkillGapService } from '../src/modules/skill-gap/services/skill-gap.service';
import { PlacementDocumentsService } from '../src/modules/placements/services/placement-documents.service';
import { AnalyticsService } from '../src/modules/analytics/services/analytics.service';
import {
  AttemptStatus,
  OpportunityType,
  OpportunityStatus,
  ProficiencyLevel,
  VerificationStatus,
  UserRole,
  ApplicationStatus,
} from '@prisma/client';
import fs from 'fs';

describe('Phase 18 Performance Regression & Verification Tests', () => {
  // ──────────────────────────────────────────────────────────────────────────
  // 1. Assessment Submission Batching & Query Bounds
  // ──────────────────────────────────────────────────────────────────────────
  describe('Assessment Submission Batching', () => {
    let assessmentsService: AssessmentsService;
    let mockPrisma: any;

    beforeEach(() => {
      mockPrisma = {
        user: { findUnique: vi.fn() },
        studentProfile: { findUnique: vi.fn(), create: vi.fn() },
        assessment: { findMany: vi.fn(), findUnique: vi.fn() },
        assessmentAttempt: {
          findMany: vi.fn(),
          findUnique: vi.fn(),
          create: vi.fn(),
          update: vi.fn(),
        },
        attemptAnswer: {
          findMany: vi.fn(),
          upsert: vi.fn(),
          updateMany: vi.fn(),
          create: vi.fn(),
          createMany: vi.fn(),
        },
        studentSkill: {
          findUnique: vi.fn(),
          update: vi.fn(),
          create: vi.fn(),
        },
      };
      assessmentsService = new AssessmentsService(mockPrisma);
    });

    it('should batch unanswered questions in a single createMany call rather than N sequential queries', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'u-1',
        email: 'student@institution.edu',
        role: UserRole.STUDENT,
        studentProfile: { id: 'sp-1' },
      });

      mockPrisma.studentProfile.findUnique.mockResolvedValue({
        id: 'sp-1',
        userId: 'u-1',
      });

      const questions = [
        { id: 'q-1', points: 20, options: [{ id: 'opt-1a', isCorrect: true }, { id: 'opt-1b', isCorrect: false }] },
        { id: 'q-2', points: 20, options: [{ id: 'opt-2a', isCorrect: true }, { id: 'opt-2b', isCorrect: false }] },
        { id: 'q-3', points: 20, options: [{ id: 'opt-3a', isCorrect: true }, { id: 'opt-3b', isCorrect: false }] },
        { id: 'q-4', points: 20, options: [{ id: 'opt-4a', isCorrect: true }, { id: 'opt-4b', isCorrect: false }] },
        { id: 'q-5', points: 20, options: [{ id: 'opt-5a', isCorrect: true }, { id: 'opt-5b', isCorrect: false }] },
      ];

      const mockAttempt = {
        id: 'att-1',
        studentProfileId: 'sp-1',
        status: AttemptStatus.IN_PROGRESS,
        startedAt: new Date(Date.now() - 5 * 60 * 1000),
        assessment: {
          id: 'as-1',
          title: 'TypeScript Assessment',
          durationMinutes: 30,
          passingScore: 60,
          skillId: 'sk-1',
          skill: { id: 'sk-1', name: 'TypeScript' },
          targetProficiency: ProficiencyLevel.INTERMEDIATE,
          questions,
        },
        answers: [
          { questionId: 'q-1', selectedOptionId: 'opt-1a', isCorrect: true, earnedPoints: 20 },
          { questionId: 'q-2', selectedOptionId: 'opt-2b', isCorrect: false, earnedPoints: 0 },
        ],
        score: 20,
        passed: false,
        totalPoints: 100,
        earnedPoints: 20,
      };

      mockPrisma.assessmentAttempt.findUnique.mockResolvedValue(mockAttempt);
      mockPrisma.attemptAnswer.createMany.mockResolvedValue({ count: 3 });
      mockPrisma.attemptAnswer.updateMany.mockResolvedValue({ count: 1 });
      mockPrisma.assessmentAttempt.update.mockResolvedValue({
        ...mockAttempt,
        status: AttemptStatus.COMPLETED,
      });

      const result = await assessmentsService.submitAttempt('u-1', 'att-1');

      expect(mockPrisma.attemptAnswer.createMany).toHaveBeenCalledTimes(1);
      expect(mockPrisma.attemptAnswer.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({ attemptId: 'att-1', questionId: 'q-3', selectedOptionId: null }),
          expect.objectContaining({ attemptId: 'att-1', questionId: 'q-4', selectedOptionId: null }),
          expect.objectContaining({ attemptId: 'att-1', questionId: 'q-5', selectedOptionId: null }),
        ]),
        skipDuplicates: true,
      });

      expect(mockPrisma.attemptAnswer.updateMany).toHaveBeenCalledTimes(2);
      expect(mockPrisma.assessmentAttempt.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'att-1' },
          data: expect.objectContaining({
            status: AttemptStatus.COMPLETED,
            score: 20,
            passed: false,
          }),
        }),
      );
      expect(result.score).toBe(20);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 2. Opportunity Skill Creation Batching
  // ──────────────────────────────────────────────────────────────────────────
  describe('Opportunity Skill Creation Batching', () => {
    let opportunitiesService: OpportunitiesService;
    let mockPrisma: any;

    beforeEach(() => {
      mockPrisma = {
        $transaction: vi.fn(async (cb) => cb(mockPrisma)),
        industryProfile: { findUnique: vi.fn() },
        opportunity: {
          create: vi.fn(),
          findUnique: vi.fn(),
          count: vi.fn(),
        },
        skill: {
          findMany: vi.fn(),
          findUnique: vi.fn(),
        },
        opportunitySkill: {
          createMany: vi.fn(),
          create: vi.fn(),
        },
      };
      opportunitiesService = new OpportunitiesService(mockPrisma);
    });

    it('should use single tx.skill.findMany and tx.opportunitySkill.createMany for batched skill validation and insertion', async () => {
      mockPrisma.industryProfile.findUnique.mockResolvedValue({
        id: 'ind-1',
        isVerified: true,
      });

      mockPrisma.opportunity.findUnique.mockResolvedValue(null);

      mockPrisma.opportunity.create.mockResolvedValue({
        id: 'opp-100',
        industryProfileId: 'ind-1',
        title: 'Backend Engineer Intern',
        slug: 'backend-engineer-intern',
        status: OpportunityStatus.DRAFT,
      });

      mockPrisma.skill.findMany.mockResolvedValue([
        { id: 'sk-1' },
        { id: 'sk-2' },
        { id: 'sk-3' },
      ]);

      mockPrisma.opportunitySkill.createMany.mockResolvedValue({ count: 3 });

      await opportunitiesService.create('user-ind-1', {
        title: 'Backend Engineer Intern',
        slug: 'backend-engineer-intern',
        description: 'Join our backend engineering team',
        opportunityType: OpportunityType.INTERNSHIP,
        location: 'Bengaluru',
        isRemote: false,
        skills: [
          { skillId: 'sk-1', requiredProficiency: ProficiencyLevel.INTERMEDIATE, isMandatory: true, weight: 1.0 },
          { skillId: 'sk-2', requiredProficiency: ProficiencyLevel.ADVANCED, isMandatory: true, weight: 1.5 },
          { skillId: 'sk-3', requiredProficiency: ProficiencyLevel.BEGINNER, isMandatory: false, weight: 0.8 },
        ],
      });

      expect(mockPrisma.skill.findMany).toHaveBeenCalledTimes(1);
      expect(mockPrisma.skill.findMany).toHaveBeenCalledWith({
        where: { id: { in: ['sk-1', 'sk-2', 'sk-3'] } },
        select: { id: true },
      });

      expect(mockPrisma.opportunitySkill.createMany).toHaveBeenCalledTimes(1);
      expect(mockPrisma.opportunitySkill.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({ opportunityId: 'opp-100', skillId: 'sk-1' }),
          expect.objectContaining({ opportunityId: 'opp-100', skillId: 'sk-2' }),
          expect.objectContaining({ opportunityId: 'opp-100', skillId: 'sk-3' }),
        ]),
        skipDuplicates: true,
      });

      expect(mockPrisma.skill.findUnique).not.toHaveBeenCalled();
      expect(mockPrisma.opportunitySkill.create).not.toHaveBeenCalled();
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 3. Skill-Gap Profile Lookup Reuse
  // ──────────────────────────────────────────────────────────────────────────
  describe('Skill-Gap Redundant Profile Lookup Elimination', () => {
    let skillGapService: SkillGapService;
    let mockPrisma: any;

    beforeEach(() => {
      mockPrisma = {
        studentProfile: {
          findUnique: vi.fn(),
        },
        careerRole: {
          findMany: vi.fn(),
          findUnique: vi.fn(),
        },
      };
      skillGapService = new SkillGapService(mockPrisma);
    });

    it('should resolve student profile exactly once during getStudentReadinessOverview and reuse it', async () => {
      mockPrisma.studentProfile.findUnique.mockResolvedValue({
        id: 'sp-1',
        userId: 'user-stu-1',
        department: 'Computer Science',
        cgpa: 8.5,
        targetRoleInterests: ['Backend Developer'],
        projectsSummary: 'Built fullstack web apps',
        studentSkills: [
          {
            id: 'ss-1',
            skillId: 'sk-1',
            proficiency: ProficiencyLevel.INTERMEDIATE,
            verificationStatus: VerificationStatus.VERIFIED,
            score: 85,
            skill: { id: 'sk-1', name: 'Node.js', category: { id: 'cat-1', name: 'Backend' } },
          },
        ],
        assessmentAttempts: [
          {
            score: 85,
            passed: true,
            createdAt: new Date(),
            assessment: {
              skillId: 'sk-1',
              targetProficiency: ProficiencyLevel.INTERMEDIATE,
            },
          },
        ],
      });

      mockPrisma.careerRole.findMany.mockResolvedValue([
        {
          id: 'cr-1',
          title: 'Backend Developer',
          slug: 'backend-developer',
          category: 'Software Engineering',
          isActive: true,
          skills: [
            {
              id: 'crs-1',
              skillId: 'sk-1',
              requiredProficiency: ProficiencyLevel.INTERMEDIATE,
              weight: 1.0,
              isMandatory: true,
              skill: { id: 'sk-1', name: 'Node.js', category: { id: 'cat-1', name: 'Backend' } },
            },
          ],
        },
      ]);

      const overview = await skillGapService.getStudentReadinessOverview('user-stu-1');

      expect(mockPrisma.studentProfile.findUnique).toHaveBeenCalledTimes(1);
      expect(mockPrisma.studentProfile.findUnique).toHaveBeenCalledWith({
        where: { userId: 'user-stu-1' },
        include: expect.any(Object),
      });

      expect(overview).toBeDefined();
      expect(overview.topRecommendations).toHaveLength(1);
      expect(overview.verifiedSkills).toHaveLength(1);
      expect(overview.verifiedSkills[0].name).toBe('Node.js');
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 4. Deterministic Opportunity Matching Correctness
  // ──────────────────────────────────────────────────────────────────────────
  describe('Deterministic Opportunity Matching Correctness & Invariants', () => {
    let matchingService: OpportunityMatchingService;
    let mockPrisma: any;

    beforeEach(() => {
      mockPrisma = {
        studentProfile: { findUnique: vi.fn() },
        opportunity: { findMany: vi.fn(), count: vi.fn() },
      };
      matchingService = new OpportunityMatchingService(mockPrisma);
    });

    it('should compute deterministic match score based on verified skill proficiency weights without AI/ML', () => {
      const studentProfile: any = {
        id: 'sp-1',
        department: 'Computer Science',
        cgpa: 8.2,
        studentSkills: [
          {
            skillId: 'sk-1',
            proficiency: ProficiencyLevel.INTERMEDIATE,
            verificationStatus: VerificationStatus.VERIFIED,
          },
          {
            skillId: 'sk-2',
            proficiency: ProficiencyLevel.BEGINNER,
            verificationStatus: VerificationStatus.VERIFIED,
          },
        ],
      };

      const opportunity: any = {
        id: 'opp-1',
        title: 'Backend Engineer Intern',
        minCgpa: 7.0,
        eligibleDepartments: ['Computer Science', 'Information Technology'],
        industryProfile: {
          id: 'ind-1',
          companyName: 'Acme Corp',
          industryType: 'Technology',
        },
        skills: [
          {
            skillId: 'sk-1',
            requiredProficiency: ProficiencyLevel.INTERMEDIATE,
            weight: 1.0,
            isMandatory: true,
            skill: { name: 'TypeScript' },
          },
          {
            skillId: 'sk-2',
            requiredProficiency: ProficiencyLevel.INTERMEDIATE,
            weight: 1.0,
            isMandatory: false,
            skill: { name: 'PostgreSQL' },
          },
        ],
      };

      const match = matchingService.evaluateOpportunityMatch(studentProfile, opportunity);

      expect(match.eligibility.isEligible).toBe(true);
      expect(match.eligibility.failureReasons).toHaveLength(0);
      expect(match.overallScore).toBeGreaterThan(0);
      expect(match.breakdown.skillCompatibility.score).toBeGreaterThan(0);
      expect(match.breakdown.skillCompatibility.explanation).toContain('required skills satisfied');
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 5. Placement Document Streaming Validation
  // ──────────────────────────────────────────────────────────────────────────
  describe('Placement Document Streaming', () => {
    let documentsService: PlacementDocumentsService;
    let mockPrisma: any;

    beforeEach(() => {
      mockPrisma = {
        placementDocument: { findUnique: vi.fn() },
        studentProfile: { findUnique: vi.fn() },
        industryProfile: { findUnique: vi.fn() },
        institutionProfile: { findUnique: vi.fn() },
      };
      documentsService = new PlacementDocumentsService(mockPrisma);
    });

    it('should return filePath instead of loading full file into a buffer', async () => {
      const tempKey = 'test-doc-stream.pdf';
      const storageDir = (documentsService as any).storageDir;
      if (!fs.existsSync(storageDir)) {
        fs.mkdirSync(storageDir, { recursive: true });
      }
      const testFilePath = storageDir + '/' + tempKey;
      fs.writeFileSync(testFilePath, '%PDF-1.4 Mock content for streaming test');

      try {
        mockPrisma.placementDocument.findUnique.mockResolvedValue({
          id: 'doc-1',
          storageKey: tempKey,
          mimeType: 'application/pdf',
          fileName: 'offer_letter.pdf',
          fileSize: 42,
          studentProfileId: 'sp-1',
          offer: {
            studentProfileId: 'sp-1',
          },
          placement: null,
        });

        mockPrisma.studentProfile.findUnique.mockResolvedValue({
          id: 'sp-1',
          userId: 'user-stu-1',
        });

        const result = await documentsService.getAuthorizedDocument(
          'doc-1',
          'user-stu-1',
          UserRole.STUDENT,
        );

        expect(result).toHaveProperty('filePath');
        expect(result.filePath).toContain(tempKey);
        expect((result as any).fileBuffer).toBeUndefined();
      } finally {
        if (fs.existsSync(testFilePath)) {
          fs.unlinkSync(testFilePath);
        }
      }
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 6. Analytics Query Optimization & Semantic Equivalence
  // ──────────────────────────────────────────────────────────────────────────
  describe('Analytics Query Optimization & Equivalence', () => {
    let analyticsService: AnalyticsService;
    let mockPrisma: any;

    beforeEach(() => {
      mockPrisma = {
        institutionProfile: { findUnique: vi.fn() },
        studentProfile: { findMany: vi.fn(), count: vi.fn() },
        placementOffer: { count: vi.fn(), findMany: vi.fn() },
        placement: { count: vi.fn(), findMany: vi.fn() },
      };
      analyticsService = new AnalyticsService(mockPrisma);
    });

    it('should use targeted select projections and calculate semantically equivalent rates', async () => {
      mockPrisma.institutionProfile.findUnique.mockResolvedValue({
        id: 'inst-1',
        name: 'National Institute of Technology',
      });

      mockPrisma.studentProfile.count.mockResolvedValue(2);

      mockPrisma.studentProfile.findMany.mockResolvedValue([
        {
          id: 'sp-1',
          department: 'Computer Science',
          graduationYear: 2026,
          cgpa: 8.5,
          studentSkills: [
            {
              verificationStatus: VerificationStatus.VERIFIED,
              skill: { id: 'sk-1', name: 'TypeScript', category: { name: 'Programming' } },
            },
          ],
          assessmentAttempts: [
            { id: 'att-1', score: 80, passed: true, createdAt: new Date() },
          ],
          applications: [
            {
              id: 'app-1',
              status: ApplicationStatus.SELECTED,
              opportunity: {
                id: 'opp-1',
                title: 'Software Engineer',
                opportunityType: OpportunityType.JOB,
                industryProfile: { companyName: 'Acme Corp' },
              },
            },
          ],
        },
        {
          id: 'sp-2',
          department: 'Electrical Engineering',
          graduationYear: 2026,
          cgpa: 7.5,
          studentSkills: [],
          assessmentAttempts: [],
          applications: [],
        },
      ]);

      mockPrisma.placementOffer.count.mockResolvedValue(1);
      mockPrisma.placementOffer.findMany.mockResolvedValue([
        { ctcOffered: 1200000, status: 'ACCEPTED' },
      ]);
      mockPrisma.placement.count.mockResolvedValue(1);
      mockPrisma.placement.findMany.mockResolvedValue([
        { salaryAnnual: 1200000, status: 'CONFIRMED' },
      ]);

      const overview = await analyticsService.getInstitutionOverview('inst-admin-1');

      const findManyCall = mockPrisma.studentProfile.findMany.mock.calls[0][0];
      expect(findManyCall).toHaveProperty('select');
      expect(findManyCall).not.toHaveProperty('include');
      expect(findManyCall.select).toHaveProperty('studentSkills');
      expect(findManyCall.select).toHaveProperty('assessmentAttempts');
      expect(findManyCall.select).toHaveProperty('applications');

      expect(overview.summary.totalStudents).toBe(2);
      expect(overview.summary.totalVerifiedSkills).toBe(1);
      expect(overview.summary.placementRate).toBe(50);
    });
  });
});

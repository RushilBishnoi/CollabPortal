import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AssessmentsService } from '../src/modules/assessments/services/assessments.service';
import { ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { AttemptStatus, VerificationStatus } from '@prisma/client';

describe('Phase 6 Assessment Engine Unit & Security Tests', () => {
  let assessmentsService: AssessmentsService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      user: {
        findUnique: vi.fn(),
      },
      studentProfile: {
        findUnique: vi.fn(),
        create: vi.fn(),
      },
      assessment: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
      },
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
      },
      studentSkill: {
        findUnique: vi.fn(),
        update: vi.fn(),
        create: vi.fn(),
      },
    };

    assessmentsService = new AssessmentsService(mockPrisma);
  });

  describe('Assessment Listings & Overview', () => {
    it('should list all active assessments', async () => {
      mockPrisma.assessment.findMany.mockResolvedValue([
        {
          id: 'as-1',
          title: 'TypeScript Assessment',
          passingScore: 70,
          durationMinutes: 20,
          totalQuestions: 5,
          skill: { id: 'sk-1', name: 'TypeScript' },
        },
      ]);

      const result = await assessmentsService.listAssessments();
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('TypeScript Assessment');
    });

    it('should throw NotFoundException when assessment does not exist', async () => {
      mockPrisma.assessment.findUnique.mockResolvedValue(null);
      await expect(assessmentsService.getAssessmentById('fake-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('Anti-Cheating & Attempt Initialization', () => {
    it('should initialize attempt and strictly omit isCorrect from options', async () => {
      mockPrisma.studentProfile.findUnique.mockResolvedValue({
        id: 'sp-1',
        userId: 'student-1',
      });

      mockPrisma.assessment.findUnique.mockResolvedValue({
        id: 'as-1',
        title: 'React Assessment',
        durationMinutes: 15,
        passingScore: 70,
        isActive: true,
        skill: { id: 'sk-1', name: 'React' },
        questions: [
          {
            id: 'q-1',
            questionText: 'What is a hook?',
            points: 1,
            order: 1,
            options: [
              { id: 'opt-1', questionId: 'q-1', optionText: 'A function', order: 1 },
              { id: 'opt-2', questionId: 'q-1', optionText: 'A class', order: 2 },
            ],
          },
        ],
      });

      mockPrisma.assessmentAttempt.create.mockResolvedValue({
        id: 'att-1',
        studentProfileId: 'sp-1',
        assessmentId: 'as-1',
        status: AttemptStatus.IN_PROGRESS,
        startedAt: new Date(),
      });

      const attemptData = await assessmentsService.startAttempt('student-1', 'as-1');

      expect(attemptData.attemptId).toBe('att-1');
      expect(attemptData.questions).toHaveLength(1);

      // Verify anti-cheating: options must NOT have isCorrect property
      const firstOption = attemptData.questions[0].options[0] as any;
      expect(firstOption.isCorrect).toBeUndefined();
    });
  });

  describe('Answer Recording & IDOR Defense', () => {
    it('should record answer during active attempt', async () => {
      mockPrisma.studentProfile.findUnique.mockResolvedValue({
        id: 'sp-1',
        userId: 'student-1',
      });

      mockPrisma.assessmentAttempt.findUnique.mockResolvedValue({
        id: 'att-1',
        studentProfileId: 'sp-1',
        status: AttemptStatus.IN_PROGRESS,
        startedAt: new Date(),
        assessment: { durationMinutes: 20 },
      });

      mockPrisma.attemptAnswer.upsert.mockResolvedValue({
        id: 'ans-1',
        attemptId: 'att-1',
        questionId: 'q-1',
        selectedOptionId: 'opt-1',
      });

      const res = await assessmentsService.saveAnswer('student-1', 'att-1', {
        questionId: 'q-1',
        selectedOptionId: 'opt-1',
      });

      expect(res.selectedOptionId).toBe('opt-1');
      expect(mockPrisma.attemptAnswer.upsert).toHaveBeenCalled();
    });

    it('should reject Student A attempting to record answer on Student B attempt (IDOR)', async () => {
      // Authenticated caller is Student A (sp-1)
      mockPrisma.studentProfile.findUnique.mockResolvedValue({
        id: 'sp-1',
        userId: 'student-a',
      });

      // Target attempt belongs to Student B (sp-2)
      mockPrisma.assessmentAttempt.findUnique.mockResolvedValue({
        id: 'att-student-b',
        studentProfileId: 'sp-2',
        status: AttemptStatus.IN_PROGRESS,
        startedAt: new Date(),
        assessment: { durationMinutes: 20 },
      });

      await expect(
        assessmentsService.saveAnswer('student-a', 'att-student-b', {
          questionId: 'q-1',
          selectedOptionId: 'opt-1',
        }),
      ).rejects.toThrow(ForbiddenException);

      expect(mockPrisma.attemptAnswer.upsert).not.toHaveBeenCalled();
    });

    it('should reject recording answer when attempt duration has expired', async () => {
      mockPrisma.studentProfile.findUnique.mockResolvedValue({
        id: 'sp-1',
        userId: 'student-1',
      });

      // Attempt started 2 hours ago for a 15-minute test
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
      mockPrisma.assessmentAttempt.findUnique.mockResolvedValue({
        id: 'att-expired',
        studentProfileId: 'sp-1',
        status: AttemptStatus.IN_PROGRESS,
        startedAt: twoHoursAgo,
        assessment: { durationMinutes: 15 },
      });

      await expect(
        assessmentsService.saveAnswer('student-1', 'att-expired', {
          questionId: 'q-1',
          selectedOptionId: 'opt-1',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('Deterministic Grading & Skill Verification Promotion', () => {
    it('should grade attempt, compute score, and automatically promote StudentSkill to VERIFIED when passed', async () => {
      mockPrisma.studentProfile.findUnique.mockResolvedValue({
        id: 'sp-1',
        userId: 'student-1',
      });

      const mockAssessment = {
        id: 'as-1',
        title: 'PostgreSQL Assessment',
        passingScore: 70,
        durationMinutes: 20,
        skillId: 'sk-pg',
        skill: { id: 'sk-pg', name: 'PostgreSQL', category: { id: 'cat-1', name: 'Databases' } },
        questions: [
          {
            id: 'q-1',
            questionText: 'Q1',
            points: 1,
            order: 1,
            options: [
              { id: 'opt-1', isCorrect: true, optionText: 'Correct' },
              { id: 'opt-2', isCorrect: false, optionText: 'Wrong' },
            ],
          },
          {
            id: 'q-2',
            questionText: 'Q2',
            points: 1,
            order: 2,
            options: [
              { id: 'opt-3', isCorrect: true, optionText: 'Correct' },
              { id: 'opt-4', isCorrect: false, optionText: 'Wrong' },
            ],
          },
        ],
      };

      // Candidate answered Q1 correctly (opt-1) and Q2 correctly (opt-3) -> 100%
      mockPrisma.assessmentAttempt.findUnique
        .mockResolvedValueOnce({
          id: 'att-1',
          studentProfileId: 'sp-1',
          status: AttemptStatus.IN_PROGRESS,
          startedAt: new Date(),
          assessment: mockAssessment,
          answers: [
            { questionId: 'q-1', selectedOptionId: 'opt-1' },
            { questionId: 'q-2', selectedOptionId: 'opt-3' },
          ],
        })
        .mockResolvedValueOnce({
          id: 'att-1',
          studentProfileId: 'sp-1',
          status: AttemptStatus.COMPLETED,
          score: 100,
          passed: true,
          totalPoints: 2,
          earnedPoints: 2,
          startedAt: new Date(),
          submittedAt: new Date(),
          assessment: mockAssessment,
          answers: [
            { questionId: 'q-1', selectedOptionId: 'opt-1', isCorrect: true, earnedPoints: 1 },
            { questionId: 'q-2', selectedOptionId: 'opt-3', isCorrect: true, earnedPoints: 1 },
          ],
        });

      mockPrisma.assessmentAttempt.update.mockResolvedValue({ id: 'att-1', score: 100, passed: true });

      // Student has existing self-reported PostgreSQL skill
      mockPrisma.studentSkill.findUnique.mockResolvedValue({
        id: 'ss-pg',
        studentProfileId: 'sp-1',
        skillId: 'sk-pg',
        verificationStatus: VerificationStatus.PENDING,
      });

      const result = await assessmentsService.submitAttempt('student-1', 'att-1');

      expect(result.passed).toBe(true);
      expect(result.score).toBe(100);

      // Verify skill was promoted to VERIFIED in database
      expect(mockPrisma.studentSkill.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'ss-pg' },
          data: expect.objectContaining({
            verificationStatus: VerificationStatus.VERIFIED,
            score: 100,
            source: 'ASSESSMENT',
          }),
        }),
      );
    });

    it('should NOT downgrade an already VERIFIED skill if a student fails a subsequent attempt', async () => {
      mockPrisma.studentProfile.findUnique.mockResolvedValue({
        id: 'sp-1',
        userId: 'student-1',
      });

      const mockAssessment = {
        id: 'as-1',
        title: 'TypeScript Assessment',
        passingScore: 70,
        durationMinutes: 20,
        skillId: 'sk-ts',
        skill: { id: 'sk-ts', name: 'TypeScript', category: { id: 'cat-1', name: 'Languages' } },
        questions: [
          {
            id: 'q-1',
            questionText: 'Q1',
            points: 1,
            options: [{ id: 'opt-1', isCorrect: true, optionText: 'Correct' }],
          },
        ],
      };

      // Candidate answered incorrectly (opt-wrong) -> 0% (Failed)
      mockPrisma.assessmentAttempt.findUnique
        .mockResolvedValueOnce({
          id: 'att-fail',
          studentProfileId: 'sp-1',
          status: AttemptStatus.IN_PROGRESS,
          startedAt: new Date(),
          assessment: mockAssessment,
          answers: [{ questionId: 'q-1', selectedOptionId: 'opt-wrong' }],
        })
        .mockResolvedValueOnce({
          id: 'att-fail',
          studentProfileId: 'sp-1',
          status: AttemptStatus.COMPLETED,
          score: 0,
          passed: false,
          totalPoints: 1,
          earnedPoints: 0,
          startedAt: new Date(),
          submittedAt: new Date(),
          assessment: mockAssessment,
          answers: [{ questionId: 'q-1', selectedOptionId: 'opt-wrong', isCorrect: false, earnedPoints: 0 }],
        });

      mockPrisma.assessmentAttempt.update.mockResolvedValue({ id: 'att-fail', score: 0, passed: false });

      const result = await assessmentsService.submitAttempt('student-1', 'att-fail');

      expect(result.passed).toBe(false);
      expect(result.score).toBe(0);

      // Verify StudentSkill was NOT updated or downgraded
      expect(mockPrisma.studentSkill.update).not.toHaveBeenCalled();
      expect(mockPrisma.studentSkill.create).not.toHaveBeenCalled();
    });

    it('should return existing graded result when submitting an already COMPLETED attempt (idempotency)', async () => {
      mockPrisma.studentProfile.findUnique.mockResolvedValue({
        id: 'sp-1',
        userId: 'student-1',
      });

      const mockAssessment = {
        id: 'as-1',
        title: 'React Assessment',
        passingScore: 70,
        skillId: 'sk-react',
        skill: { id: 'sk-react', name: 'React', category: { id: 'cat-1', name: 'Web' } },
        questions: [],
      };

      // Attempt is already completed
      mockPrisma.assessmentAttempt.findUnique.mockResolvedValue({
        id: 'att-already-done',
        studentProfileId: 'sp-1',
        status: AttemptStatus.COMPLETED,
        score: 85,
        passed: true,
        totalPoints: 2,
        earnedPoints: 2,
        startedAt: new Date(),
        submittedAt: new Date(),
        assessment: mockAssessment,
        answers: [],
      });

      const result = await assessmentsService.submitAttempt('student-1', 'att-already-done');

      expect(result.status).toBe(AttemptStatus.COMPLETED);
      expect(result.score).toBe(85);
      // Verify no re-grading was triggered
      expect(mockPrisma.attemptAnswer.updateMany).not.toHaveBeenCalled();
    });

    it('should reject Student A trying to submit Student B attempt (IDOR defense)', async () => {
      mockPrisma.studentProfile.findUnique.mockResolvedValue({
        id: 'sp-1',
        userId: 'student-a',
      });

      mockPrisma.assessmentAttempt.findUnique.mockResolvedValue({
        id: 'att-student-b',
        studentProfileId: 'sp-2',
        status: AttemptStatus.IN_PROGRESS,
        startedAt: new Date(),
        assessment: { durationMinutes: 20, questions: [] },
        answers: [],
      });

      await expect(
        assessmentsService.submitAttempt('student-a', 'att-student-b'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should reject Student A trying to view Student B attempt result (IDOR defense)', async () => {
      mockPrisma.studentProfile.findUnique.mockResolvedValue({
        id: 'sp-1',
        userId: 'student-a',
      });

      mockPrisma.assessmentAttempt.findUnique.mockResolvedValue({
        id: 'att-student-b',
        studentProfileId: 'sp-2', // Belongs to Student B
        status: AttemptStatus.COMPLETED,
        assessment: { title: 'Test', skill: { name: 'React' }, questions: [] },
        answers: [],
      });

      await expect(
        assessmentsService.getAttemptResult('student-a', 'att-student-b'),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});

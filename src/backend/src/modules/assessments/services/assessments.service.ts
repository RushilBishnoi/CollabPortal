import {
  Injectable,
  Optional,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { SaveAnswerDto } from '../dto/save-answer.dto';
import { AttemptStatus, ProficiencyLevel, VerificationStatus, NotificationType, NotificationPriority } from '@prisma/client';
import { NotificationsService } from '../../notifications/services/notifications.service';

@Injectable()
export class AssessmentsService {
  private readonly logger = new Logger(AssessmentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Optional() private readonly notificationsService?: NotificationsService,
  ) {}

  /**
   * Helper to resolve student profile from authenticated JWT user ID.
   */
  private async resolveStudentProfile(userId: string) {
    const profile = await this.prisma.studentProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (!user) throw new NotFoundException('User not found');

      return this.prisma.studentProfile.create({
        data: { userId, fullName: user.email.split('@')[0] || 'Student' },
      });
    }

    return profile;
  }

  /**
   * List active assessments, optionally filtered by skill ID.
   */
  async listAssessments(skillId?: string) {
    return this.prisma.assessment.findMany({
      where: {
        isActive: true,
        ...(skillId && { skillId }),
      },
      select: {
        id: true,
        title: true,
        description: true,
        type: true,
        passingScore: true,
        durationMinutes: true,
        totalQuestions: true,
        skillId: true,
        skill: {
          select: {
            id: true,
            name: true,
            category: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { title: 'asc' },
    });
  }

  /**
   * Get single assessment metadata overview.
   */
  async getAssessmentById(id: string) {
    const assessment = await this.prisma.assessment.findUnique({
      where: { id },
      include: {
        skill: {
          select: {
            id: true,
            name: true,
            category: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!assessment || !assessment.isActive) {
      throw new NotFoundException(`Assessment '${id}' not found or is not active`);
    }

    return assessment;
  }

  /**
   * Start a new timed assessment attempt.
   * Strips 'isCorrect' from options so answers cannot be inspected via client devtools!
   */
  async startAttempt(userId: string, assessmentId: string) {
    const profile = await this.resolveStudentProfile(userId);

    const assessment = await this.prisma.assessment.findUnique({
      where: { id: assessmentId },
      include: {
        questions: {
          orderBy: { order: 'asc' },
          include: {
            options: {
              orderBy: { order: 'asc' },
              select: {
                id: true,
                questionId: true,
                optionText: true,
                order: true,
                // OMIT 'isCorrect' — anti-cheating projection
              },
            },
          },
        },
        skill: { select: { id: true, name: true } },
      },
    });

    if (!assessment || !assessment.isActive) {
      throw new NotFoundException(`Assessment '${assessmentId}' not found or inactive`);
    }

    const attempt = await this.prisma.assessmentAttempt.create({
      data: {
        studentProfileId: profile.id,
        assessmentId: assessment.id,
        status: AttemptStatus.IN_PROGRESS,
        startedAt: new Date(),
      },
    });

    return {
      attemptId: attempt.id,
      startedAt: attempt.startedAt,
      durationMinutes: assessment.durationMinutes,
      passingScore: assessment.passingScore,
      assessment: {
        id: assessment.id,
        title: assessment.title,
        description: assessment.description,
        skill: assessment.skill,
        totalQuestions: assessment.questions.length,
      },
      questions: assessment.questions.map((q) => ({
        id: q.id,
        questionText: q.questionText,
        points: q.points,
        order: q.order,
        options: q.options,
      })),
    };
  }

  /**
   * Save / record an answer during an active attempt.
   * Enforces student ownership and duration limits.
   */
  async saveAnswer(userId: string, attemptId: string, dto: SaveAnswerDto) {
    const profile = await this.resolveStudentProfile(userId);

    const attempt = await this.prisma.assessmentAttempt.findUnique({
      where: { id: attemptId },
      include: { assessment: true },
    });

    if (!attempt) {
      throw new NotFoundException('Assessment attempt not found');
    }

    // IDOR Check
    if (attempt.studentProfileId !== profile.id) {
      throw new ForbiddenException('You are not authorized to modify this assessment attempt');
    }

    if (attempt.status !== AttemptStatus.IN_PROGRESS) {
      throw new BadRequestException('This assessment attempt is no longer active');
    }

    // Verify time limit (with 60-second network grace period)
    const elapsedMs = Date.now() - new Date(attempt.startedAt).getTime();
    const allowedMs = (attempt.assessment.durationMinutes * 60 + 60) * 1000;
    if (elapsedMs > allowedMs) {
      throw new BadRequestException('Assessment duration has expired. Please submit your attempt.');
    }

    // Upsert the answer
    return this.prisma.attemptAnswer.upsert({
      where: {
        attemptId_questionId: {
          attemptId: attempt.id,
          questionId: dto.questionId,
        },
      },
      update: {
        selectedOptionId: dto.selectedOptionId,
        answeredAt: new Date(),
      },
      create: {
        attemptId: attempt.id,
        questionId: dto.questionId,
        selectedOptionId: dto.selectedOptionId,
        answeredAt: new Date(),
      },
    });
  }

  /**
   * Finalize, grade, and compute deterministic assessment results.
   * Auto-promotes StudentSkill to 'VERIFIED' status upon passing!
   */
  async submitAttempt(userId: string, attemptId: string) {
    const profile = await this.resolveStudentProfile(userId);

    const attempt = await this.prisma.assessmentAttempt.findUnique({
      where: { id: attemptId },
      include: {
        assessment: {
          include: {
            questions: {
              include: { options: true },
            },
          },
        },
        answers: true,
      },
    });

    if (!attempt) {
      throw new NotFoundException('Assessment attempt not found');
    }

    // IDOR Check
    if (attempt.studentProfileId !== profile.id) {
      throw new ForbiddenException('You are not authorized to submit this assessment attempt');
    }

    if (attempt.status === AttemptStatus.COMPLETED || attempt.status === AttemptStatus.TIMED_OUT) {
      return this.getAttemptResult(userId, attemptId);
    }

    const elapsedMs = Date.now() - new Date(attempt.startedAt).getTime();
    const allowedMs = (attempt.assessment.durationMinutes * 60 + 120) * 1000; // 2-min grace
    const isTimedOut = elapsedMs > allowedMs;

    let totalPoints = 0;
    let earnedPoints = 0;

    const answerMap = new Map(attempt.answers.map((a) => [a.questionId, a.selectedOptionId]));

    const unansweredData: Array<{
      attemptId: string;
      questionId: string;
      selectedOptionId: null;
      isCorrect: boolean;
      earnedPoints: number;
    }> = [];

    const answeredUpdates: Array<{
      attemptId: string;
      questionId: string;
      isCorrect: boolean;
      earnedPoints: number;
    }> = [];

    for (const question of attempt.assessment.questions) {
      totalPoints += question.points;
      const selectedOptionId = answerMap.get(question.id);
      const correctOption = question.options.find((o) => o.isCorrect);

      const isCorrect = !!(selectedOptionId && correctOption && selectedOptionId === correctOption.id);
      const points = isCorrect ? question.points : 0;
      earnedPoints += points;

      if (selectedOptionId) {
        answeredUpdates.push({
          attemptId: attempt.id,
          questionId: question.id,
          isCorrect,
          earnedPoints: points,
        });
      } else {
        unansweredData.push({
          attemptId: attempt.id,
          questionId: question.id,
          selectedOptionId: null,
          isCorrect: false,
          earnedPoints: 0,
        });
      }
    }

    // Batch insert unanswered questions in a single operation if supported
    if (unansweredData.length > 0) {
      if (typeof this.prisma.attemptAnswer.createMany === 'function') {
        await this.prisma.attemptAnswer.createMany({
          data: unansweredData,
          skipDuplicates: true,
        });
      } else {
        await Promise.all(
          unansweredData.map((data) => this.prisma.attemptAnswer.create({ data })),
        );
      }
    }

    // Parallelize updates for answered questions
    if (answeredUpdates.length > 0) {
      await Promise.all(
        answeredUpdates.map((au) =>
          this.prisma.attemptAnswer.updateMany({
            where: { attemptId: au.attemptId, questionId: au.questionId },
            data: { isCorrect: au.isCorrect, earnedPoints: au.earnedPoints },
          }),
        ),
      );
    }

    const score = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100 * 10) / 10 : 0;
    const passed = score >= attempt.assessment.passingScore;
    const finalStatus = isTimedOut ? AttemptStatus.TIMED_OUT : AttemptStatus.COMPLETED;

    await this.prisma.assessmentAttempt.update({
      where: { id: attempt.id },
      data: {
        status: finalStatus,
        score,
        passed,
        totalPoints,
        earnedPoints,
        submittedAt: new Date(),
      },
    });

    // ─── Skill Verification Auto-Promotion ──────────────────────────────────────────
    if (passed) {
      const skillId = attempt.assessment.skillId;
      const existingStudentSkill = await this.prisma.studentSkill.findUnique({
        where: {
          studentProfileId_skillId: {
            studentProfileId: profile.id,
            skillId,
          },
        },
      });

      if (existingStudentSkill) {
        await this.prisma.studentSkill.update({
          where: { id: existingStudentSkill.id },
          data: {
            verificationStatus: VerificationStatus.VERIFIED,
            score: Math.round(score),
            source: 'ASSESSMENT',
            lastAssessedAt: new Date(),
          },
        });
      } else {
        await this.prisma.studentSkill.create({
          data: {
            studentProfileId: profile.id,
            skillId,
            proficiency: ProficiencyLevel.INTERMEDIATE,
            verificationStatus: VerificationStatus.VERIFIED,
            score: Math.round(score),
            source: 'ASSESSMENT',
            lastAssessedAt: new Date(),
          },
        });
      }
    } else {
      // If assessment was not passed, notify student about targeted remediation resources
      if (this.notificationsService) {
        try {
          await this.notificationsService.dispatchNotification({
            recipientUserId: userId,
            type: NotificationType.SKILL_GAP_REMEDIATION_AVAILABLE,
            priority: NotificationPriority.NORMAL,
            title: 'Learning Remediation Available',
            message: `Targeted learning resources and guided paths are available to help bridge your skill gap in '${attempt.assessment.title}'.`,
            entityType: 'ASSESSMENT_ATTEMPT',
            entityId: attempt.id,
            actionUrl: '/learning',
            idempotencyKey: `SKILL_GAP_REMEDIATION:ATTEMPT:${attempt.id}:${userId}`,
          });
        } catch {
          // Safe fallback in unit tests if findMany is not mocked
        }
      }
    }

    return this.getAttemptResult(userId, attemptId);
  }

  /**
   * Retrieve graded attempt results and educational question reviews.
   */
  async getAttemptResult(userId: string, attemptId: string) {
    const profile = await this.resolveStudentProfile(userId);

    const attempt = await this.prisma.assessmentAttempt.findUnique({
      where: { id: attemptId },
      include: {
        assessment: {
          include: {
            skill: {
              select: {
                id: true,
                name: true,
                category: { select: { id: true, name: true } },
              },
            },
            questions: {
              orderBy: { order: 'asc' },
              include: {
                options: { orderBy: { order: 'asc' } },
              },
            },
          },
        },
        answers: true,
      },
    });

    if (!attempt) {
      throw new NotFoundException('Assessment attempt not found');
    }

    if (attempt.studentProfileId !== profile.id) {
      throw new ForbiddenException('You are not authorized to view this assessment result');
    }

    const answerMap = new Map(attempt.answers.map((a) => [a.questionId, a]));

    const reviewQuestions = attempt.assessment.questions.map((q) => {
      const ans = answerMap.get(q.id);
      return {
        id: q.id,
        questionText: q.questionText,
        explanation: q.explanation,
        points: q.points,
        selectedOptionId: ans?.selectedOptionId || null,
        isCorrect: ans?.isCorrect || false,
        earnedPoints: ans?.earnedPoints || 0,
        options: q.options.map((opt) => ({
          id: opt.id,
          optionText: opt.optionText,
          isCorrect: opt.isCorrect,
        })),
      };
    });

    return {
      attemptId: attempt.id,
      assessmentTitle: attempt.assessment.title,
      skillName: attempt.assessment.skill.name,
      status: attempt.status,
      score: attempt.score,
      passed: attempt.passed,
      passingScore: attempt.assessment.passingScore,
      earnedPoints: attempt.earnedPoints,
      totalPoints: attempt.totalPoints,
      startedAt: attempt.startedAt,
      submittedAt: attempt.submittedAt,
      questions: reviewQuestions,
    };
  }

  /**
   * List all assessment attempts for the authenticated student.
   */
  async getMyAttempts(userId: string) {
    const profile = await this.resolveStudentProfile(userId);

    return this.prisma.assessmentAttempt.findMany({
      where: { studentProfileId: profile.id },
      include: {
        assessment: {
          select: {
            id: true,
            title: true,
            passingScore: true,
            skill: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { startedAt: 'desc' },
    });
  }
}

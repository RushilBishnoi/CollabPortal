import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { MentorshipGoalStatus, UserRole } from '@prisma/client';
import { CreateMentorshipGoalDto } from '../dto/create-mentorship-goal.dto';
import { UpdateMentorshipGoalDto } from '../dto/update-mentorship-goal.dto';

@Injectable()
export class MentorshipGoalsService {
  constructor(private readonly prisma: PrismaService) {}

  private async verifyMentorshipAccess(
    mentorshipId: string,
    userId: string,
    userRole: UserRole,
  ) {
    const mentorship = await this.prisma.mentorship.findUnique({
      where: { id: mentorshipId },
      include: {
        mentorProfile: true,
        studentProfile: true,
      },
    });

    if (!mentorship) {
      throw new NotFoundException('Mentorship relationship not found.');
    }

    if (userRole === UserRole.SUPER_ADMIN) {
      return mentorship;
    }

    const isStudent = mentorship.studentProfile.userId === userId;
    const isMentor = mentorship.mentorProfile.userId === userId;

    if (!isStudent && !isMentor) {
      throw new ForbiddenException(
        'You are not authorized to access goals for this mentorship.',
      );
    }

    return mentorship;
  }

  /**
   * Create a goal within a mentorship
   */
  async createGoal(
    userId: string,
    userRole: UserRole,
    mentorshipId: string,
    dto: CreateMentorshipGoalDto,
  ) {
    await this.verifyMentorshipAccess(mentorshipId, userId, userRole);

    if (dto.linkedSkillId) {
      const skill = await this.prisma.skill.findUnique({
        where: { id: dto.linkedSkillId },
      });
      if (!skill) {
        throw new BadRequestException('Linked skill not found.');
      }
    }

    if (dto.linkedLearningPathId) {
      const path = await this.prisma.learningPath.findUnique({
        where: { id: dto.linkedLearningPathId },
      });
      if (!path) {
        throw new BadRequestException('Linked learning path not found.');
      }
    }

    return this.prisma.mentorshipGoal.create({
      data: {
        mentorshipId,
        title: dto.title,
        description: dto.description,
        targetDate: dto.targetDate ? new Date(dto.targetDate) : undefined,
        linkedSkillId: dto.linkedSkillId,
        linkedLearningPathId: dto.linkedLearningPathId,
        status: MentorshipGoalStatus.PENDING,
      },
      include: {
        linkedSkill: true,
        linkedLearningPath: true,
      },
    });
  }

  /**
   * Update goal details or progress status
   */
  async updateGoal(
    userId: string,
    userRole: UserRole,
    goalId: string,
    dto: UpdateMentorshipGoalDto,
  ) {
    const goal = await this.prisma.mentorshipGoal.findUnique({
      where: { id: goalId },
      include: { mentorship: true },
    });

    if (!goal) {
      throw new NotFoundException('Mentorship goal not found.');
    }

    await this.verifyMentorshipAccess(goal.mentorshipId, userId, userRole);

    const updateData: any = {};
    if (dto.title !== undefined) updateData.title = dto.title;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.targetDate !== undefined) {
      updateData.targetDate = dto.targetDate ? new Date(dto.targetDate) : null;
    }
    if (dto.linkedSkillId !== undefined) updateData.linkedSkillId = dto.linkedSkillId;
    if (dto.linkedLearningPathId !== undefined) {
      updateData.linkedLearningPathId = dto.linkedLearningPathId;
    }

    if (dto.status !== undefined) {
      updateData.status = dto.status;
      if (dto.status === MentorshipGoalStatus.ACHIEVED && !goal.completedAt) {
        updateData.completedAt = new Date();
      }
    }

    return this.prisma.mentorshipGoal.update({
      where: { id: goalId },
      data: updateData,
      include: {
        linkedSkill: true,
        linkedLearningPath: true,
      },
    });
  }

  /**
   * List goals for a mentorship
   */
  async getMentorshipGoals(
    userId: string,
    userRole: UserRole,
    mentorshipId: string,
  ) {
    await this.verifyMentorshipAccess(mentorshipId, userId, userRole);

    return this.prisma.mentorshipGoal.findMany({
      where: { mentorshipId },
      orderBy: { createdAt: 'asc' },
      include: {
        linkedSkill: true,
        linkedLearningPath: true,
      },
    });
  }

  /**
   * Delete a goal
   */
  async deleteGoal(userId: string, userRole: UserRole, goalId: string) {
    const goal = await this.prisma.mentorshipGoal.findUnique({
      where: { id: goalId },
    });

    if (!goal) {
      throw new NotFoundException('Mentorship goal not found.');
    }

    await this.verifyMentorshipAccess(goal.mentorshipId, userId, userRole);

    await this.prisma.mentorshipGoal.delete({
      where: { id: goalId },
    });

    return { success: true, message: 'Mentorship goal deleted.' };
  }
}

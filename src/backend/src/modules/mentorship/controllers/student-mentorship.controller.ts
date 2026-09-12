import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';
import { MentorshipRequestsService } from '../services/mentorship-requests.service';
import { MentorshipGoalsService } from '../services/mentorship-goals.service';
import { CreateMentorshipRequestDto } from '../dto/create-mentorship-request.dto';
import { CreateMentorshipGoalDto } from '../dto/create-mentorship-goal.dto';
import { UpdateMentorshipGoalDto } from '../dto/update-mentorship-goal.dto';

@Controller('student/mentorship')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.STUDENT, UserRole.SUPER_ADMIN)
export class StudentMentorshipController {
  constructor(
    private readonly requestsService: MentorshipRequestsService,
    private readonly goalsService: MentorshipGoalsService,
  ) {}

  @Post('mentors/:id/request')
  async createRequest(
    @CurrentUser('id') userId: string,
    @Param('id') mentorProfileId: string,
    @Body() dto: CreateMentorshipRequestDto,
  ) {
    const data = await this.requestsService.createRequest(
      userId,
      mentorProfileId,
      dto,
    );
    return { success: true, data };
  }

  @Get('requests')
  async getMyRequests(@CurrentUser('id') userId: string) {
    const data = await this.requestsService.getStudentRequests(userId);
    return { success: true, data };
  }

  @Post('requests/:id/withdraw')
  async withdrawRequest(
    @CurrentUser('id') userId: string,
    @Param('id') requestId: string,
  ) {
    const data = await this.requestsService.withdrawRequest(userId, requestId);
    return { success: true, data };
  }

  @Get('mentorships')
  async getMyMentorships(@CurrentUser('id') userId: string) {
    const data = await this.requestsService.getStudentMentorships(userId);
    return { success: true, data };
  }

  @Post('mentorships/:id/complete')
  async completeMentorship(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: UserRole,
    @Param('id') mentorshipId: string,
    @Body('notes') notes?: string,
  ) {
    const data = await this.requestsService.completeMentorship(
      userId,
      role,
      mentorshipId,
      notes,
    );
    return { success: true, data };
  }

  // ── Goals ──
  @Get('mentorships/:id/goals')
  async getGoals(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: UserRole,
    @Param('id') mentorshipId: string,
  ) {
    const data = await this.goalsService.getMentorshipGoals(
      userId,
      role,
      mentorshipId,
    );
    return { success: true, data };
  }

  @Post('mentorships/:id/goals')
  async createGoal(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: UserRole,
    @Param('id') mentorshipId: string,
    @Body() dto: CreateMentorshipGoalDto,
  ) {
    const data = await this.goalsService.createGoal(
      userId,
      role,
      mentorshipId,
      dto,
    );
    return { success: true, data };
  }

  @Patch('goals/:goalId')
  async updateGoal(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: UserRole,
    @Param('goalId') goalId: string,
    @Body() dto: UpdateMentorshipGoalDto,
  ) {
    const data = await this.goalsService.updateGoal(userId, role, goalId, dto);
    return { success: true, data };
  }

  @Delete('goals/:goalId')
  async deleteGoal(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: UserRole,
    @Param('goalId') goalId: string,
  ) {
    const data = await this.goalsService.deleteGoal(userId, role, goalId);
    return { success: true, data };
  }
}

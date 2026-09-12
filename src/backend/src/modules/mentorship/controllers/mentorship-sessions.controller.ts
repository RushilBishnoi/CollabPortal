import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';
import { MentorshipSessionsService } from '../services/mentorship-sessions.service';
import { BookSessionDto } from '../dto/book-session.dto';
import { UpdateSessionDto } from '../dto/update-session.dto';
import { SubmitSessionFeedbackDto } from '../dto/submit-session-feedback.dto';
import { QuerySessionsDto } from '../dto/query-sessions.dto';

@Controller('mentorship/sessions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MentorshipSessionsController {
  constructor(private readonly sessionsService: MentorshipSessionsService) {}

  @Post('mentors/:id/book')
  @Roles(UserRole.STUDENT, UserRole.SUPER_ADMIN)
  async bookSession(
    @CurrentUser('id') userId: string,
    @Param('id') mentorProfileId: string,
    @Body() dto: BookSessionDto,
  ) {
    const data = await this.sessionsService.bookSession(
      userId,
      mentorProfileId,
      dto,
    );
    return { success: true, data };
  }

  @Get('student')
  @Roles(UserRole.STUDENT, UserRole.SUPER_ADMIN)
  async getStudentSessions(
    @CurrentUser('id') userId: string,
    @Query() query: QuerySessionsDto,
  ) {
    const result = await this.sessionsService.getStudentSessions(userId, query);
    return {
      success: true,
      data: result.items,
      meta: result.meta,
    };
  }

  @Get('mentor')
  @Roles(UserRole.INDUSTRY, UserRole.FACULTY, UserRole.SUPER_ADMIN)
  async getMentorSessions(
    @CurrentUser('id') userId: string,
    @Query() query: QuerySessionsDto,
  ) {
    const result = await this.sessionsService.getMentorSessions(userId, query);
    return {
      success: true,
      data: result.items,
      meta: result.meta,
    };
  }

  @Get(':id')
  async getSessionById(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: UserRole,
    @Param('id') sessionId: string,
  ) {
    const data = await this.sessionsService.getSessionById(
      userId,
      role,
      sessionId,
    );
    return { success: true, data };
  }

  @Patch(':id')
  async updateSession(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: UserRole,
    @Param('id') sessionId: string,
    @Body() dto: UpdateSessionDto,
  ) {
    const data = await this.sessionsService.updateSession(
      userId,
      role,
      sessionId,
      dto,
    );
    return { success: true, data };
  }

  @Post(':id/feedback')
  async submitFeedback(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: UserRole,
    @Param('id') sessionId: string,
    @Body() dto: SubmitSessionFeedbackDto,
  ) {
    const data = await this.sessionsService.submitFeedback(
      userId,
      role,
      sessionId,
      dto,
    );
    return { success: true, data };
  }
}

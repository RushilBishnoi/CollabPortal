import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { AssessmentsService } from '../services/assessments.service';
import { SaveAnswerDto } from '../dto/save-answer.dto';

@ApiTags('Assessments - Skill Verification Engine')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('assessments')
export class AssessmentsController {
  constructor(private readonly assessmentsService: AssessmentsService) {}

  @Get()
  @ApiOperation({ summary: 'List all active skill assessments' })
  @ApiQuery({ name: 'skillId', required: false, description: 'Filter assessments by canonical skill ID' })
  @ApiResponse({ status: 200, description: 'Assessments retrieved successfully' })
  async listAssessments(@Query('skillId') skillId?: string) {
    return this.assessmentsService.listAssessments(skillId);
  }

  @Roles(UserRole.STUDENT)
  @Get('student/my-attempts')
  @ApiOperation({ summary: 'List past assessment attempts for authenticated student' })
  @ApiResponse({ status: 200, description: 'Past attempts retrieved' })
  async getMyAttempts(@CurrentUser('id') userId: string) {
    return this.assessmentsService.getMyAttempts(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get assessment details by ID' })
  @ApiResponse({ status: 200, description: 'Assessment details retrieved' })
  @ApiResponse({ status: 404, description: 'Assessment not found' })
  async getAssessmentById(@Param('id') id: string) {
    return this.assessmentsService.getAssessmentById(id);
  }

  @Roles(UserRole.STUDENT)
  @Post(':id/start')
  @ApiOperation({ summary: 'Start a new timed assessment attempt' })
  @ApiResponse({ status: 201, description: 'Assessment attempt initialized with sanitized questions' })
  async startAttempt(
    @CurrentUser('id') userId: string,
    @Param('id') assessmentId: string,
  ) {
    return this.assessmentsService.startAttempt(userId, assessmentId);
  }

  @Roles(UserRole.STUDENT)
  @Post('attempts/:attemptId/answer')
  @ApiOperation({ summary: 'Record candidate answer during an active attempt' })
  @ApiResponse({ status: 200, description: 'Answer recorded successfully' })
  async saveAnswer(
    @CurrentUser('id') userId: string,
    @Param('attemptId') attemptId: string,
    @Body() dto: SaveAnswerDto,
  ) {
    return this.assessmentsService.saveAnswer(userId, attemptId, dto);
  }

  @Roles(UserRole.STUDENT)
  @Post('attempts/:attemptId/submit')
  @ApiOperation({ summary: 'Submit attempt, grade deterministically, and auto-promote verified skill' })
  @ApiResponse({ status: 200, description: 'Attempt submitted and graded' })
  async submitAttempt(
    @CurrentUser('id') userId: string,
    @Param('attemptId') attemptId: string,
  ) {
    return this.assessmentsService.submitAttempt(userId, attemptId);
  }

  @Roles(UserRole.STUDENT)
  @Get('attempts/:attemptId/result')
  @ApiOperation({ summary: 'Get graded assessment result and educational review' })
  @ApiResponse({ status: 200, description: 'Assessment result retrieved' })
  async getAttemptResult(
    @CurrentUser('id') userId: string,
    @Param('attemptId') attemptId: string,
  ) {
    return this.assessmentsService.getAttemptResult(userId, attemptId);
  }
}

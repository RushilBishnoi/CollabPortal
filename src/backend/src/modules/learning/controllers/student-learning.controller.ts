import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { StudentLearningService } from '../services/student-learning.service';
import { LearningRemediationService } from '../services/learning-remediation.service';
import { UpdateResourceProgressDto } from '../dto/update-resource-progress.dto';
import { EnrollLearningPathDto } from '../dto/enroll-learning-path.dto';

@ApiTags('Student Learning')
@Controller('learning/student')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.STUDENT)
export class StudentLearningController {
  constructor(
    private readonly studentLearningService: StudentLearningService,
    private readonly remediationService: LearningRemediationService,
  ) {}

  @Get('my-learning')
  @ApiOperation({ summary: 'Get personalized learning dashboard overview with active paths and resource progress' })
  @ApiResponse({ status: 200, description: 'Student learning dashboard retrieved' })
  async getMyLearning(@CurrentUser('id') userId: string) {
    return this.studentLearningService.getMyLearningOverview(userId);
  }

  @Post('paths/:pathId/enroll')
  @ApiOperation({ summary: 'Enroll in a structured learning path' })
  @ApiResponse({ status: 201, description: 'Enrolled in learning path successfully' })
  async enroll(
    @CurrentUser('id') userId: string,
    @Param('pathId') pathId: string,
    @Body() dto: EnrollLearningPathDto,
  ) {
    return this.studentLearningService.enrollInPath(userId, pathId, dto);
  }

  @Post('resources/:resourceId/progress')
  @ApiOperation({ summary: 'Update study progress / complete a learning resource' })
  @ApiResponse({ status: 200, description: 'Progress updated and path recalculation executed' })
  async updateProgress(
    @CurrentUser('id') userId: string,
    @Param('resourceId') resourceId: string,
    @Body() dto: UpdateResourceProgressDto,
  ) {
    return this.studentLearningService.updateResourceProgress(userId, resourceId, dto);
  }

  @Get('remediation/career-role/:roleIdOrSlug')
  @ApiOperation({ summary: 'Get deterministic learning remediation plan for specific Career Role skill gaps' })
  @ApiResponse({ status: 200, description: 'Skill-gap remediation plan retrieved' })
  async getRemediationForCareerRole(
    @CurrentUser('id') userId: string,
    @Param('roleIdOrSlug') roleIdOrSlug: string,
  ) {
    return this.remediationService.getRemediationForCareerRole(userId, roleIdOrSlug);
  }

  @Get('remediation/overview')
  @ApiOperation({ summary: 'Get overall skill-gap remediation recommendations across student target roles' })
  @ApiResponse({ status: 200, description: 'Remediation overview retrieved' })
  async getGeneralRemediation(@CurrentUser('id') userId: string) {
    return this.remediationService.getStudentGeneralRemediation(userId);
  }
}

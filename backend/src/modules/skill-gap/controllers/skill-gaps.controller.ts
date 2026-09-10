import {
  Controller,
  Get,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { SkillGapService } from '../services/skill-gap.service';

@ApiTags('Skill Gap Analysis')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.STUDENT)
@Controller('skill-gaps')
export class SkillGapsController {
  constructor(private readonly skillGapService: SkillGapService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get authenticated student skill readiness overview and gap summary' })
  @ApiResponse({ status: 200, description: 'Student readiness overview retrieved successfully' })
  async getMyReadinessOverview(@CurrentUser('id') userId: string) {
    return this.skillGapService.getStudentReadinessOverview(userId);
  }

  @Get('me/role/:roleIdOrSlug')
  @ApiOperation({ summary: 'Get deep-dive skill gap analysis for a specific career role' })
  @ApiResponse({ status: 200, description: 'Role skill gap analysis retrieved' })
  @ApiResponse({ status: 404, description: 'Career role not found' })
  async getRoleSkillGap(
    @CurrentUser('id') userId: string,
    @Param('roleIdOrSlug') roleIdOrSlug: string,
  ) {
    return this.skillGapService.getRoleSkillGap(userId, roleIdOrSlug);
  }
}

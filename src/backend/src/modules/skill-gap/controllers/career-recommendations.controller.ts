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

@ApiTags('Career Recommendations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.STUDENT)
@Controller('career-recommendations')
export class CareerRecommendationsController {
  constructor(private readonly skillGapService: SkillGapService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get ranked career recommendations with explainable compatibility scores' })
  @ApiResponse({ status: 200, description: 'Career recommendations retrieved successfully' })
  async getMyRecommendations(@CurrentUser('id') userId: string) {
    return this.skillGapService.getRecommendedRoles(userId);
  }

  @Get('me/:roleIdOrSlug')
  @ApiOperation({ summary: 'Get single career recommendation with itemized 5-factor breakdown' })
  @ApiResponse({ status: 200, description: 'Career recommendation breakdown retrieved' })
  @ApiResponse({ status: 404, description: 'Career role not found' })
  async getSingleRecommendation(
    @CurrentUser('id') userId: string,
    @Param('roleIdOrSlug') roleIdOrSlug: string,
  ) {
    return this.skillGapService.getRoleSkillGap(userId, roleIdOrSlug);
  }
}

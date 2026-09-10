import {
  Controller,
  Get,
  Query,
  UseGuards,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { RateLimit } from '../../../common/decorators/rate-limit.decorator';
import { AnalyticsService } from '../services/analytics.service';
import { AnalyticsQueryDto } from '../dto/analytics-query.dto';

@ApiTags('Institutional & Placement Analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('institution/overview')
  @Roles(UserRole.INSTITUTION_ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Institution Admin: Get comprehensive institutional & placement analytics' })
  @ApiResponse({ status: 200, description: 'Institutional analytics retrieved' })
  async getInstitutionOverview(
    @CurrentUser('id') userId: string,
    @Query() query: AnalyticsQueryDto,
  ) {
    return this.analyticsService.getInstitutionOverview(userId, query);
  }

  @Get('collaborations')
  @Roles(UserRole.INSTITUTION_ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Institution Admin / Super Admin: Get collaboration and engagement metrics' })
  @ApiResponse({ status: 200, description: 'Collaboration analytics retrieved' })
  async getCollaborationAnalytics(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: UserRole,
    @Query() query: AnalyticsQueryDto,
  ) {
    return this.analyticsService.getCollaborationAnalytics(userId, userRole, query);
  }

  @Get('platform/overview')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Super Admin: Get global platform-wide analytics overview' })
  @ApiResponse({ status: 200, description: 'Global analytics retrieved' })
  async getPlatformOverview(@Query() query: AnalyticsQueryDto) {
    return this.analyticsService.getPlatformOverview(query);
  }

  @Get('learning')
  @Roles(UserRole.INSTITUTION_ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Institution Admin / Super Admin: Get learning progress & skill remediation analytics' })
  @ApiResponse({ status: 200, description: 'Learning analytics retrieved' })
  async getLearningAnalytics(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: UserRole,
    @Query() query: AnalyticsQueryDto,
  ) {
    return this.analyticsService.getLearningAnalytics(userId, userRole, query);
  }

  @Get('placements')
  @Roles(UserRole.INSTITUTION_ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Institution Admin / Super Admin: Get post-selection placement and offer analytics' })
  @ApiResponse({ status: 200, description: 'Placement analytics retrieved' })
  async getPlacementAnalytics(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: UserRole,
    @Query() query: AnalyticsQueryDto,
  ) {
    return this.analyticsService.getPlacementAnalytics(userId, userRole, query);
  }

  @Get('mentorship')
  @Roles(UserRole.INSTITUTION_ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Institution Admin / Super Admin: Get mentorship and mentor engagement analytics' })
  @ApiResponse({ status: 200, description: 'Mentorship analytics retrieved' })
  async getMentorshipAnalytics(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: UserRole,
    @Query() query: AnalyticsQueryDto,
  ) {
    return this.analyticsService.getMentorshipAnalytics(userId, userRole, query);
  }

  @Get('notifications')
  @Roles(UserRole.INSTITUTION_ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Institution Admin / Super Admin: Get notification delivery and read engagement analytics' })
  @ApiResponse({ status: 200, description: 'Notification analytics retrieved' })
  async getNotificationAnalytics(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: UserRole,
    @Query() query: AnalyticsQueryDto,
  ) {
    return this.analyticsService.getNotificationAnalytics(userId, userRole, query);
  }

  @Get('institution/export')
  @Roles(UserRole.INSTITUTION_ADMIN, UserRole.SUPER_ADMIN)
  @RateLimit({ points: 5, durationSeconds: 60, errorMessage: 'Export rate limit exceeded. Please wait 1 minute.' })
  @ApiOperation({ summary: 'Institution Admin: Export analytics data as downloadable CSV report' })
  async exportReport(
    @CurrentUser('id') userId: string,
    @Query('type') type: string = 'departments',
    @Res() res: Response,
  ) {
    // Sanitize type parameter against CRLF, path traversal, and header injection
    const sanitizedType = (type || 'departments').replace(/[^a-zA-Z0-9_-]/g, '');
    const safeType = sanitizedType || 'departments';

    const csvData = await this.analyticsService.exportInstitutionReport(userId, safeType);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="institutional_report_${safeType}.csv"`);
    res.send(csvData);
  }
}

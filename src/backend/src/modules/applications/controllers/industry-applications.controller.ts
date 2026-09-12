import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
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
import { ApplicationsService } from '../services/applications.service';
import { InterviewsService } from '../services/interviews.service';
import { ApplicationDocumentsService } from '../services/application-documents.service';
import { UpdateApplicationStatusDto } from '../dto/update-application-status.dto';
import { ScheduleInterviewDto } from '../dto/schedule-interview.dto';
import { UpdateInterviewDto } from '../dto/update-interview.dto';
import { ApplicationQueryDto } from '../dto/application-query.dto';

@ApiTags('Applications - Recruiter Pipeline')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.INDUSTRY, UserRole.SUPER_ADMIN)
@Controller('industry/applications')
export class IndustryApplicationsController {
  constructor(
    private readonly applicationsService: ApplicationsService,
    private readonly interviewsService: InterviewsService,
    private readonly documentsService: ApplicationDocumentsService,
  ) {}

  @Get('opportunity/:opportunityId')
  @ApiOperation({ summary: 'Recruiter: List all candidate applications for an owned opportunity' })
  @ApiResponse({ status: 200, description: 'Applications list retrieved' })
  @ApiResponse({ status: 403, description: 'Forbidden - not authorized for this opportunity' })
  async findApplicationsForOpportunity(
    @CurrentUser('id') userId: string,
    @Param('opportunityId') opportunityId: string,
    @Query() query: ApplicationQueryDto,
  ) {
    return this.applicationsService.findRecruiterApplications(userId, opportunityId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Recruiter: Deep candidate review view' })
  @ApiResponse({ status: 200, description: 'Candidate review data retrieved' })
  @ApiResponse({ status: 404, description: 'Application not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async findCandidateReview(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.applicationsService.findRecruiterApplicationById(userId, id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Recruiter: Transition candidate recruitment status' })
  @ApiResponse({ status: 200, description: 'Status updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid state transition' })
  async updateStatus(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateApplicationStatusDto,
  ) {
    return this.applicationsService.updateRecruiterStatus(userId, id, dto);
  }

  @Post(':id/interviews')
  @ApiOperation({ summary: 'Recruiter: Schedule an interview round for candidate' })
  @ApiResponse({ status: 201, description: 'Interview scheduled' })
  async scheduleInterview(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: ScheduleInterviewDto,
  ) {
    return this.interviewsService.scheduleInterview(userId, id, dto);
  }

  @Patch(':id/interviews/:interviewId')
  @ApiOperation({ summary: 'Recruiter: Update interview status, feedback, or rating' })
  @ApiResponse({ status: 200, description: 'Interview updated' })
  async updateInterview(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Param('interviewId') interviewId: string,
    @Body() dto: UpdateInterviewDto,
  ) {
    return this.interviewsService.updateInterview(userId, id, interviewId, dto);
  }

  @Get(':id/documents/:docId/download')
  @ApiOperation({ summary: 'Recruiter: Download candidate application document' })
  async downloadCandidateDocument(
    @CurrentUser('id') userId: string,
    @Param('docId') docId: string,
    @Res() res: Response,
  ) {
    const fileData = await this.documentsService.getAuthorizedDocument(
      docId,
      userId,
      UserRole.INDUSTRY,
    );

    res.setHeader('Content-Type', fileData.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${fileData.originalFilename}"`);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.sendFile(fileData.filePath);
  }
}

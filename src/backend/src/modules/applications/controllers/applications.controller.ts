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
import { ApplicationDocumentsService } from '../services/application-documents.service';
import { CreateApplicationDto } from '../dto/create-application.dto';
import { ApplicationQueryDto } from '../dto/application-query.dto';

@ApiTags('Applications - Student Portal')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.STUDENT)
@Controller('applications')
export class ApplicationsController {
  constructor(
    private readonly applicationsService: ApplicationsService,
    private readonly documentsService: ApplicationDocumentsService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Student: Submit an application to a published opportunity' })
  @ApiResponse({ status: 201, description: 'Application submitted successfully' })
  @ApiResponse({ status: 403, description: 'Ineligible for opportunity' })
  @ApiResponse({ status: 409, description: 'Duplicate application' })
  async apply(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateApplicationDto,
  ) {
    return this.applicationsService.apply(userId, dto);
  }

  @Get('me')
  @ApiOperation({ summary: 'Student: List all submitted applications' })
  @ApiResponse({ status: 200, description: 'Applications list retrieved' })
  async findMyApplications(
    @CurrentUser('id') userId: string,
    @Query() query: ApplicationQueryDto,
  ) {
    return this.applicationsService.findStudentApplications(userId, query);
  }

  @Get('me/:id')
  @ApiOperation({ summary: 'Student: Get application details and status timeline' })
  @ApiResponse({ status: 200, description: 'Application details retrieved' })
  @ApiResponse({ status: 404, description: 'Application not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async findMyApplicationById(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.applicationsService.findStudentApplicationById(userId, id);
  }

  @Patch('me/:id/withdraw')
  @ApiOperation({ summary: 'Student: Withdraw application before final decision' })
  @ApiResponse({ status: 200, description: 'Application withdrawn' })
  @ApiResponse({ status: 400, description: 'Invalid state transition' })
  async withdraw(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.applicationsService.withdraw(userId, id);
  }

  @Get('me/:id/documents/:docId/download')
  @ApiOperation({ summary: 'Student: Download uploaded document' })
  async downloadDocument(
    @CurrentUser('id') userId: string,
    @Param('docId') docId: string,
    @Res() res: Response,
  ) {
    const fileData = await this.documentsService.getAuthorizedDocument(
      docId,
      userId,
      UserRole.STUDENT,
    );

    res.setHeader('Content-Type', fileData.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${fileData.originalFilename}"`);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.sendFile(fileData.filePath);
  }
}

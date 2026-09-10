import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Inject,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UserRole, CollaborationAudience } from '@prisma/client';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { CollaborationsService } from '../services/collaborations.service';
import { ParticipationService } from '../services/participation.service';
import { CollaborationQueryDto } from '../dto/collaboration-query.dto';
import { CreateParticipationDto } from '../dto/create-participation.dto';
import { ParticipationQueryDto } from '../dto/participation-query.dto';

@ApiTags('Student - Collaborations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.STUDENT)
@Controller('student/collaborations')
export class StudentCollaborationsController {
  constructor(
    @Inject(CollaborationsService) private readonly collaborationsService: CollaborationsService,
    @Inject(ParticipationService) private readonly participationService: ParticipationService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Browse collaborations eligible for students' })
  @ApiResponse({ status: 200, description: 'Student-eligible collaborations retrieved' })
  async getStudentCollaborations(@Query() query: CollaborationQueryDto) {
    query.targetAudience = CollaborationAudience.STUDENT;
    return this.collaborationsService.findAll(query, true);
  }

  @Get('my-participations')
  @ApiOperation({ summary: 'List all collaboration participation requests made by authenticated student' })
  @ApiResponse({ status: 200, description: 'My participations retrieved' })
  async getMyParticipations(
    @CurrentUser('id') userId: string,
    @Query() query: ParticipationQueryDto,
  ) {
    return this.participationService.getMyStudentParticipations(userId, query);
  }

  @Get('my-participations/:id')
  @ApiOperation({ summary: 'Get single participation details for authenticated student' })
  @ApiResponse({ status: 200, description: 'Participation detail retrieved' })
  @ApiResponse({ status: 403, description: 'Forbidden - IDOR protection' })
  @ApiResponse({ status: 404, description: 'Participation not found' })
  async getMyParticipationById(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.participationService.getMyParticipationById(userId, id, UserRole.STUDENT);
  }

  @Post(':collaborationId/participate')
  @ApiOperation({ summary: 'Submit participation request for a collaboration' })
  @ApiResponse({ status: 201, description: 'Participation request submitted' })
  @ApiResponse({ status: 400, description: 'Collaboration not open or department ineligible' })
  @ApiResponse({ status: 409, description: 'Duplicate participation request' })
  async requestParticipation(
    @CurrentUser('id') userId: string,
    @Param('collaborationId') collaborationId: string,
    @Body() dto: CreateParticipationDto,
  ) {
    return this.participationService.requestStudentParticipation(userId, collaborationId, dto);
  }

  @Patch('my-participations/:id/withdraw')
  @ApiOperation({ summary: 'Withdraw active participation request' })
  @ApiResponse({ status: 200, description: 'Participation withdrawn successfully' })
  @ApiResponse({ status: 400, description: 'Invalid transition' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async withdrawParticipation(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.participationService.withdrawParticipation(userId, id, UserRole.STUDENT);
  }
}

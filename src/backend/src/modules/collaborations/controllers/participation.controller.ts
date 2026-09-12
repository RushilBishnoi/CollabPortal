import {
  Controller,
  Get,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Inject,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { ParticipationService } from '../services/participation.service';
import { ParticipationQueryDto } from '../dto/participation-query.dto';
import { UpdateParticipationStatusDto } from '../dto/update-participation-status.dto';

@ApiTags('Collaborations - Participant Management')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.INDUSTRY, UserRole.SUPER_ADMIN)
@Controller('collaborations/:collaborationId/participations')
export class ParticipationController {
  constructor(@Inject(ParticipationService) private readonly participationService: ParticipationService) {}

  @Get()
  @ApiOperation({ summary: 'List all participants for a specific collaboration' })
  @ApiResponse({ status: 200, description: 'Participants list retrieved' })
  @ApiResponse({ status: 403, description: 'Forbidden - not authorized' })
  @ApiResponse({ status: 404, description: 'Collaboration not found' })
  async getCollaborationParticipations(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: UserRole,
    @Param('collaborationId') collaborationId: string,
    @Query() query: ParticipationQueryDto,
  ) {
    return this.participationService.getCollaborationParticipations(
      userId,
      collaborationId,
      query,
      userRole,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get details of a specific participation request' })
  @ApiResponse({ status: 200, description: 'Participant details retrieved' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Record not found' })
  async getCollaborationParticipationById(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: UserRole,
    @Param('collaborationId') collaborationId: string,
    @Param('id') participationId: string,
  ) {
    return this.participationService.getCollaborationParticipationById(
      userId,
      collaborationId,
      participationId,
      userRole,
    );
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Approve, reject, complete, or cancel a participant' })
  @ApiResponse({ status: 200, description: 'Participation status updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid transition or capacity reached' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Record not found' })
  async updateParticipationStatus(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: UserRole,
    @Param('collaborationId') collaborationId: string,
    @Param('id') participationId: string,
    @Body() dto: UpdateParticipationStatusDto,
  ) {
    return this.participationService.updateParticipationStatus(
      userId,
      collaborationId,
      participationId,
      dto,
      userRole,
    );
  }
}

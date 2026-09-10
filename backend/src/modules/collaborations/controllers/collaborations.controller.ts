import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
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
import { Public } from '../../../common/decorators/public.decorator';
import { CollaborationsService } from '../services/collaborations.service';
import { CreateCollaborationDto } from '../dto/create-collaboration.dto';
import { UpdateCollaborationDto } from '../dto/update-collaboration.dto';
import { CollaborationQueryDto } from '../dto/collaboration-query.dto';
import { UpdateCollaborationStatusDto } from '../dto/update-collaboration-status.dto';

@ApiTags('Collaborations')
@Controller('collaborations')
export class CollaborationsController {
  constructor(@Inject(CollaborationsService) private readonly collaborationsService: CollaborationsService) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.INDUSTRY, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a new collaboration engagement (Industry / Super Admin)' })
  @ApiResponse({ status: 201, description: 'Collaboration created successfully' })
  async create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateCollaborationDto,
  ) {
    return this.collaborationsService.create(userId, dto);
  }

  @Get()
  @Public()
  @ApiOperation({ summary: 'Browse collaborations marketplace (default: OPEN status)' })
  @ApiResponse({ status: 200, description: 'Collaborations list retrieved' })
  async findAll(@Query() query: CollaborationQueryDto) {
    return this.collaborationsService.findAll(query, true);
  }

  @Get('my')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.INDUSTRY)
  @ApiOperation({ summary: 'List all collaborations created by the authenticated industry recruiter' })
  @ApiResponse({ status: 200, description: 'Industry collaborations retrieved' })
  async findMyCollaborations(@CurrentUser('id') userId: string) {
    return this.collaborationsService.findMyCollaborations(userId);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get collaboration details by ID' })
  @ApiResponse({ status: 200, description: 'Collaboration details retrieved' })
  @ApiResponse({ status: 404, description: 'Collaboration not found' })
  async findById(@Param('id') id: string) {
    return this.collaborationsService.findById(id);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.INDUSTRY, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update collaboration details' })
  @ApiResponse({ status: 200, description: 'Collaboration updated' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Collaboration not found' })
  async update(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: UserRole,
    @Param('id') id: string,
    @Body() dto: UpdateCollaborationDto,
  ) {
    return this.collaborationsService.update(userId, id, dto, userRole);
  }

  @Patch(':id/status')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.INDUSTRY, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update collaboration lifecycle status' })
  @ApiResponse({ status: 200, description: 'Status updated' })
  @ApiResponse({ status: 400, description: 'Invalid transition' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Collaboration not found' })
  async updateStatus(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: UserRole,
    @Param('id') id: string,
    @Body() dto: UpdateCollaborationStatusDto,
  ) {
    return this.collaborationsService.updateStatus(userId, id, dto, userRole);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.INDUSTRY, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete a draft or cancelled collaboration' })
  @ApiResponse({ status: 200, description: 'Collaboration deleted' })
  @ApiResponse({ status: 400, description: 'Cannot delete active collaboration' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async delete(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: UserRole,
    @Param('id') id: string,
  ) {
    return this.collaborationsService.delete(userId, id, userRole);
  }
}

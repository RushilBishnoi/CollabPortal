import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Inject,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { OpportunitiesService } from '../services/opportunities.service';
import { CreateOpportunityDto } from '../dto/create-opportunity.dto';
import { UpdateOpportunityDto } from '../dto/update-opportunity.dto';
import { AddOpportunitySkillDto } from '../dto/add-opportunity-skill.dto';
import { UpdateOpportunityStatusDto } from '../dto/update-opportunity-status.dto';

@ApiTags('Industry - Opportunity Authoring')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.INDUSTRY)
@Controller('industry/opportunities')
export class IndustryOpportunitiesController {
  constructor(@Inject(OpportunitiesService) private readonly opportunitiesService: OpportunitiesService) {}

  @Get('me')
  @ApiOperation({ summary: 'List all opportunities posted by authenticated recruiter' })
  @ApiResponse({ status: 200, description: 'Opportunities list retrieved' })
  async findMyOpportunities(@CurrentUser('id') userId: string) {
    return this.opportunitiesService.findMyOpportunities(userId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new opportunity posting' })
  @ApiResponse({ status: 201, description: 'Opportunity created successfully' })
  @ApiResponse({ status: 409, description: 'Slug conflict' })
  async create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateOpportunityDto,
  ) {
    return this.opportunitiesService.create(userId, dto);
  }

  @Get('me/:id')
  @ApiOperation({ summary: 'Get single opportunity by ID with management info' })
  @ApiResponse({ status: 200, description: 'Opportunity retrieved' })
  @ApiResponse({ status: 404, description: 'Opportunity not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - not authorized' })
  async findMyOpportunityById(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.opportunitiesService.findMyOpportunityById(userId, id);
  }

  @Put('me/:id')
  @ApiOperation({ summary: 'Update opportunity details' })
  @ApiResponse({ status: 200, description: 'Opportunity updated' })
  @ApiResponse({ status: 404, description: 'Opportunity not found' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async update(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateOpportunityDto,
  ) {
    return this.opportunitiesService.update(userId, id, dto);
  }

  @Patch('me/:id/status')
  @ApiOperation({ summary: 'Update posting status (DRAFT | PUBLISHED | CLOSED | ARCHIVED)' })
  @ApiResponse({ status: 200, description: 'Status updated' })
  @ApiResponse({ status: 404, description: 'Opportunity not found' })
  async updateStatus(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateOpportunityStatusDto,
  ) {
    return this.opportunitiesService.updateStatus(userId, id, dto);
  }

  @Post('me/:id/skills')
  @ApiOperation({ summary: 'Add or update required skill on opportunity' })
  @ApiResponse({ status: 201, description: 'Skill requirement added' })
  @ApiResponse({ status: 404, description: 'Opportunity or skill not found' })
  async addSkillRequirement(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: AddOpportunitySkillDto,
  ) {
    return this.opportunitiesService.addSkillRequirement(userId, id, dto);
  }

  @Delete('me/:id/skills/:skillId')
  @ApiOperation({ summary: 'Remove required skill from opportunity' })
  @ApiResponse({ status: 200, description: 'Skill requirement removed' })
  @ApiResponse({ status: 404, description: 'Requirement not found' })
  async removeSkillRequirement(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Param('skillId') skillId: string,
  ) {
    return this.opportunitiesService.removeSkillRequirement(userId, id, skillId);
  }
}

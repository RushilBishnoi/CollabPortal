import {
  Controller,
  Get,
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
import { OpportunitiesService } from '../services/opportunities.service';
import { OpportunityMatchingService } from '../services/opportunity-matching.service';
import { OpportunityQueryDto } from '../dto/opportunity-query.dto';

@ApiTags('Opportunities')
@Controller('opportunities')
export class OpportunitiesController {
  constructor(
    @Inject(OpportunitiesService) private readonly opportunitiesService: OpportunitiesService,
    @Inject(OpportunityMatchingService) private readonly matchingService: OpportunityMatchingService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Browse and filter published opportunities with pagination' })
  @ApiResponse({ status: 200, description: 'Opportunities list retrieved' })
  async findAll(@Query() query: OpportunityQueryDto) {
    return this.opportunitiesService.findAllPublished(query);
  }

  @Get('matched/me')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Get personalized opportunities ranked by compatibility score & eligibility' })
  @ApiResponse({ status: 200, description: 'Matched opportunities retrieved' })
  async getMatchedForMe(
    @CurrentUser('id') userId: string,
    @Query() query: OpportunityQueryDto,
  ) {
    return this.matchingService.getMatchedOpportunitiesForStudent(userId, query);
  }

  @Get(':idOrSlug/match-me')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Get deep-dive match score and eligibility checks for single opportunity' })
  @ApiResponse({ status: 200, description: 'Opportunity match score and eligibility details retrieved' })
  @ApiResponse({ status: 404, description: 'Opportunity not found' })
  async getSingleMatch(
    @CurrentUser('id') userId: string,
    @Param('idOrSlug') idOrSlug: string,
  ) {
    return this.matchingService.getSingleOpportunityMatch(userId, idOrSlug);
  }

  @Get(':idOrSlug')
  @ApiOperation({ summary: 'Get single opportunity by ID or slug' })
  @ApiResponse({ status: 200, description: 'Opportunity details retrieved' })
  @ApiResponse({ status: 404, description: 'Opportunity not found' })
  async findByIdOrSlug(@Param('idOrSlug') idOrSlug: string) {
    return this.opportunitiesService.findByIdOrSlug(idOrSlug);
  }
}

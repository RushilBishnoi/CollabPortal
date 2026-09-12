import { Controller, Get, Put, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { IndustryProfilesService } from '../services/industry-profiles.service';
import { UpdateIndustryProfileDto } from '../dto/update-industry-profile.dto';

@ApiTags('Profiles - Industry')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('profiles/industry')
export class IndustryProfilesController {
  constructor(private readonly industryProfilesService: IndustryProfilesService) {}

  @Roles(UserRole.INDUSTRY)
  @Get('me')
  @ApiOperation({ summary: 'Get authenticated industry profile' })
  @ApiResponse({ status: 200, description: 'Industry profile retrieved successfully' })
  async getMyProfile(@CurrentUser('id') userId: string) {
    return this.industryProfilesService.getMyProfile(userId);
  }

  @Roles(UserRole.INDUSTRY)
  @Put('me')
  @ApiOperation({ summary: 'Update authenticated industry profile' })
  @ApiResponse({ status: 200, description: 'Industry profile updated successfully' })
  async updateMyProfile(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateIndustryProfileDto,
  ) {
    return this.industryProfilesService.updateMyProfile(userId, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get industry profile by ID' })
  @ApiResponse({ status: 200, description: 'Industry profile retrieved' })
  async getIndustryProfileById(@Param('id') id: string) {
    return this.industryProfilesService.getIndustryProfileById(id);
  }
}

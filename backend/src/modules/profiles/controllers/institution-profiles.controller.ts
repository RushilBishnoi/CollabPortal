import { Controller, Get, Put, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { InstitutionProfilesService } from '../services/institution-profiles.service';
import { UpdateInstitutionProfileDto } from '../dto/update-institution-profile.dto';

@ApiTags('Profiles - Institution')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('profiles/institution')
export class InstitutionProfilesController {
  constructor(private readonly institutionProfilesService: InstitutionProfilesService) {}

  @Roles(UserRole.INSTITUTION_ADMIN)
  @Get('me')
  @ApiOperation({ summary: 'Get authenticated institution profile' })
  @ApiResponse({ status: 200, description: 'Institution profile retrieved successfully' })
  async getMyProfile(@CurrentUser('id') userId: string) {
    return this.institutionProfilesService.getMyProfile(userId);
  }

  @Roles(UserRole.INSTITUTION_ADMIN)
  @Put('me')
  @ApiOperation({ summary: 'Update authenticated institution profile' })
  @ApiResponse({ status: 200, description: 'Institution profile updated successfully' })
  async updateMyProfile(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateInstitutionProfileDto,
  ) {
    return this.institutionProfilesService.updateMyProfile(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all institutions (for dropdown selection)' })
  @ApiResponse({ status: 200, description: 'Institutions list retrieved' })
  async listInstitutions() {
    return this.institutionProfilesService.listInstitutions();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get institution profile by ID' })
  @ApiResponse({ status: 200, description: 'Institution profile retrieved' })
  async getInstitutionProfileById(@Param('id') id: string) {
    return this.institutionProfilesService.getInstitutionProfileById(id);
  }
}

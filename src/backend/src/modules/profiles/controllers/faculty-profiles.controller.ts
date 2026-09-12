import { Controller, Get, Put, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { FacultyProfilesService } from '../services/faculty-profiles.service';
import { UpdateFacultyProfileDto } from '../dto/update-faculty-profile.dto';

@ApiTags('Profiles - Faculty')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('profiles/faculty')
export class FacultyProfilesController {
  constructor(private readonly facultyProfilesService: FacultyProfilesService) {}

  @Roles(UserRole.FACULTY)
  @Get('me')
  @ApiOperation({ summary: 'Get authenticated faculty profile' })
  @ApiResponse({ status: 200, description: 'Faculty profile retrieved successfully' })
  async getMyProfile(@CurrentUser('id') userId: string) {
    return this.facultyProfilesService.getMyProfile(userId);
  }

  @Roles(UserRole.FACULTY)
  @Put('me')
  @ApiOperation({ summary: 'Update authenticated faculty profile' })
  @ApiResponse({ status: 200, description: 'Faculty profile updated successfully' })
  async updateMyProfile(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateFacultyProfileDto,
  ) {
    return this.facultyProfilesService.updateMyProfile(userId, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get faculty profile by ID' })
  @ApiResponse({ status: 200, description: 'Faculty profile retrieved' })
  async getFacultyProfileById(@Param('id') id: string) {
    return this.facultyProfilesService.getFacultyProfileById(id);
  }
}

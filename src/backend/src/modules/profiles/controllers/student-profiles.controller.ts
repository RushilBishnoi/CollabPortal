import {
  Controller,
  Get,
  Put,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { StudentProfilesService } from '../services/student-profiles.service';
import { UpdateStudentProfileDto } from '../dto/update-student-profile.dto';
import { CreateStudentProjectDto } from '../dto/create-student-project.dto';
import { CreateStudentCertificationDto } from '../dto/create-student-certification.dto';

@ApiTags('Profiles - Student')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('profiles/student')
export class StudentProfilesController {
  constructor(private readonly studentProfilesService: StudentProfilesService) {}

  @Roles(UserRole.STUDENT)
  @Get('me')
  @ApiOperation({ summary: 'Get authenticated student profile and completeness score' })
  @ApiResponse({ status: 200, description: 'Student profile retrieved successfully' })
  async getMyProfile(@CurrentUser('id') userId: string) {
    return this.studentProfilesService.getMyProfile(userId);
  }

  @Roles(UserRole.STUDENT)
  @Put('me')
  @ApiOperation({ summary: 'Update authenticated student profile' })
  @ApiResponse({ status: 200, description: 'Student profile updated successfully' })
  async updateMyProfile(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateStudentProfileDto,
  ) {
    return this.studentProfilesService.updateMyProfile(userId, dto);
  }

  @Roles(UserRole.STUDENT)
  @Post('me/projects')
  @ApiOperation({ summary: 'Add a new project to student profile' })
  @ApiResponse({ status: 201, description: 'Project added successfully' })
  async addProject(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateStudentProjectDto,
  ) {
    return this.studentProfilesService.addProject(userId, dto);
  }

  @Roles(UserRole.STUDENT)
  @Delete('me/projects/:id')
  @ApiOperation({ summary: 'Delete a project from student profile' })
  @ApiResponse({ status: 200, description: 'Project deleted successfully' })
  async deleteProject(
    @CurrentUser('id') userId: string,
    @Param('id') projectId: string,
  ) {
    return this.studentProfilesService.deleteProject(userId, projectId);
  }

  @Roles(UserRole.STUDENT)
  @Post('me/certifications')
  @ApiOperation({ summary: 'Add a new certification to student profile' })
  @ApiResponse({ status: 201, description: 'Certification added successfully' })
  async addCertification(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateStudentCertificationDto,
  ) {
    return this.studentProfilesService.addCertification(userId, dto);
  }

  @Roles(UserRole.STUDENT)
  @Delete('me/certifications/:id')
  @ApiOperation({ summary: 'Delete a certification from student profile' })
  @ApiResponse({ status: 200, description: 'Certification deleted successfully' })
  async deleteCertification(
    @CurrentUser('id') userId: string,
    @Param('id') certId: string,
  ) {
    return this.studentProfilesService.deleteCertification(userId, certId);
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.INSTITUTION_ADMIN, UserRole.INDUSTRY, UserRole.FACULTY)
  @Get(':id')
  @ApiOperation({ summary: 'Get public student profile by profile ID' })
  @ApiResponse({ status: 200, description: 'Student profile retrieved' })
  async getStudentProfileById(@Param('id') id: string) {
    return this.studentProfilesService.getStudentProfileById(id);
  }
}

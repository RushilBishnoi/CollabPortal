import {
  Controller,
  Get,
  Post,
  Put,
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
import { StudentSkillsService } from '../services/student-skills.service';
import { CreateStudentSkillDto } from '../dto/create-student-skill.dto';
import { UpdateStudentSkillDto } from '../dto/update-student-skill.dto';

@ApiTags('Skills - Student Skills')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.STUDENT)
@Controller('skills/student')
export class StudentSkillsController {
  constructor(private readonly studentSkillsService: StudentSkillsService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get all skills on authenticated student profile' })
  @ApiResponse({ status: 200, description: 'Student skills retrieved successfully' })
  async getMySkills(@CurrentUser('id') userId: string) {
    return this.studentSkillsService.getMySkills(userId);
  }

  @Post('me')
  @ApiOperation({ summary: 'Add a canonical skill with proficiency to student profile' })
  @ApiResponse({ status: 201, description: 'Skill added to student profile' })
  @ApiResponse({ status: 409, description: 'Skill is already added on profile' })
  @ApiResponse({ status: 404, description: 'Skill not found in taxonomy' })
  async addSkill(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateStudentSkillDto,
  ) {
    return this.studentSkillsService.addSkill(userId, dto);
  }

  @Put('me/:skillId')
  @ApiOperation({ summary: 'Update proficiency on an existing student skill' })
  @ApiResponse({ status: 200, description: 'Skill proficiency updated' })
  @ApiResponse({ status: 404, description: 'Skill not found on profile' })
  @ApiResponse({ status: 403, description: 'Forbidden - not authorized to modify this skill' })
  async updateSkillProficiency(
    @CurrentUser('id') userId: string,
    @Param('skillId') skillId: string,
    @Body() dto: UpdateStudentSkillDto,
  ) {
    return this.studentSkillsService.updateSkillProficiency(userId, skillId, dto);
  }

  @Delete('me/:skillId')
  @ApiOperation({ summary: 'Remove a skill from student profile' })
  @ApiResponse({ status: 200, description: 'Skill removed successfully' })
  @ApiResponse({ status: 404, description: 'Skill not found on profile' })
  @ApiResponse({ status: 403, description: 'Forbidden - not authorized to remove this skill' })
  async removeSkill(
    @CurrentUser('id') userId: string,
    @Param('skillId') skillId: string,
  ) {
    return this.studentSkillsService.removeSkill(userId, skillId);
  }
}

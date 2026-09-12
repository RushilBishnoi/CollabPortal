import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CareerRolesService } from '../services/career-roles.service';
import { CreateCareerRoleDto } from '../dto/create-career-role.dto';
import { UpdateCareerRoleDto } from '../dto/update-career-role.dto';
import { AddCareerRoleSkillDto } from '../dto/add-career-role-skill.dto';
import { CareerRoleQueryDto } from '../dto/career-role-query.dto';

@ApiTags('Career Roles')
@Controller('career-roles')
export class CareerRolesController {
  constructor(private readonly careerRolesService: CareerRolesService) {}

  @Get()
  @ApiOperation({ summary: 'List all active career roles with optional search and category filters' })
  @ApiResponse({ status: 200, description: 'Career roles retrieved successfully' })
  async findAll(@Query() query: CareerRoleQueryDto) {
    return this.careerRolesService.findAll(query);
  }

  @Get('categories')
  @ApiOperation({ summary: 'Get all distinct career role categories' })
  @ApiResponse({ status: 200, description: 'Categories retrieved successfully' })
  async getCategories() {
    return this.careerRolesService.getCategories();
  }

  @Get(':idOrSlug')
  @ApiOperation({ summary: 'Get career role by ID or slug with its required skills' })
  @ApiResponse({ status: 200, description: 'Career role details retrieved' })
  @ApiResponse({ status: 404, description: 'Career role not found' })
  async findByIdOrSlug(@Param('idOrSlug') idOrSlug: string) {
    return this.careerRolesService.findByIdOrSlug(idOrSlug);
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a new canonical career role (Admin only)' })
  @ApiResponse({ status: 201, description: 'Career role created successfully' })
  @ApiResponse({ status: 409, description: 'Slug conflict' })
  async create(@Body() dto: CreateCareerRoleDto) {
    return this.careerRolesService.create(dto);
  }

  @Put(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update a career role (Admin only)' })
  @ApiResponse({ status: 200, description: 'Career role updated successfully' })
  @ApiResponse({ status: 404, description: 'Career role not found' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateCareerRoleDto,
  ) {
    return this.careerRolesService.update(id, dto);
  }

  @Post(':id/skills')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Add or update required skill on career role (Admin only)' })
  @ApiResponse({ status: 201, description: 'Skill requirement added to career role' })
  @ApiResponse({ status: 404, description: 'Career role or skill not found' })
  async addSkillRequirement(
    @Param('id') id: string,
    @Body() dto: AddCareerRoleSkillDto,
  ) {
    return this.careerRolesService.addSkillRequirement(id, dto);
  }

  @Delete(':id/skills/:skillId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Remove a skill requirement from career role (Admin only)' })
  @ApiResponse({ status: 200, description: 'Skill requirement removed' })
  @ApiResponse({ status: 404, description: 'Requirement not found' })
  async removeSkillRequirement(
    @Param('id') id: string,
    @Param('skillId') skillId: string,
  ) {
    return this.careerRolesService.removeSkillRequirement(id, skillId);
  }
}

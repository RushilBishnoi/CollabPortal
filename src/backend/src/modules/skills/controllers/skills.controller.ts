import { Controller, Get, Query, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { SkillsService } from '../services/skills.service';

@ApiTags('Skills - Taxonomy')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('skills')
export class SkillsController {
  constructor(private readonly skillsService: SkillsService) {}

  @Get('categories')
  @ApiOperation({ summary: 'List all skill categories with hierarchy' })
  @ApiResponse({ status: 200, description: 'Skill categories retrieved successfully' })
  async listCategories() {
    return this.skillsService.listCategories();
  }

  @Get('search')
  @ApiOperation({ summary: 'Search canonical skills by name' })
  @ApiQuery({ name: 'q', required: true, description: 'Search query (minimum 2 characters)' })
  @ApiResponse({ status: 200, description: 'Matching skills retrieved' })
  async searchSkills(@Query('q') query: string) {
    return this.skillsService.searchSkills(query || '');
  }

  @Get()
  @ApiOperation({ summary: 'List active skills, optionally filtered by category' })
  @ApiQuery({ name: 'categoryId', required: false, description: 'Filter by category ID' })
  @ApiResponse({ status: 200, description: 'Skills retrieved successfully' })
  async listSkills(@Query('categoryId') categoryId?: string) {
    return this.skillsService.listSkills(categoryId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get skill details by ID' })
  @ApiResponse({ status: 200, description: 'Skill retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Skill not found' })
  async getSkillById(@Param('id') id: string) {
    return this.skillsService.getSkillById(id);
  }
}

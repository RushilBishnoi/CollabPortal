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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Public } from '../../../common/decorators/public.decorator';
import { LearningPathsService } from '../services/learning-paths.service';
import { CreateLearningPathDto } from '../dto/create-learning-path.dto';
import { UpdateLearningPathDto } from '../dto/update-learning-path.dto';
import { QueryLearningPathsDto } from '../dto/query-learning-paths.dto';

@ApiTags('Learning Paths')
@Controller('learning/paths')
export class LearningPathsController {
  constructor(private readonly pathsService: LearningPathsService) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.FACULTY, UserRole.INDUSTRY, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a new learning curriculum / roadmap' })
  @ApiResponse({ status: 201, description: 'Learning path created successfully' })
  async create(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: UserRole,
    @Body() dto: CreateLearningPathDto,
  ) {
    return this.pathsService.create(userId, userRole, dto);
  }

  @Get()
  @Public()
  @ApiOperation({ summary: 'Browse published learning paths' })
  @ApiResponse({ status: 200, description: 'Learning paths retrieved' })
  async findAll(@Query() query: QueryLearningPathsDto) {
    return this.pathsService.findAll(query);
  }

  @Get('my')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.FACULTY, UserRole.INDUSTRY, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'List learning paths authored by current user' })
  @ApiResponse({ status: 200, description: 'User learning paths retrieved' })
  async findMyPaths(@CurrentUser('id') userId: string) {
    return this.pathsService.findMyPaths(userId);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get learning path details with curriculum steps by ID or slug' })
  @ApiResponse({ status: 200, description: 'Learning path details retrieved' })
  @ApiResponse({ status: 404, description: 'Learning path not found' })
  async findById(@Param('id') id: string) {
    return this.pathsService.findById(id);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.FACULTY, UserRole.INDUSTRY, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update an authored learning path' })
  @ApiResponse({ status: 200, description: 'Learning path updated' })
  @ApiResponse({ status: 403, description: 'Forbidden: not author' })
  async update(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: UserRole,
    @Param('id') id: string,
    @Body() dto: UpdateLearningPathDto,
  ) {
    return this.pathsService.update(userId, userRole, id, dto);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.FACULTY, UserRole.INDUSTRY, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete an authored learning path' })
  @ApiResponse({ status: 200, description: 'Learning path deleted' })
  async delete(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: UserRole,
    @Param('id') id: string,
  ) {
    return this.pathsService.delete(userId, userRole, id);
  }
}

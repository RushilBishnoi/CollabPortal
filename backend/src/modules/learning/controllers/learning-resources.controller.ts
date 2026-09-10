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
import { LearningResourcesService } from '../services/learning-resources.service';
import { CreateLearningResourceDto } from '../dto/create-learning-resource.dto';
import { UpdateLearningResourceDto } from '../dto/update-learning-resource.dto';
import { QueryLearningResourcesDto } from '../dto/query-learning-resources.dto';

@ApiTags('Learning Resources')
@Controller('learning/resources')
export class LearningResourcesController {
  constructor(private readonly resourcesService: LearningResourcesService) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.FACULTY, UserRole.INDUSTRY, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a new curated learning resource' })
  @ApiResponse({ status: 201, description: 'Resource created successfully' })
  async create(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: UserRole,
    @Body() dto: CreateLearningResourceDto,
  ) {
    return this.resourcesService.create(userId, userRole, dto);
  }

  @Get()
  @Public()
  @ApiOperation({ summary: 'Browse and search curated learning resources' })
  @ApiResponse({ status: 200, description: 'Resources retrieved' })
  async findAll(@Query() query: QueryLearningResourcesDto) {
    return this.resourcesService.findAll(query);
  }

  @Get('my')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.FACULTY, UserRole.INDUSTRY, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'List resources authored by current user' })
  @ApiResponse({ status: 200, description: 'User resources retrieved' })
  async findMyResources(@CurrentUser('id') userId: string) {
    return this.resourcesService.findMyResources(userId);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get details of a single learning resource by ID or slug' })
  @ApiResponse({ status: 200, description: 'Resource retrieved' })
  @ApiResponse({ status: 404, description: 'Resource not found' })
  async findById(@Param('id') id: string) {
    return this.resourcesService.findById(id);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.FACULTY, UserRole.INDUSTRY, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update an authored learning resource' })
  @ApiResponse({ status: 200, description: 'Resource updated' })
  @ApiResponse({ status: 403, description: 'Forbidden: not author' })
  async update(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: UserRole,
    @Param('id') id: string,
    @Body() dto: UpdateLearningResourceDto,
  ) {
    return this.resourcesService.update(userId, userRole, id, dto);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.FACULTY, UserRole.INDUSTRY, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete an authored learning resource' })
  @ApiResponse({ status: 200, description: 'Resource deleted' })
  async delete(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: UserRole,
    @Param('id') id: string,
  ) {
    return this.resourcesService.delete(userId, userRole, id);
  }

  @Patch(':id/verify')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.INSTITUTION_ADMIN)
  @ApiOperation({ summary: 'Verify / Endorse a learning resource' })
  @ApiResponse({ status: 200, description: 'Resource verification updated' })
  async verify(
    @Param('id') id: string,
    @Body('isVerified') isVerified: boolean,
  ) {
    return this.resourcesService.verify(id, isVerified !== undefined ? isVerified : true);
  }
}

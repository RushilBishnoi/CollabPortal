import {
  IsString,
  IsOptional,
  IsEnum,
  IsInt,
  Min,
  Max,
  IsBoolean,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  LearningResourceType,
  LearningResourceDifficulty,
  ProficiencyLevel,
  UserRole,
} from '@prisma/client';

export class QueryLearningResourcesDto {
  @ApiPropertyOptional({ description: 'Search term matching title or description' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by canonical skill ID' })
  @IsString()
  @IsOptional()
  skillId?: string;

  @ApiPropertyOptional({ enum: LearningResourceType })
  @IsEnum(LearningResourceType)
  @IsOptional()
  resourceType?: LearningResourceType;

  @ApiPropertyOptional({ enum: LearningResourceDifficulty })
  @IsEnum(LearningResourceDifficulty)
  @IsOptional()
  difficulty?: LearningResourceDifficulty;

  @ApiPropertyOptional({ enum: ProficiencyLevel })
  @IsEnum(ProficiencyLevel)
  @IsOptional()
  targetProficiency?: ProficiencyLevel;

  @ApiPropertyOptional({ enum: UserRole })
  @IsEnum(UserRole)
  @IsOptional()
  authorRole?: UserRole;

  @ApiPropertyOptional({ description: 'Filter only verified resources' })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  isVerified?: boolean;

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', default: 12 })
  @IsInt()
  @Min(1)
  @Max(50)
  @IsOptional()
  @Type(() => Number)
  limit?: number = 12;
}

import {
  IsString,
  IsOptional,
  IsEnum,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { LearningPathStatus, ProficiencyLevel, UserRole } from '@prisma/client';

export class QueryLearningPathsDto {
  @ApiPropertyOptional({ description: 'Search term matching title or description' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by career role ID' })
  @IsString()
  @IsOptional()
  careerRoleId?: string;

  @ApiPropertyOptional({ enum: LearningPathStatus })
  @IsEnum(LearningPathStatus)
  @IsOptional()
  status?: LearningPathStatus;

  @ApiPropertyOptional({ enum: ProficiencyLevel })
  @IsEnum(ProficiencyLevel)
  @IsOptional()
  targetProficiency?: ProficiencyLevel;

  @ApiPropertyOptional({ enum: UserRole })
  @IsEnum(UserRole)
  @IsOptional()
  authorRole?: UserRole;

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

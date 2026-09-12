import {
  IsString,
  IsOptional,
  IsEnum,
  IsUrl,
  IsInt,
  Min,
  Max,
  IsArray,
  IsBoolean,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  LearningResourceType,
  LearningResourceDifficulty,
  ProficiencyLevel,
} from '@prisma/client';

export class UpdateLearningResourceDto {
  @ApiPropertyOptional({ description: 'Title of the learning resource' })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({ description: 'Detailed summary of what the resource teaches' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'External URL (video, documentation, course, repo)' })
  @IsUrl({}, { message: 'url must be a valid URL address' })
  @IsOptional()
  url?: string;

  @ApiPropertyOptional({ description: 'Canonical Skill ID this resource teaches' })
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

  @ApiPropertyOptional({ description: 'Estimated study duration in minutes' })
  @IsInt()
  @Min(1)
  @Max(10000)
  @IsOptional()
  estimatedMinutes?: number;

  @ApiPropertyOptional({ description: 'Content provider / platform' })
  @IsString()
  @IsOptional()
  provider?: string;

  @ApiPropertyOptional({ description: 'Tags for discovery', type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @ApiPropertyOptional({ description: 'Whether the resource is visible to learners' })
  @IsBoolean()
  @IsOptional()
  isPublished?: boolean;
}

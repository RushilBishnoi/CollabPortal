import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsUrl,
  IsInt,
  Min,
  Max,
  IsArray,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  LearningResourceType,
  LearningResourceDifficulty,
  ProficiencyLevel,
} from '@prisma/client';

export class CreateLearningResourceDto {
  @ApiProperty({ description: 'Title of the learning resource' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: 'Detailed summary of what the resource teaches' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ description: 'External URL (video, documentation, course, repo)' })
  @IsUrl({}, { message: 'url must be a valid URL address' })
  @IsNotEmpty()
  url: string;

  @ApiProperty({ description: 'Canonical Skill ID this resource teaches' })
  @IsString()
  @IsNotEmpty()
  skillId: string;

  @ApiPropertyOptional({ enum: LearningResourceType, default: LearningResourceType.ARTICLE })
  @IsEnum(LearningResourceType)
  @IsOptional()
  resourceType?: LearningResourceType;

  @ApiPropertyOptional({ enum: LearningResourceDifficulty, default: LearningResourceDifficulty.BEGINNER })
  @IsEnum(LearningResourceDifficulty)
  @IsOptional()
  difficulty?: LearningResourceDifficulty;

  @ApiPropertyOptional({ enum: ProficiencyLevel, default: ProficiencyLevel.BEGINNER })
  @IsEnum(ProficiencyLevel)
  @IsOptional()
  targetProficiency?: ProficiencyLevel;

  @ApiPropertyOptional({ description: 'Estimated study duration in minutes', default: 30 })
  @IsInt()
  @Min(1)
  @Max(10000)
  @IsOptional()
  estimatedMinutes?: number;

  @ApiPropertyOptional({ description: 'Content provider / platform (e.g., MDN, AWS, Coursera)' })
  @IsString()
  @IsOptional()
  provider?: string;

  @ApiPropertyOptional({ description: 'Tags for discovery', type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];
}

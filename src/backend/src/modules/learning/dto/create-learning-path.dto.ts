import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsInt,
  Min,
  Max,
  IsArray,
  ValidateNested,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProficiencyLevel, LearningPathStatus } from '@prisma/client';

export class CreateLearningPathItemDto {
  @ApiProperty({ description: 'Learning Resource ID' })
  @IsString()
  @IsNotEmpty()
  resourceId: string;

  @ApiPropertyOptional({ description: 'Sequence order of this item in the curriculum', default: 1 })
  @IsInt()
  @Min(1)
  @IsOptional()
  order?: number;

  @ApiPropertyOptional({ description: 'Whether this step is required to complete the path', default: true })
  @IsBoolean()
  @IsOptional()
  isMandatory?: boolean;

  @ApiPropertyOptional({ description: 'Milestone notes or learning instructions' })
  @IsString()
  @IsOptional()
  milestoneNotes?: string;
}

export class CreateLearningPathDto {
  @ApiProperty({ description: 'Title of the learning curriculum / roadmap' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: 'Detailed overview of the learning journey' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiPropertyOptional({ description: 'Optional Career Role ID this path prepares for' })
  @IsString()
  @IsOptional()
  careerRoleId?: string;

  @ApiPropertyOptional({ enum: ProficiencyLevel, default: ProficiencyLevel.INTERMEDIATE })
  @IsEnum(ProficiencyLevel)
  @IsOptional()
  targetProficiency?: ProficiencyLevel;

  @ApiPropertyOptional({ description: 'Estimated study hours for complete path', default: 10 })
  @IsInt()
  @Min(1)
  @Max(1000)
  @IsOptional()
  estimatedHours?: number;

  @ApiPropertyOptional({ enum: LearningPathStatus, default: LearningPathStatus.PUBLISHED })
  @IsEnum(LearningPathStatus)
  @IsOptional()
  status?: LearningPathStatus;

  @ApiProperty({ description: 'Ordered list of learning resources in this path', type: [CreateLearningPathItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateLearningPathItemDto)
  items: CreateLearningPathItemDto[];
}

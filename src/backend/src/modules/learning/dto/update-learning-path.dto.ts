import {
  IsString,
  IsOptional,
  IsEnum,
  IsInt,
  Min,
  Max,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ProficiencyLevel, LearningPathStatus } from '@prisma/client';
import { CreateLearningPathItemDto } from './create-learning-path.dto';

export class UpdateLearningPathDto {
  @ApiPropertyOptional({ description: 'Title of the learning curriculum / roadmap' })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({ description: 'Detailed overview of the learning journey' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Optional Career Role ID this path prepares for' })
  @IsString()
  @IsOptional()
  careerRoleId?: string;

  @ApiPropertyOptional({ enum: ProficiencyLevel })
  @IsEnum(ProficiencyLevel)
  @IsOptional()
  targetProficiency?: ProficiencyLevel;

  @ApiPropertyOptional({ description: 'Estimated study hours for complete path' })
  @IsInt()
  @Min(1)
  @Max(1000)
  @IsOptional()
  estimatedHours?: number;

  @ApiPropertyOptional({ enum: LearningPathStatus })
  @IsEnum(LearningPathStatus)
  @IsOptional()
  status?: LearningPathStatus;

  @ApiPropertyOptional({ description: 'Updated list of items in the path', type: [CreateLearningPathItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateLearningPathItemDto)
  @IsOptional()
  items?: CreateLearningPathItemDto[];
}

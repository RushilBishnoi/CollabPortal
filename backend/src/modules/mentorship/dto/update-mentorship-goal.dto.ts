import {
  IsEnum,
  IsOptional,
  IsString,
  IsDateString,
} from 'class-validator';
import { MentorshipGoalStatus } from '@prisma/client';

export class UpdateMentorshipGoalDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDateString()
  targetDate?: string;

  @IsOptional()
  @IsEnum(MentorshipGoalStatus)
  status?: MentorshipGoalStatus;

  @IsOptional()
  @IsString()
  linkedSkillId?: string;

  @IsOptional()
  @IsString()
  linkedLearningPathId?: string;
}

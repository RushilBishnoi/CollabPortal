import {
  IsString,
  IsEnum,
  IsInt,
  Min,
  Max,
  IsOptional,
  IsDateString,
  MaxLength,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { InterviewMode, InterviewStatus } from '@prisma/client';

export class UpdateInterviewDto {
  @ApiPropertyOptional({ description: 'Title of interview round' })
  @IsString()
  @IsOptional()
  @MaxLength(150)
  title?: string;

  @ApiPropertyOptional({ description: 'Scheduled date and time (ISO string)' })
  @IsDateString()
  @IsOptional()
  scheduledAt?: string;

  @ApiPropertyOptional({ description: 'Duration in minutes' })
  @IsInt()
  @Min(15)
  @Max(240)
  @IsOptional()
  durationMins?: number;

  @ApiPropertyOptional({ enum: InterviewMode })
  @IsEnum(InterviewMode)
  @IsOptional()
  mode?: InterviewMode;

  @ApiPropertyOptional({ description: 'Video call link or physical venue address' })
  @IsString()
  @IsOptional()
  meetingLink?: string;

  @ApiPropertyOptional({ description: 'Interviewer name or panel title' })
  @IsString()
  @IsOptional()
  interviewer?: string;

  @ApiPropertyOptional({ description: 'Preparation notes or instructions for candidate' })
  @IsString()
  @IsOptional()
  @MaxLength(2000)
  instructions?: string;

  @ApiPropertyOptional({ enum: InterviewStatus })
  @IsEnum(InterviewStatus)
  @IsOptional()
  status?: InterviewStatus;

  @ApiPropertyOptional({ description: 'Private recruiter feedback & score evaluation' })
  @IsString()
  @IsOptional()
  @MaxLength(3000)
  recruiterNotes?: string;

  @ApiPropertyOptional({ description: 'Candidate rating (1 to 5)' })
  @IsInt()
  @Min(1)
  @Max(5)
  @IsOptional()
  rating?: number;
}

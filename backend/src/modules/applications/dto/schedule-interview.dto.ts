import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsInt,
  Min,
  Max,
  IsOptional,
  IsDateString,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { InterviewMode } from '@prisma/client';

export class ScheduleInterviewDto {
  @ApiProperty({ description: 'Title of interview round', example: 'Technical Round 1' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  title: string;

  @ApiProperty({ description: 'Scheduled date and time (ISO string)' })
  @IsDateString()
  @IsNotEmpty()
  scheduledAt: string;

  @ApiPropertyOptional({ description: 'Duration in minutes', default: 45 })
  @IsInt()
  @Min(15)
  @Max(240)
  @IsOptional()
  durationMins?: number;

  @ApiPropertyOptional({ enum: InterviewMode, default: InterviewMode.ONLINE_MEETING })
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
}

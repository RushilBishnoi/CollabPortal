import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsNumber,
  IsInt,
  Min,
  IsArray,
  IsDateString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  CollaborationType,
  CollaborationStatus,
  CollaborationAudience,
  CollaborationMode,
} from '@prisma/client';

export class CreateCollaborationDto {
  @ApiProperty({ description: 'Title of the collaboration engagement', example: 'Hands-on Cloud Architecture Workshop' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: 'Detailed description and syllabus' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ enum: CollaborationType, description: 'Type of collaboration', example: CollaborationType.WORKSHOP })
  @IsEnum(CollaborationType)
  collaborationType: CollaborationType;

  @ApiPropertyOptional({ enum: CollaborationStatus, description: 'Initial status of collaboration', default: CollaborationStatus.DRAFT })
  @IsEnum(CollaborationStatus)
  @IsOptional()
  status?: CollaborationStatus;

  @ApiPropertyOptional({ enum: CollaborationAudience, description: 'Target audience', default: CollaborationAudience.BOTH })
  @IsEnum(CollaborationAudience)
  @IsOptional()
  targetAudience?: CollaborationAudience;

  @ApiPropertyOptional({ enum: CollaborationMode, description: 'Delivery mode', default: CollaborationMode.ONLINE })
  @IsEnum(CollaborationMode)
  @IsOptional()
  mode?: CollaborationMode;

  @ApiPropertyOptional({ description: 'Expected start date' })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Expected end date' })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Duration in days' })
  @IsInt()
  @Min(1)
  @IsOptional()
  durationDays?: number;

  @ApiPropertyOptional({ description: 'Number of sessions' })
  @IsInt()
  @Min(1)
  @IsOptional()
  sessionCount?: number;

  @ApiPropertyOptional({ description: 'Venue or campus address (for IN_PERSON / HYBRID)' })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiPropertyOptional({ description: 'Virtual meeting URL (for ONLINE / HYBRID)' })
  @IsString()
  @IsOptional()
  meetingLink?: string;

  @ApiPropertyOptional({ description: 'Maximum participant capacity' })
  @IsInt()
  @Min(1)
  @IsOptional()
  maxParticipants?: number;

  @ApiPropertyOptional({ description: 'List of eligible academic departments', default: [] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  eligibleDepartments?: string[];

  @ApiPropertyOptional({ description: 'Tags or domains involved (e.g. ["Cloud", "DevOps"])', default: [] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  domainTags?: string[];

  @ApiPropertyOptional({ description: 'Optional honorarium / stipend amount' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  stipend?: number;

  @ApiPropertyOptional({ description: 'Currency for stipend/honorarium', default: 'INR' })
  @IsString()
  @IsOptional()
  stipendCurrency?: string;

  @ApiPropertyOptional({ description: 'Contact coordinator name' })
  @IsString()
  @IsOptional()
  contactPerson?: string;

  @ApiPropertyOptional({ description: 'Contact email' })
  @IsString()
  @IsOptional()
  contactEmail?: string;

  @ApiPropertyOptional({ description: 'Prerequisites, instructions, or hardware requirements' })
  @IsString()
  @IsOptional()
  instructions?: string;

  @ApiPropertyOptional({ description: 'Participation application deadline' })
  @IsDateString()
  @IsOptional()
  deadline?: string;
}

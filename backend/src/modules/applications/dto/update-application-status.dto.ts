import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ApplicationStatus } from '@prisma/client';

export class UpdateApplicationStatusDto {
  @ApiProperty({
    enum: ApplicationStatus,
    description: 'Target recruitment stage (UNDER_REVIEW | SHORTLISTED | SELECTED | REJECTED)',
  })
  @IsEnum(ApplicationStatus)
  @IsNotEmpty()
  status: ApplicationStatus;

  @ApiPropertyOptional({ description: 'Internal recruiter notes (private, not shared with student)' })
  @IsString()
  @IsOptional()
  @MaxLength(2000)
  recruiterNotes?: string;

  @ApiPropertyOptional({ description: 'Optional rejection reason' })
  @IsString()
  @IsOptional()
  @MaxLength(1000)
  rejectionReason?: string;
}

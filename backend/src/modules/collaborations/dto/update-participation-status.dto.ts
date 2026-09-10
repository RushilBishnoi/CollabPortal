import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ParticipationStatus } from '@prisma/client';

export class UpdateParticipationStatusDto {
  @ApiProperty({
    enum: ParticipationStatus,
    description: 'Target participation status (APPROVED | REJECTED | WITHDRAWN | COMPLETED | CANCELLED)',
  })
  @IsEnum(ParticipationStatus)
  @IsNotEmpty()
  status: ParticipationStatus;

  @ApiPropertyOptional({ description: 'Internal industry evaluation notes (private to industry/admin)' })
  @IsString()
  @IsOptional()
  industryNotes?: string;

  @ApiPropertyOptional({ description: 'Reason for rejection if status is REJECTED' })
  @IsString()
  @IsOptional()
  rejectionReason?: string;

  @ApiPropertyOptional({ description: 'Audit notes or remarks regarding the status change' })
  @IsString()
  @IsOptional()
  notes?: string;
}

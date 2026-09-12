import { IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CollaborationStatus } from '@prisma/client';

export class UpdateCollaborationStatusDto {
  @ApiProperty({
    enum: CollaborationStatus,
    description: 'Target collaboration status (OPEN | CLOSED | CANCELLED | COMPLETED)',
  })
  @IsEnum(CollaborationStatus)
  @IsNotEmpty()
  status: CollaborationStatus;
}

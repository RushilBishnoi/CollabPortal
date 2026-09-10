import { IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { OpportunityStatus } from '@prisma/client';

export class UpdateOpportunityStatusDto {
  @ApiProperty({
    enum: OpportunityStatus,
    description: 'New posting status (DRAFT | PUBLISHED | CLOSED | ARCHIVED)',
  })
  @IsEnum(OpportunityStatus)
  @IsNotEmpty()
  status: OpportunityStatus;
}

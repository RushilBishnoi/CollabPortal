import { IsOptional, IsEnum, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ParticipationStatus, UserRole } from '@prisma/client';

export class ParticipationQueryDto {
  @ApiPropertyOptional({ enum: ParticipationStatus, description: 'Filter by participation status' })
  @IsEnum(ParticipationStatus)
  @IsOptional()
  status?: ParticipationStatus;

  @ApiPropertyOptional({ description: 'Filter by participant type (FACULTY or STUDENT)' })
  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Number of items per page', default: 10 })
  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  limit?: number = 10;
}

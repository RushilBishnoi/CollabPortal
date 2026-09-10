import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { StudentResourceStatus } from '@prisma/client';

export class UpdateResourceProgressDto {
  @ApiProperty({ enum: StudentResourceStatus, description: 'Progress state for this resource' })
  @IsEnum(StudentResourceStatus)
  status: StudentResourceStatus;

  @ApiPropertyOptional({ description: 'Additional time spent studying this resource in minutes' })
  @IsInt()
  @Min(0)
  @IsOptional()
  timeSpentMinutes?: number;

  @ApiPropertyOptional({ description: 'Student rating for this resource (1-5)' })
  @IsInt()
  @Min(1)
  @Max(5)
  @IsOptional()
  rating?: number;

  @ApiPropertyOptional({ description: 'Personal study notes' })
  @IsString()
  @IsOptional()
  notes?: string;
}

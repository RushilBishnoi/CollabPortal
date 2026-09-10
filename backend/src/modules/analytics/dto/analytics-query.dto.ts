import { IsString, IsOptional, IsInt, Min, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class AnalyticsQueryDto {
  @ApiPropertyOptional({ description: 'Filter by Department (e.g., Computer Science)' })
  @IsString()
  @IsOptional()
  department?: string;

  @ApiPropertyOptional({ description: 'Filter by Graduation Year (e.g., 2026)' })
  @IsInt()
  @Min(2020)
  @IsOptional()
  @Type(() => Number)
  graduationYear?: number;

  @ApiPropertyOptional({ description: 'Filter by Degree program (e.g., B.Tech)' })
  @IsString()
  @IsOptional()
  degree?: string;

  @ApiPropertyOptional({ description: 'Filter by start date (ISO string)' })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Filter by end date (ISO string)' })
  @IsDateString()
  @IsOptional()
  endDate?: string;
}

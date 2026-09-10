import { IsString, IsOptional, IsEnum, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  CollaborationType,
  CollaborationStatus,
  CollaborationAudience,
  CollaborationMode,
} from '@prisma/client';

export class CollaborationQueryDto {
  @ApiPropertyOptional({ description: 'Search keyword matching title, description, domain tags or location' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ enum: CollaborationType, description: 'Filter by Collaboration Type' })
  @IsEnum(CollaborationType)
  @IsOptional()
  collaborationType?: CollaborationType;

  @ApiPropertyOptional({ enum: CollaborationStatus, description: 'Filter by Collaboration Status' })
  @IsEnum(CollaborationStatus)
  @IsOptional()
  status?: CollaborationStatus;

  @ApiPropertyOptional({ enum: CollaborationAudience, description: 'Filter by Target Audience' })
  @IsEnum(CollaborationAudience)
  @IsOptional()
  targetAudience?: CollaborationAudience;

  @ApiPropertyOptional({ enum: CollaborationMode, description: 'Filter by Mode (ONLINE, IN_PERSON, HYBRID)' })
  @IsEnum(CollaborationMode)
  @IsOptional()
  mode?: CollaborationMode;

  @ApiPropertyOptional({ description: 'Filter by academic department' })
  @IsString()
  @IsOptional()
  department?: string;

  @ApiPropertyOptional({ description: 'Filter by industry company name or ID' })
  @IsString()
  @IsOptional()
  industryProfileId?: string;

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Number of results per page', default: 10 })
  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  limit?: number = 10;
}

import { IsString, IsOptional, IsEnum, IsBoolean, IsInt, Min } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { OpportunityType, OpportunityStatus } from '@prisma/client';

export class OpportunityQueryDto {
  @ApiPropertyOptional({ description: 'Search keyword matching title, description, or location' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ enum: OpportunityType, description: 'Filter by Opportunity Type' })
  @IsEnum(OpportunityType)
  @IsOptional()
  opportunityType?: OpportunityType;

  @ApiPropertyOptional({ enum: OpportunityStatus, description: 'Filter by Status (default: PUBLISHED for public)' })
  @IsEnum(OpportunityStatus)
  @IsOptional()
  status?: OpportunityStatus;

  @ApiPropertyOptional({ description: 'Filter only 100% remote roles' })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  isRemote?: boolean;

  @ApiPropertyOptional({ description: 'Filter by location keyword (e.g. "Bengaluru", "Hyderabad")' })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiPropertyOptional({ description: 'Filter by canonical skill ID' })
  @IsString()
  @IsOptional()
  skillId?: string;

  @ApiPropertyOptional({ description: 'Filter by career role ID or slug' })
  @IsString()
  @IsOptional()
  careerRoleId?: string;

  @ApiPropertyOptional({ description: 'Filter opportunities matching student eligibility only', default: false })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  eligibleOnly?: boolean;

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Number of results per page', default: 20 })
  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  limit?: number = 20;
}

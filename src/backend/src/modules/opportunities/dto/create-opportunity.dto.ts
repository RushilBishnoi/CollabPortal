import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsNumber,
  IsInt,
  Min,
  Max,
  IsArray,
  IsDateString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OpportunityType, OpportunityStatus, ProficiencyLevel } from '@prisma/client';

export class OpportunitySkillRequirementDto {
  @ApiProperty({ description: 'Canonical skill ID' })
  @IsString()
  @IsNotEmpty()
  skillId: string;

  @ApiProperty({ enum: ProficiencyLevel, description: 'Required proficiency level' })
  @IsEnum(ProficiencyLevel)
  requiredProficiency: ProficiencyLevel;

  @ApiPropertyOptional({ description: 'Relative weight of skill', default: 1.0 })
  @IsNumber()
  @Min(0.1)
  @Max(5.0)
  @IsOptional()
  weight?: number;

  @ApiPropertyOptional({ description: 'Whether this skill is mandatory', default: true })
  @IsBoolean()
  @IsOptional()
  isMandatory?: boolean;
}

export class CreateOpportunityDto {
  @ApiProperty({ description: 'Title of the opportunity', example: 'Frontend Engineering Summer Internship' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: 'Unique URL slug', example: 'frontend-engineering-summer-internship' })
  @IsString()
  @IsNotEmpty()
  slug: string;

  @ApiProperty({ description: 'Detailed job/internship description' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ enum: OpportunityType, description: 'Type of opportunity', example: OpportunityType.INTERNSHIP })
  @IsEnum(OpportunityType)
  opportunityType: OpportunityType;

  @ApiPropertyOptional({ enum: OpportunityStatus, description: 'Status of posting', default: OpportunityStatus.PUBLISHED })
  @IsEnum(OpportunityStatus)
  @IsOptional()
  status?: OpportunityStatus;

  @ApiPropertyOptional({ description: 'Optional mapped CareerRole ID' })
  @IsString()
  @IsOptional()
  careerRoleId?: string;

  @ApiPropertyOptional({ description: 'City, region or remote location', default: 'Remote' })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiPropertyOptional({ description: 'Whether this role is 100% remote', default: false })
  @IsBoolean()
  @IsOptional()
  isRemote?: boolean;

  @ApiPropertyOptional({ description: 'Stipend or compensation amount' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  stipend?: number;

  @ApiPropertyOptional({ description: 'Currency code', default: 'INR' })
  @IsString()
  @IsOptional()
  stipendCurrency?: string;

  @ApiPropertyOptional({ description: 'Stipend schedule', default: 'MONTHLY' })
  @IsString()
  @IsOptional()
  stipendPeriod?: string;

  @ApiPropertyOptional({ description: 'Minimum CGPA eligibility requirement (0-10)' })
  @IsNumber()
  @Min(0)
  @Max(10)
  @IsOptional()
  minCgpa?: number;

  @ApiPropertyOptional({ description: 'Earliest graduation year eligible' })
  @IsInt()
  @IsOptional()
  minGraduationYear?: number;

  @ApiPropertyOptional({ description: 'Latest graduation year eligible' })
  @IsInt()
  @IsOptional()
  maxGraduationYear?: number;

  @ApiPropertyOptional({ description: 'List of allowed degree departments (e.g. ["CSE", "IT"])', default: [] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  eligibleDepartments?: string[];

  @ApiPropertyOptional({ description: 'Application deadline timestamp' })
  @IsDateString()
  @IsOptional()
  deadline?: string;

  @ApiPropertyOptional({ description: 'Number of open positions', default: 1 })
  @IsInt()
  @Min(1)
  @IsOptional()
  positionsCount?: number;

  @ApiPropertyOptional({ description: 'Maximum allowed applicant cap' })
  @IsInt()
  @Min(1)
  @IsOptional()
  maxApplications?: number;

  @ApiPropertyOptional({ type: [OpportunitySkillRequirementDto], description: 'Required skills array' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OpportunitySkillRequirementDto)
  @IsOptional()
  skills?: OpportunitySkillRequirementDto[];
}

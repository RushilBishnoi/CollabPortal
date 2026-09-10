import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsNumber,
  IsDateString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { EmploymentType } from '@prisma/client';

export class CreatePlacementOfferDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  designation: string;

  @IsOptional()
  @IsEnum(EmploymentType)
  employmentType?: EmploymentType;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  ctcAnnual?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  baseSalaryMonthly?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  stipendMonthly?: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsDateString()
  @IsNotEmpty()
  joiningDate: string;

  @IsDateString()
  @IsNotEmpty()
  offerExpiryDate: string;

  @IsOptional()
  @IsString()
  workLocation?: string;

  @IsOptional()
  @IsString()
  workMode?: string;

  @IsOptional()
  @IsString()
  department?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  termsAndConditions?: string;

  @IsOptional()
  @IsString()
  benefitsSummary?: string;

  @IsOptional()
  @IsString()
  contactPerson?: string;

  @IsOptional()
  @IsString()
  contactEmail?: string;
}

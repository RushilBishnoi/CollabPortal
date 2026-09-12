import { IsString, IsOptional, IsArray } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateInstitutionProfileDto {
  @ApiPropertyOptional({ example: 'National Institute of Technology' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'NIT-BLR-01' })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional({ example: 'TECHNICAL_INSTITUTE' })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({ example: 'Campus Road, Electronic City' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: 'Bengaluru' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ example: 'Karnataka' })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional({ example: 'https://nit.example.edu' })
  @IsOptional()
  @IsString()
  website?: string;

  @ApiPropertyOptional({ example: 'admin@nit.example.edu' })
  @IsOptional()
  @IsString()
  contactEmail?: string;

  @ApiPropertyOptional({ example: '+91-80-87654321' })
  @IsOptional()
  @IsString()
  contactPhone?: string;

  @ApiPropertyOptional({ example: ['Computer Science', 'Information Technology', 'Electronics'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  departments?: string[];
}

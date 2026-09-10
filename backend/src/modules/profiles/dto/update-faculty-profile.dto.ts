import { IsString, IsOptional, IsArray } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateFacultyProfileDto {
  @ApiPropertyOptional({ example: 'Dr. Robert Vance' })
  @IsOptional()
  @IsString()
  fullName?: string;

  @ApiPropertyOptional({ example: '+1-555-0188' })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiPropertyOptional({ example: 'Associate Professor' })
  @IsOptional()
  @IsString()
  designation?: string;

  @ApiPropertyOptional({ example: 'Computer Science' })
  @IsOptional()
  @IsString()
  department?: string;

  @ApiPropertyOptional({ example: 'inst-123-uuid' })
  @IsOptional()
  @IsString()
  institutionId?: string;

  @ApiPropertyOptional({ example: 'Ph.D. in Distributed Systems (IIT Bombay)' })
  @IsOptional()
  @IsString()
  academicBackground?: string;

  @ApiPropertyOptional({ example: ['Distributed Systems', 'Database Optimization'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  areasOfExpertise?: string[];

  @ApiPropertyOptional({ example: ['Cloud Computing', 'Relational Query Engine'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  researchInterests?: string[];

  @ApiPropertyOptional({ example: ['Faculty Development Programs', 'Industry Consultancy'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  industryInterests?: string[];
}

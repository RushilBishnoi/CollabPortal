import { IsString, IsNotEmpty, IsOptional, IsInt, Min, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCareerRoleDto {
  @ApiProperty({ description: 'Title of the career role', example: 'Frontend Developer' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: 'URL-friendly unique slug', example: 'frontend-developer' })
  @IsString()
  @IsNotEmpty()
  slug: string;

  @ApiProperty({ description: 'Industry or technical domain category', example: 'Software Engineering' })
  @IsString()
  @IsNotEmpty()
  category: string;

  @ApiPropertyOptional({ description: 'Detailed overview of the role and responsibilities' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Minimum years of experience required', default: 0 })
  @IsInt()
  @Min(0)
  @IsOptional()
  minExperienceYears?: number;

  @ApiPropertyOptional({ description: 'Whether the role is actively recommended', default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

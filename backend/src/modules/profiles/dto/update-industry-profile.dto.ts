import { IsString, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateIndustryProfileDto {
  @ApiPropertyOptional({ example: 'Acme Software Solutions' })
  @IsOptional()
  @IsString()
  companyName?: string;

  @ApiPropertyOptional({ example: 'Enterprise Software' })
  @IsOptional()
  @IsString()
  industryType?: string;

  @ApiPropertyOptional({ example: 'Leading provider of enterprise automation systems.' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'https://acme.example.com' })
  @IsOptional()
  @IsString()
  website?: string;

  @ApiPropertyOptional({ example: '500-1000 employees' })
  @IsOptional()
  @IsString()
  companySize?: string;

  @ApiPropertyOptional({ example: 'Bengaluru, India' })
  @IsOptional()
  @IsString()
  headquarters?: string;

  @ApiPropertyOptional({ example: 'careers@acme.example.com' })
  @IsOptional()
  @IsString()
  contactEmail?: string;

  @ApiPropertyOptional({ example: '+91-80-12345678' })
  @IsOptional()
  @IsString()
  contactPhone?: string;
}

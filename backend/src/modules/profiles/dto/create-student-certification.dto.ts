import { IsString, IsNotEmpty, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateStudentCertificationDto {
  @ApiProperty({ example: 'AWS Certified Solutions Architect' })
  @IsNotEmpty()
  @IsString()
  name!: string;

  @ApiProperty({ example: 'Amazon Web Services' })
  @IsNotEmpty()
  @IsString()
  issuingOrganization!: string;

  @ApiProperty({ example: '2025-06-15' })
  @IsNotEmpty()
  @IsDateString()
  issueDate!: string;

  @ApiPropertyOptional({ example: 'https://aws.amazon.com/verify/123456' })
  @IsOptional()
  @IsString()
  credentialUrl?: string;

  @ApiPropertyOptional({ example: 'AWS-ASA-998811' })
  @IsOptional()
  @IsString()
  credentialId?: string;
}

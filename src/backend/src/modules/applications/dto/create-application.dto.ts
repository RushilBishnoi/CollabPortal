import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateApplicationDto {
  @ApiProperty({ description: 'ID of the Opportunity being applied to' })
  @IsString()
  @IsNotEmpty()
  opportunityId: string;

  @ApiPropertyOptional({ description: 'Optional text cover letter' })
  @IsString()
  @IsOptional()
  @MaxLength(3000)
  coverLetter?: string;

  @ApiPropertyOptional({ description: 'Optional base64-encoded or uploaded resume payload' })
  @IsOptional()
  resumeFile?: {
    originalFilename: string;
    mimeType: string;
    buffer: Buffer | string;
    sizeBytes?: number;
  };
}

import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class EnrollLearningPathDto {
  @ApiPropertyOptional({ description: 'Optional motivation or target completion goal' })
  @IsString()
  @IsOptional()
  notes?: string;
}

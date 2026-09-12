import { IsString, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CreateParticipationDto {
  @ApiPropertyOptional({ description: 'Statement of motivation / participation goals' })
  @IsString()
  @IsOptional()
  motivation?: string;

  @ApiPropertyOptional({ description: 'Relevant academic or professional background' })
  @IsString()
  @IsOptional()
  relevantExperience?: string;
}

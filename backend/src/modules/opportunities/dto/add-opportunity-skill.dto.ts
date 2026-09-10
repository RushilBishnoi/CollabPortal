import { IsString, IsNotEmpty, IsEnum, IsNumber, Min, Max, IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProficiencyLevel } from '@prisma/client';

export class AddOpportunitySkillDto {
  @ApiProperty({ description: 'Canonical skill ID from Phase 5 taxonomy' })
  @IsString()
  @IsNotEmpty()
  skillId: string;

  @ApiProperty({ enum: ProficiencyLevel, description: 'Minimum required proficiency level' })
  @IsEnum(ProficiencyLevel)
  requiredProficiency: ProficiencyLevel;

  @ApiPropertyOptional({ description: 'Importance weight (0.1 to 5.0)', default: 1.0 })
  @IsNumber()
  @Min(0.1)
  @Max(5.0)
  @IsOptional()
  weight?: number;

  @ApiPropertyOptional({ description: 'Whether this skill is mandatory for the role', default: true })
  @IsBoolean()
  @IsOptional()
  isMandatory?: boolean;
}

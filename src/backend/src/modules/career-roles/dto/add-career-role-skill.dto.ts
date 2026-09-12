import { IsString, IsNotEmpty, IsEnum, IsNumber, Min, Max, IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProficiencyLevel } from '@prisma/client';

export class AddCareerRoleSkillDto {
  @ApiProperty({ description: 'ID of the canonical skill from Phase 5 taxonomy' })
  @IsString()
  @IsNotEmpty()
  skillId: string;

  @ApiProperty({
    enum: ProficiencyLevel,
    description: 'Minimum required proficiency level for this role',
    example: ProficiencyLevel.INTERMEDIATE,
  })
  @IsEnum(ProficiencyLevel)
  requiredProficiency: ProficiencyLevel;

  @ApiPropertyOptional({
    description: 'Relative importance weight of this skill (e.g. 0.5 to 2.0)',
    default: 1.0,
  })
  @IsNumber()
  @Min(0.1)
  @Max(5.0)
  @IsOptional()
  weight?: number;

  @ApiPropertyOptional({
    description: 'Whether this skill is strictly mandatory for the role',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  isMandatory?: boolean;
}

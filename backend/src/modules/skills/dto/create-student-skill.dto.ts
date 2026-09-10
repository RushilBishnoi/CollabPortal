import { IsString, IsNotEmpty, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ProficiencyLevel } from '@prisma/client';

export class CreateStudentSkillDto {
  @ApiProperty({ description: 'Skill ID from the canonical skill taxonomy' })
  @IsString()
  @IsNotEmpty()
  skillId!: string;

  @ApiProperty({ enum: ProficiencyLevel, description: 'Self-reported proficiency level' })
  @IsEnum(ProficiencyLevel)
  proficiency!: ProficiencyLevel;
}

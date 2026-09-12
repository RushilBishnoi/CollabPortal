import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ProficiencyLevel } from '@prisma/client';

export class UpdateStudentSkillDto {
  @ApiProperty({ enum: ProficiencyLevel, description: 'Updated proficiency level' })
  @IsEnum(ProficiencyLevel)
  proficiency!: ProficiencyLevel;
}

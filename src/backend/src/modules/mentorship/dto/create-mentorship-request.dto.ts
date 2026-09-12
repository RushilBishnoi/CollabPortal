import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateMentorshipRequestDto {
  @IsString()
  @IsNotEmpty()
  statementOfPurpose: string;

  @IsOptional()
  @IsString()
  targetCareerRoleId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(52)
  expectedDurationWeeks?: number;
}

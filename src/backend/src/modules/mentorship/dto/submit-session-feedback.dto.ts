import {
  IsInt,
  Min,
  Max,
  IsOptional,
  IsString,
} from 'class-validator';
import { Type } from 'class-transformer';

export class SubmitSessionFeedbackDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  studentRating?: number;

  @IsOptional()
  @IsString()
  studentFeedback?: string;

  @IsOptional()
  @IsString()
  mentorNotes?: string;

  @IsOptional()
  @IsString()
  studentNotes?: string;

  @IsOptional()
  @IsString()
  sharedSummary?: string;
}

import { IsOptional, IsString, IsDateString } from 'class-validator';

export class ConfirmJoiningDto {
  @IsOptional()
  @IsDateString()
  actualJoiningDate?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

import { IsOptional, IsString } from 'class-validator';

export class AcceptOfferDto {
  @IsOptional()
  @IsString()
  notes?: string;
}

export class DeclineOfferDto {
  @IsString()
  declineReason: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

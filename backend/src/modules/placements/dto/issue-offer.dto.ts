import { IsOptional, IsString } from 'class-validator';

export class IssueOfferDto {
  @IsOptional()
  @IsString()
  notes?: string;
}

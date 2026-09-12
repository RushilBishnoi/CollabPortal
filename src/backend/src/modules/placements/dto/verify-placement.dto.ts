import { IsOptional, IsString, IsBoolean } from 'class-validator';

export class VerifyPlacementDto {
  @IsOptional()
  @IsBoolean()
  nocIssued?: boolean;

  @IsOptional()
  @IsString()
  nocReferenceNumber?: string;

  @IsOptional()
  @IsString()
  verificationNotes?: string;
}

export class RevokePlacementDto {
  @IsString()
  reason: string;
}

import { IsEnum, IsOptional, IsString } from 'class-validator';

export enum MentorshipResponseAction {
  ACCEPT = 'ACCEPT',
  REJECT = 'REJECT',
}

export class RespondMentorshipRequestDto {
  @IsEnum(MentorshipResponseAction)
  action: MentorshipResponseAction;

  @IsOptional()
  @IsString()
  rejectionReason?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

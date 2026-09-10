import { PartialType } from '@nestjs/swagger';
import { CreateCollaborationDto } from './create-collaboration.dto';

export class UpdateCollaborationDto extends PartialType(CreateCollaborationDto) {}

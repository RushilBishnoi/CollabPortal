import { PartialType } from '@nestjs/swagger';
import { CreateCareerRoleDto } from './create-career-role.dto';

export class UpdateCareerRoleDto extends PartialType(CreateCareerRoleDto) {}

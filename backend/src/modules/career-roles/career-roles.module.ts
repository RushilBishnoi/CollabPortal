import { Module } from '@nestjs/common';
import { CareerRolesService } from './services/career-roles.service';
import { CareerRolesController } from './controllers/career-roles.controller';

@Module({
  controllers: [CareerRolesController],
  providers: [CareerRolesService],
  exports: [CareerRolesService],
})
export class CareerRolesModule {}

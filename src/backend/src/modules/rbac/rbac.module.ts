import { Module } from '@nestjs/common';
import { RbacController } from './rbac.controller';
import { RolesGuard } from '../../common/guards/roles.guard';

@Module({
  controllers: [RbacController],
  providers: [RolesGuard],
  exports: [RolesGuard],
})
export class RbacModule {}

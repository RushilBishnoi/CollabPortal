import { Module } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { CollaborationsController } from './controllers/collaborations.controller';
import { FacultyCollaborationsController } from './controllers/faculty-collaborations.controller';
import { StudentCollaborationsController } from './controllers/student-collaborations.controller';
import { ParticipationController } from './controllers/participation.controller';
import { CollaborationsService } from './services/collaborations.service';
import { CollaborationLifecycleService } from './services/collaboration-lifecycle.service';
import { ParticipationService } from './services/participation.service';

@Module({
  imports: [PrismaModule, NotificationsModule],
  controllers: [
    CollaborationsController,
    FacultyCollaborationsController,
    StudentCollaborationsController,
    ParticipationController,
  ],
  providers: [
    CollaborationsService,
    CollaborationLifecycleService,
    ParticipationService,
  ],
  exports: [
    CollaborationsService,
    CollaborationLifecycleService,
    ParticipationService,
  ],
})
export class CollaborationsModule {}

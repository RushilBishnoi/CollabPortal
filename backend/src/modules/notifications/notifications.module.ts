import { Module } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma.module';
import { NotificationsService } from './services/notifications.service';
import { NotificationPreferencesService } from './services/notification-preferences.service';
import { SystemAnnouncementsService } from './services/system-announcements.service';
import { NotificationsController } from './controllers/notifications.controller';
import { NotificationPreferencesController } from './controllers/notification-preferences.controller';
import { SystemAnnouncementsController } from './controllers/system-announcements.controller';

@Module({
  imports: [PrismaModule],
  controllers: [
    NotificationsController,
    NotificationPreferencesController,
    SystemAnnouncementsController,
  ],
  providers: [
    NotificationsService,
    NotificationPreferencesService,
    SystemAnnouncementsService,
  ],
  exports: [
    NotificationsService,
    NotificationPreferencesService,
    SystemAnnouncementsService,
  ],
})
export class NotificationsModule {}

import { Module } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PlacementLifecycleService } from './services/placement-lifecycle.service';
import { PlacementOffersService } from './services/placement-offers.service';
import { PlacementsService } from './services/placements.service';
import { PlacementDocumentsService } from './services/placement-documents.service';
import { IndustryPlacementsController } from './controllers/industry-placements.controller';
import { StudentPlacementsController } from './controllers/student-placements.controller';
import { InstitutionPlacementsController } from './controllers/institution-placements.controller';
import { PlacementDocumentsController } from './controllers/placement-documents.controller';

@Module({
  imports: [PrismaModule, NotificationsModule],
  controllers: [
    IndustryPlacementsController,
    StudentPlacementsController,
    InstitutionPlacementsController,
    PlacementDocumentsController,
  ],
  providers: [
    PlacementLifecycleService,
    PlacementOffersService,
    PlacementsService,
    PlacementDocumentsService,
  ],
  exports: [
    PlacementLifecycleService,
    PlacementOffersService,
    PlacementsService,
    PlacementDocumentsService,
  ],
})
export class PlacementsModule {}

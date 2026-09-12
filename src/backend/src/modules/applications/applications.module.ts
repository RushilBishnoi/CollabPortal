import { Module } from '@nestjs/common';
import { ApplicationsController } from './controllers/applications.controller';
import { IndustryApplicationsController } from './controllers/industry-applications.controller';
import { ApplicationsService } from './services/applications.service';
import { ApplicationLifecycleService } from './services/application-lifecycle.service';
import { ApplicationDocumentsService } from './services/application-documents.service';
import { InterviewsService } from './services/interviews.service';
import { OpportunitiesModule } from '../opportunities/opportunities.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [OpportunitiesModule, NotificationsModule],
  controllers: [ApplicationsController, IndustryApplicationsController],
  providers: [
    ApplicationsService,
    ApplicationLifecycleService,
    ApplicationDocumentsService,
    InterviewsService,
  ],
  exports: [
    ApplicationsService,
    ApplicationLifecycleService,
    ApplicationDocumentsService,
    InterviewsService,
  ],
})
export class ApplicationsModule {}

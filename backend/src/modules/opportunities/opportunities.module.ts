import { Module } from '@nestjs/common';
import { OpportunitiesService } from './services/opportunities.service';
import { OpportunityMatchingService } from './services/opportunity-matching.service';
import { OpportunitiesController } from './controllers/opportunities.controller';
import { IndustryOpportunitiesController } from './controllers/industry-opportunities.controller';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [OpportunitiesController, IndustryOpportunitiesController],
  providers: [OpportunitiesService, OpportunityMatchingService],
  exports: [OpportunitiesService, OpportunityMatchingService],
})
export class OpportunitiesModule {}

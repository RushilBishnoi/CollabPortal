import { Module } from '@nestjs/common';
import { AssessmentsController } from './controllers/assessments.controller';
import { AssessmentsService } from './services/assessments.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [AssessmentsController],
  providers: [AssessmentsService],
  exports: [AssessmentsService],
})
export class AssessmentsModule {}

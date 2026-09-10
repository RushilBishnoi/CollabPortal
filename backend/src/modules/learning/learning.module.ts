import { Module } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma.module';
import { SkillGapModule } from '../skill-gap/skill-gap.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { LearningResourcesController } from './controllers/learning-resources.controller';
import { LearningPathsController } from './controllers/learning-paths.controller';
import { StudentLearningController } from './controllers/student-learning.controller';
import { LearningResourcesService } from './services/learning-resources.service';
import { LearningPathsService } from './services/learning-paths.service';
import { StudentLearningService } from './services/student-learning.service';
import { LearningRemediationService } from './services/learning-remediation.service';

@Module({
  imports: [PrismaModule, SkillGapModule, NotificationsModule],
  controllers: [
    LearningResourcesController,
    LearningPathsController,
    StudentLearningController,
  ],
  providers: [
    LearningResourcesService,
    LearningPathsService,
    StudentLearningService,
    LearningRemediationService,
  ],
  exports: [
    LearningResourcesService,
    LearningPathsService,
    StudentLearningService,
    LearningRemediationService,
  ],
})
export class LearningModule {}

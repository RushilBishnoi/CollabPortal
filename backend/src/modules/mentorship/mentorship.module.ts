import { Module } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { MentorProfilesService } from './services/mentor-profiles.service';
import { MentorAvailabilityService } from './services/mentor-availability.service';
import { MentorshipRequestsService } from './services/mentorship-requests.service';
import { MentorshipSessionsService } from './services/mentorship-sessions.service';
import { MentorshipGoalsService } from './services/mentorship-goals.service';
import { MentorsController } from './controllers/mentors.controller';
import { MentorWorkspaceController } from './controllers/mentor-workspace.controller';
import { StudentMentorshipController } from './controllers/student-mentorship.controller';
import { MentorshipSessionsController } from './controllers/mentorship-sessions.controller';

@Module({
  imports: [PrismaModule, NotificationsModule],
  controllers: [
    MentorsController,
    MentorWorkspaceController,
    StudentMentorshipController,
    MentorshipSessionsController,
  ],
  providers: [
    MentorProfilesService,
    MentorAvailabilityService,
    MentorshipRequestsService,
    MentorshipSessionsService,
    MentorshipGoalsService,
  ],
  exports: [
    MentorProfilesService,
    MentorAvailabilityService,
    MentorshipRequestsService,
    MentorshipSessionsService,
    MentorshipGoalsService,
  ],
})
export class MentorshipModule {}

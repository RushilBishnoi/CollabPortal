import { Module } from '@nestjs/common';
import { StudentProfilesController } from './controllers/student-profiles.controller';
import { StudentProfilesService } from './services/student-profiles.service';
import { FacultyProfilesController } from './controllers/faculty-profiles.controller';
import { FacultyProfilesService } from './services/faculty-profiles.service';
import { IndustryProfilesController } from './controllers/industry-profiles.controller';
import { IndustryProfilesService } from './services/industry-profiles.service';
import { InstitutionProfilesController } from './controllers/institution-profiles.controller';
import { InstitutionProfilesService } from './services/institution-profiles.service';

@Module({
  controllers: [
    StudentProfilesController,
    FacultyProfilesController,
    IndustryProfilesController,
    InstitutionProfilesController,
  ],
  providers: [
    StudentProfilesService,
    FacultyProfilesService,
    IndustryProfilesService,
    InstitutionProfilesService,
  ],
  exports: [
    StudentProfilesService,
    FacultyProfilesService,
    IndustryProfilesService,
    InstitutionProfilesService,
  ],
})
export class ProfilesModule {}

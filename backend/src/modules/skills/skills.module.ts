import { Module } from '@nestjs/common';
import { SkillsController } from './controllers/skills.controller';
import { StudentSkillsController } from './controllers/student-skills.controller';
import { SkillsService } from './services/skills.service';
import { StudentSkillsService } from './services/student-skills.service';

@Module({
  controllers: [SkillsController, StudentSkillsController],
  providers: [SkillsService, StudentSkillsService],
  exports: [SkillsService, StudentSkillsService],
})
export class SkillsModule {}

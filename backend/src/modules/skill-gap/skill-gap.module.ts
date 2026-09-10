import { Module } from '@nestjs/common';
import { SkillGapService } from './services/skill-gap.service';
import { SkillGapsController } from './controllers/skill-gaps.controller';
import { CareerRecommendationsController } from './controllers/career-recommendations.controller';

@Module({
  controllers: [SkillGapsController, CareerRecommendationsController],
  providers: [SkillGapService],
  exports: [SkillGapService],
})
export class SkillGapModule {}

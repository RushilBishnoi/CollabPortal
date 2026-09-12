import { Module, NestModule, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './database/prisma.module';
import { HealthModule } from './modules/health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { RbacModule } from './modules/rbac/rbac.module';
import { ProfilesModule } from './modules/profiles/profiles.module';
import { SkillsModule } from './modules/skills/skills.module';
import { AssessmentsModule } from './modules/assessments/assessments.module';
import { CareerRolesModule } from './modules/career-roles/career-roles.module';
import { SkillGapModule } from './modules/skill-gap/skill-gap.module';
import { OpportunitiesModule } from './modules/opportunities/opportunities.module';
import { ApplicationsModule } from './modules/applications/applications.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { CollaborationsModule } from './modules/collaborations/collaborations.module';
import { LearningModule } from './modules/learning/learning.module';
import { PlacementsModule } from './modules/placements/placements.module';
import { MentorshipModule } from './modules/mentorship/mentorship.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { SecurityHeadersMiddleware } from './common/middleware/security-headers.middleware';
import { CorrelationIdMiddleware } from './common/middleware/correlation-id.middleware';
import { RateLimitGuard } from './common/guards/rate-limit.guard';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { StartupDiValidatorService } from './common/services/startup-di-validator.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    PrismaModule,
    HealthModule,
    AuthModule,
    RbacModule,
    ProfilesModule,
    SkillsModule,
    AssessmentsModule,
    CareerRolesModule,
    SkillGapModule,
    OpportunitiesModule,
    ApplicationsModule,
    AnalyticsModule,
    CollaborationsModule,
    LearningModule,
    PlacementsModule,
    MentorshipModule,
    NotificationsModule,
  ],
  providers: [
    StartupDiValidatorService,
    RateLimitGuard,
    {
      provide: APP_GUARD,
      useClass: RateLimitGuard,
    },
    JwtAuthGuard,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(CorrelationIdMiddleware, SecurityHeadersMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}


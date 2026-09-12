import { describe, it, expect, beforeAll } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { JwtAuthGuard } from '../src/common/guards/jwt-auth.guard';
import { RateLimitGuard } from '../src/common/guards/rate-limit.guard';
import { RolesGuard } from '../src/common/guards/roles.guard';
import { AuthController } from '../src/modules/auth/auth.controller';
import { AuthService } from '../src/modules/auth/auth.service';
import { JwtStrategy } from '../src/modules/auth/strategies/jwt.strategy';
import { HealthController } from '../src/modules/health/health.controller';
import { HealthService } from '../src/modules/health/health.service';
import { OpportunitiesController } from '../src/modules/opportunities/controllers/opportunities.controller';
import { OpportunitiesService } from '../src/modules/opportunities/services/opportunities.service';
import { OpportunityMatchingService } from '../src/modules/opportunities/services/opportunity-matching.service';
import { CollaborationsController } from '../src/modules/collaborations/controllers/collaborations.controller';
import { CollaborationsService } from '../src/modules/collaborations/services/collaborations.service';
import { NotificationsController } from '../src/modules/notifications/controllers/notifications.controller';
import { NotificationsService } from '../src/modules/notifications/services/notifications.service';
import { ParticipationService } from '../src/modules/collaborations/services/participation.service';
import { StartupDiValidatorService } from '../src/common/services/startup-di-validator.service';

describe('NestJS Container Dependency Resolution Audit & Tests', () => {
  let moduleRef: TestingModule;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
  });

  it('should compile AppModule without DI resolution errors', () => {
    expect(moduleRef).toBeDefined();
  });

  it('should resolve StartupDiValidatorService from Nest container', () => {
    const validator = moduleRef.get(StartupDiValidatorService);
    expect(validator).toBeDefined();
    expect(typeof validator.onApplicationBootstrap).toBe('function');
  });

  it('should execute startup validation without throwing DI errors', () => {
    const validator = moduleRef.get(StartupDiValidatorService);
    expect(() => validator.onApplicationBootstrap()).not.toThrow();
  });

  it('should resolve Reflector from Nest core container', () => {
    const reflector = moduleRef.get(Reflector);
    expect(reflector).toBeDefined();
    expect(typeof reflector.getAllAndOverride).toBe('function');
  });

  it('should resolve RateLimitGuard provider and verify Reflector dependency', () => {
    const rateLimitGuard = moduleRef.get(RateLimitGuard);
    expect(rateLimitGuard).toBeDefined();
    expect(rateLimitGuard).toBeInstanceOf(RateLimitGuard);
    const reflector = (rateLimitGuard as any).reflector;
    expect(reflector).toBeDefined();
    expect(typeof reflector.getAllAndOverride).toBe('function');
  });

  it('should resolve JwtAuthGuard with non-undefined Reflector dependency', () => {
    const jwtGuard = moduleRef.get(JwtAuthGuard);
    expect(jwtGuard).toBeDefined();

    const reflector = (jwtGuard as any).reflector;
    expect(reflector).toBeDefined();
    expect(typeof reflector.getAllAndOverride).toBe('function');
  });

  it('should resolve AuthController and AuthService without undefined parameters', () => {
    const controller = moduleRef.get(AuthController);
    const service = moduleRef.get(AuthService);
    expect(controller).toBeDefined();
    expect(service).toBeDefined();
    expect((controller as any).authService).toBeDefined();
    expect((service as any).prisma).toBeDefined();
  });

  it('should resolve JwtStrategy with ConfigService and PrismaService', () => {
    const strategy = moduleRef.get(JwtStrategy);
    expect(strategy).toBeDefined();
    expect((strategy as any).prisma).toBeDefined();
  });

  it('should resolve HealthController and HealthService', () => {
    const controller = moduleRef.get(HealthController);
    const service = moduleRef.get(HealthService);
    expect(controller).toBeDefined();
    expect(service).toBeDefined();
    expect((controller as any).healthService).toBeDefined();
  });

  it('should resolve OpportunitiesController, OpportunitiesService, and OpportunityMatchingService', () => {
    const controller = moduleRef.get(OpportunitiesController);
    const service = moduleRef.get(OpportunitiesService);
    const matchingService = moduleRef.get(OpportunityMatchingService);
    expect(controller).toBeDefined();
    expect(service).toBeDefined();
    expect(matchingService).toBeDefined();
    expect((controller as any).opportunitiesService).toBeDefined();
    expect((controller as any).matchingService).toBeDefined();
  });

  it('should resolve CollaborationsController, CollaborationsService, and ParticipationService', () => {
    const controller = moduleRef.get(CollaborationsController);
    const service = moduleRef.get(CollaborationsService);
    const participationService = moduleRef.get(ParticipationService);
    expect(controller).toBeDefined();
    expect(service).toBeDefined();
    expect(participationService).toBeDefined();
    expect((controller as any).collaborationsService).toBeDefined();
  });

  it('should resolve NotificationsController and NotificationsService', () => {
    const controller = moduleRef.get(NotificationsController);
    const service = moduleRef.get(NotificationsService);
    expect(controller).toBeDefined();
    expect(service).toBeDefined();
    expect((controller as any).notificationsService).toBeDefined();
  });

  it('should resolve RateLimitGuard and RolesGuard with valid Reflector dependencies', () => {
    const rateLimitGuard = moduleRef.get(RateLimitGuard);
    const rolesGuard = moduleRef.get(RolesGuard);
    expect(rateLimitGuard).toBeDefined();
    expect(rolesGuard).toBeDefined();
    expect((rateLimitGuard as any).reflector).toBeDefined();
    expect((rolesGuard as any).reflector).toBeDefined();
  });
});

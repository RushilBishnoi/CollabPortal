import { Injectable, OnApplicationBootstrap, Logger } from '@nestjs/common';
import { ModuleRef, Reflector } from '@nestjs/core';
import { RateLimitGuard } from '../guards/rate-limit.guard';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { AuthController } from '../../modules/auth/auth.controller';
import { AuthService } from '../../modules/auth/auth.service';
import { JwtStrategy } from '../../modules/auth/strategies/jwt.strategy';
import { HealthController } from '../../modules/health/health.controller';
import { HealthService } from '../../modules/health/health.service';
import { OpportunitiesController } from '../../modules/opportunities/controllers/opportunities.controller';
import { OpportunitiesService } from '../../modules/opportunities/services/opportunities.service';
import { CollaborationsController } from '../../modules/collaborations/controllers/collaborations.controller';
import { CollaborationsService } from '../../modules/collaborations/services/collaborations.service';
import { NotificationsController } from '../../modules/notifications/controllers/notifications.controller';
import { NotificationsService } from '../../modules/notifications/services/notifications.service';

@Injectable()
export class StartupDiValidatorService implements OnApplicationBootstrap {
  private readonly logger = new Logger(StartupDiValidatorService.name);

  constructor(private readonly moduleRef: ModuleRef) {}

  onApplicationBootstrap(): void {
    this.logger.log('Executing NestJS DI container infrastructure validation...');

    const criticalTokens = [
      Reflector,
      RateLimitGuard,
      JwtAuthGuard,
      RolesGuard,
      JwtStrategy,
      AuthController,
      AuthService,
      HealthController,
      HealthService,
      OpportunitiesController,
      OpportunitiesService,
      CollaborationsController,
      CollaborationsService,
      NotificationsController,
      NotificationsService,
    ];

    for (const token of criticalTokens) {
      try {
        const resolved = this.moduleRef.get(token, { strict: false });
        if (!resolved) {
          throw new Error(`Provider for token '${token.name || token}' was not resolved by Nest container.`);
        }
      } catch (err) {
        this.logger.error(
          `CRITICAL DI VALIDATION FAILURE: Failed to resolve '${token.name || token}'`,
          (err as Error).stack,
        );
        throw new Error(
          `CRITICAL DI BOOTSTRAP FAILURE: Could not resolve critical infrastructure provider '${token.name || token}'. Error: ${(err as Error).message}`,
        );
      }
    }

    // Validate RateLimitGuard resolution
    try {
      const rateLimitGuard = this.moduleRef.get(RateLimitGuard, { strict: false });
      if (!rateLimitGuard) {
        throw new Error('RateLimitGuard provider was not resolved in Nest container');
      }
    } catch (err) {
      this.logger.error(
        'CRITICAL DI VALIDATION FAILURE: Failed to resolve RateLimitGuard provider',
        (err as Error).stack,
      );
      throw new Error(
        `CRITICAL DI BOOTSTRAP FAILURE: RateLimitGuard resolution failed. Error: ${(err as Error).message}`,
      );
    }

    this.logger.log('NestJS DI container infrastructure validation PASSED successfully.');
  }
}

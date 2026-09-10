import {
  Injectable,
  Inject,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request, Response } from 'express';
import { RATE_LIMIT_KEY, RateLimitOptions } from '../decorators/rate-limit.decorator';

interface RateLimitRecord {
  count: number;
  resetTimeMs: number;
}

@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly logger = new Logger(RateLimitGuard.name);
  private static readonly store = new Map<string, RateLimitRecord>();
  private static cleanupTimer: NodeJS.Timeout | null = null;

  constructor(@Inject(Reflector) private readonly reflector: Reflector) {
    RateLimitGuard.ensureCleanupTimer();
  }

  private static ensureCleanupTimer() {
    if (!RateLimitGuard.cleanupTimer) {
      RateLimitGuard.cleanupTimer = setInterval(() => {
        const now = Date.now();
        for (const [key, record] of RateLimitGuard.store.entries()) {
          if (now > record.resetTimeMs) {
            RateLimitGuard.store.delete(key);
          }
        }
      }, 60000);
      if (RateLimitGuard.cleanupTimer.unref) {
        RateLimitGuard.cleanupTimer.unref();
      }
    }
  }

  /**
   * Reset store for unit / integration tests
   */
  public static resetStore(): void {
    RateLimitGuard.store.clear();
  }

  canActivate(context: ExecutionContext): boolean {
    const options = this.reflector.getAllAndOverride<RateLimitOptions>(
      RATE_LIMIT_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!options) {
      return true; // No rate limit configured on this handler
    }

    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();

    const clientId = this.resolveClientIdentifier(request);
    const key = `${request.method}:${request.baseUrl || ''}${request.path}:${clientId}`;
    const now = Date.now();

    const record = RateLimitGuard.store.get(key);

    if (!record || now >= record.resetTimeMs) {
      // Initialize or reset window
      RateLimitGuard.store.set(key, {
        count: 1,
        resetTimeMs: now + options.durationSeconds * 1000,
      });
      return true;
    }

    if (record.count >= options.points) {
      const retryAfterSeconds = Math.max(1, Math.ceil((record.resetTimeMs - now) / 1000));
      response.setHeader('Retry-After', retryAfterSeconds.toString());
      response.setHeader('X-RateLimit-Limit', options.points.toString());
      response.setHeader('X-RateLimit-Remaining', '0');
      response.setHeader('X-RateLimit-Reset', Math.ceil(record.resetTimeMs / 1000).toString());

      this.logger.warn(
        `Rate limit exceeded for client '${clientId}' on '${request.method} ${request.url}'. Blocked for ${retryAfterSeconds}s.`,
      );

      throw new HttpException(
        options.errorMessage ||
          `Too many requests. You have exceeded the rate limit of ${options.points} requests per ${options.durationSeconds} seconds. Please try again in ${retryAfterSeconds} second(s).`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    record.count++;
    response.setHeader('X-RateLimit-Limit', options.points.toString());
    response.setHeader('X-RateLimit-Remaining', (options.points - record.count).toString());
    response.setHeader('X-RateLimit-Reset', Math.ceil(record.resetTimeMs / 1000).toString());

    return true;
  }

  private resolveClientIdentifier(request: Request): string {
    // If authenticated, use user ID as primary identifier
    const user = (request as any).user;
    if (user && user.id) {
      return `user:${user.id}`;
    }

    // Otherwise use client IP
    const forwarded = request.headers['x-forwarded-for'];
    if (typeof forwarded === 'string') {
      return `ip:${forwarded.split(',')[0].trim()}`;
    } else if (Array.isArray(forwarded) && forwarded.length > 0) {
      return `ip:${forwarded[0].trim()}`;
    }

    return `ip:${request.ip || request.socket.remoteAddress || '127.0.0.1'}`;
  }
}

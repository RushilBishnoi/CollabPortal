import { describe, it, expect, vi } from 'vitest';
import { checkProductionEnv, validateProductionEnv } from '../src/config/env.validation';
import { HealthService } from '../src/modules/health/health.service';
import { HealthController } from '../src/modules/health/health.controller';
import { PrismaService } from '../src/database/prisma.service';
import { CorrelationIdMiddleware } from '../src/common/middleware/correlation-id.middleware';

describe('Phase 19: Production Readiness Test Suite', () => {
  describe('1. Production Environment Configuration Validation', () => {
    const validProdEnv = {
      NODE_ENV: 'production',
      DATABASE_URL: 'postgresql://prod_user:strong_password@db.internal:5432/portal?schema=public',
      JWT_ACCESS_SECRET: 'super_secure_access_token_secret_key_32_bytes_long_entropy',
      JWT_REFRESH_SECRET: 'super_secure_refresh_token_secret_key_32_bytes_different_one',
      CORS_ORIGIN: 'https://portal.institution.ac.in',
    };

    it('should pass validation with a fully valid production environment', () => {
      const result = checkProductionEnv(validProdEnv);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject missing DATABASE_URL in production', () => {
      const env = { ...validProdEnv, DATABASE_URL: undefined };
      const result = checkProductionEnv(env);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('DATABASE_URL'))).toBe(true);
    });

    it('should reject non-PostgreSQL DATABASE_URL in production', () => {
      const env = { ...validProdEnv, DATABASE_URL: 'mysql://user:pass@localhost/db' };
      const result = checkProductionEnv(env);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('PostgreSQL connection string'))).toBe(true);
    });

    it('should reject short (<32 chars) JWT_ACCESS_SECRET', () => {
      const env = { ...validProdEnv, JWT_ACCESS_SECRET: 'too-short-secret' };
      const result = checkProductionEnv(env);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('at least 32 characters'))).toBe(true);
    });

    it('should reject placeholder or default fallback JWT secrets', () => {
      const env = {
        ...validProdEnv,
        JWT_ACCESS_SECRET: 'DEFAULT_FALLBACK_DEV_SECRET_MIN_32_CHARS_LONG_KEY',
      };
      const result = checkProductionEnv(env);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('placeholder or default'))).toBe(true);
    });

    it('should reject identical JWT access and refresh secrets', () => {
      const secret = 'identical_shared_secret_string_32_characters_long_entropy';
      const env = {
        ...validProdEnv,
        JWT_ACCESS_SECRET: secret,
        JWT_REFRESH_SECRET: secret,
      };
      const result = checkProductionEnv(env);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('identical'))).toBe(true);
    });

    it('should reject wildcard (*) CORS_ORIGIN in production', () => {
      const env = { ...validProdEnv, CORS_ORIGIN: '*' };
      const result = checkProductionEnv(env);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('wildcard (*) is strictly prohibited'))).toBe(true);
    });

    it('should reject missing CORS_ORIGIN in production', () => {
      const env = { ...validProdEnv, CORS_ORIGIN: undefined, FRONTEND_URL: undefined };
      const result = checkProductionEnv(env);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('CORS_ORIGIN'))).toBe(true);
    });

    it('should bypass production validation in development/test environments', () => {
      // validateProductionEnv must return cleanly without throwing or exiting
      expect(() => {
        validateProductionEnv({ NODE_ENV: 'test' });
      }).not.toThrow();
    });
  });

  describe('2. Health & Readiness Probes (Zero-Leakage & Semantic Correctness)', () => {
    it('should return 200 on liveness probe with process uptime and ISO timestamp', () => {
      const mockPrisma = { isHealthy: vi.fn() } as unknown as PrismaService;
      const service = new HealthService(mockPrisma);
      const controller = new HealthController(service);

      const live = controller.getLiveness();
      expect(live.status).toBe('ok');
      expect(typeof live.uptime).toBe('number');
      expect(new Date(live.timestamp).getTime()).not.toBeNaN();
    });

    it('should return HTTP 200 on readiness probe when database is available', async () => {
      const mockPrisma = {
        isHealthy: vi.fn().mockResolvedValue(true),
      } as unknown as PrismaService;
      const service = new HealthService(mockPrisma);
      const controller = new HealthController(service);

      const mockJson = vi.fn();
      const mockStatus = vi.fn().mockReturnValue({ json: mockJson });
      const mockRes: any = { status: mockStatus, json: mockJson };

      await controller.getReadiness(mockRes);

      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith(expect.objectContaining({
        status: 'ready',
        database: 'connected',
      }));
    });

    it('should return HTTP 503 on readiness probe when database is disconnected', async () => {
      const mockPrisma = {
        isHealthy: vi.fn().mockResolvedValue(false),
      } as unknown as PrismaService;
      const service = new HealthService(mockPrisma);
      const controller = new HealthController(service);

      const mockJson = vi.fn();
      const mockStatus = vi.fn().mockReturnValue({ json: mockJson });
      const mockRes: any = { status: mockStatus, json: mockJson };

      await controller.getReadiness(mockRes);

      expect(mockStatus).toHaveBeenCalledWith(503);
      expect(mockJson).toHaveBeenCalledWith(expect.objectContaining({
        status: 'unready',
        database: 'disconnected',
      }));
    });

    it('should never expose sensitive database URLs or internal credentials in health payload', async () => {
      const mockPrisma = {
        isHealthy: vi.fn().mockResolvedValue(true),
      } as unknown as PrismaService;
      const service = new HealthService(mockPrisma);
      const controller = new HealthController(service);

      const health = await controller.getHealth();
      const healthString = JSON.stringify(health);

      expect(healthString).not.toContain('postgresql://');
      expect(healthString).not.toContain('password');
      expect(healthString).not.toContain('localhost');
      expect(healthString).not.toContain('secret');
    });
  });

  describe('3. Request Correlation ID & Observability', () => {
    it('should generate a UUID correlation ID when none is provided in headers', () => {
      const middleware = new CorrelationIdMiddleware();
      const req: any = { headers: {}, on: vi.fn() };
      const res: any = { setHeader: vi.fn(), on: vi.fn() };
      const next = vi.fn();

      middleware.use(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.correlationId).toBeDefined();
      expect(res.setHeader).toHaveBeenCalledWith('X-Correlation-ID', req.correlationId);
      // UUID v4 format: 8-4-4-4-12 hex digits
      expect(req.correlationId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    });

    it('should preserve and propagate upstream X-Correlation-ID when provided', () => {
      const middleware = new CorrelationIdMiddleware();
      const upstreamId = 'gateway-trace-id-99887766';
      const req: any = { headers: { 'x-correlation-id': upstreamId }, on: vi.fn() };
      const res: any = { setHeader: vi.fn(), on: vi.fn() };
      const next = vi.fn();

      middleware.use(req, res, next);

      expect(req.correlationId).toBe(upstreamId);
      expect(res.setHeader).toHaveBeenCalledWith('X-Correlation-ID', upstreamId);
    });
  });
});

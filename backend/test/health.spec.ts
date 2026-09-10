import { describe, it, expect, vi } from 'vitest';
import { HealthService } from '../src/modules/health/health.service';
import { HealthController } from '../src/modules/health/health.controller';
import { PrismaService } from '../src/database/prisma.service';

describe('Health Module Unit Tests', () => {
  it('should return health status as ok when database is healthy', async () => {
    const mockPrismaService = {
      isHealthy: vi.fn().mockResolvedValue(true),
    } as unknown as PrismaService;

    const healthService = new HealthService(mockPrismaService);
    const controller = new HealthController(healthService);

    const result = await controller.getHealth();

    expect(result.status).toBe('ok');
    expect(result.version).toBe('1.0.0');
    expect(result.services.database.status).toBe('connected');
    expect(result.uptime).toBeGreaterThanOrEqual(0);
    expect(result.timestamp).toBeDefined();
  });

  it('should return health status as degraded when database is unreachable', async () => {
    const mockPrismaService = {
      isHealthy: vi.fn().mockResolvedValue(false),
    } as unknown as PrismaService;

    const healthService = new HealthService(mockPrismaService);
    const controller = new HealthController(healthService);

    const result = await controller.getHealth();

    expect(result.status).toBe('degraded');
    expect(result.services.database.status).toBe('disconnected');
  });

  it('should return liveness data with uptime', () => {
    const mockPrismaService = {
      isHealthy: vi.fn().mockResolvedValue(true),
    } as unknown as PrismaService;

    const healthService = new HealthService(mockPrismaService);
    const result = healthService.liveness();

    expect(result.status).toBe('ok');
    expect(result.uptime).toBeGreaterThanOrEqual(0);
    expect(result.timestamp).toBeDefined();
  });

  it('should return ready status when database is healthy', async () => {
    const mockPrismaService = {
      isHealthy: vi.fn().mockResolvedValue(true),
    } as unknown as PrismaService;

    const healthService = new HealthService(mockPrismaService);
    const result = await healthService.readiness();

    expect(result.status).toBe('ready');
    expect(result.database).toBe('connected');
    expect(result.timestamp).toBeDefined();
  });

  it('should return unready status when database is unavailable', async () => {
    const mockPrismaService = {
      isHealthy: vi.fn().mockResolvedValue(false),
    } as unknown as PrismaService;

    const healthService = new HealthService(mockPrismaService);
    const result = await healthService.readiness();

    expect(result.status).toBe('unready');
    expect(result.database).toBe('disconnected');
  });

  describe('Health Module Dependency Injection Regression Tests', () => {
    it('should have explicit @Inject metadata on HealthController constructor parameter', () => {
      const selfMetadata = Reflect.getMetadata('self:paramtypes', HealthController);
      expect(selfMetadata).toBeDefined();
      expect(Array.isArray(selfMetadata)).toBe(true);
      expect(selfMetadata.some((param: any) => param.index === 0 && param.param === HealthService)).toBe(true);
    });

    it('should have explicit @Inject metadata on HealthService constructor parameter', () => {
      const selfMetadata = Reflect.getMetadata('self:paramtypes', HealthService);
      expect(selfMetadata).toBeDefined();
      expect(Array.isArray(selfMetadata)).toBe(true);
      expect(selfMetadata.some((param: any) => param.index === 0 && param.param === PrismaService)).toBe(true);
    });

    it('would throw TypeError if HealthController constructed with undefined HealthService', async () => {
      const brokenController = new HealthController(undefined as unknown as HealthService);
      await expect(brokenController.getHealth()).rejects.toThrow(TypeError);
    });
  });
});

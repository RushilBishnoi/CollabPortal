import { describe, it, expect, vi } from 'vitest';
import { AuthController } from '../src/modules/auth/auth.controller';
import { AuthService } from '../src/modules/auth/auth.service';
import { PrismaService } from '../src/database/prisma.service';
import { RegisterDto } from '../src/modules/auth/dto/register.dto';
import { UserRole } from '@prisma/client';

describe('Auth Module Dependency Injection Regression Tests', () => {
  it('should have explicit @Inject metadata on AuthController constructor parameter', () => {
    // NestJS records @Inject metadata in 'self:paramtypes'
    const selfMetadata = Reflect.getMetadata('self:paramtypes', AuthController);
    expect(selfMetadata).toBeDefined();
    expect(Array.isArray(selfMetadata)).toBe(true);
    expect(selfMetadata.some((param: any) => param.index === 0 && param.param === AuthService)).toBe(true);
  });

  it('should have explicit @Inject metadata on AuthService constructor parameters', () => {
    const selfMetadata = Reflect.getMetadata('self:paramtypes', AuthService);
    expect(selfMetadata).toBeDefined();
    expect(Array.isArray(selfMetadata)).toBe(true);
    expect(selfMetadata.some((param: any) => param.index === 0 && param.param === PrismaService)).toBe(true);
  });

  it('should correctly invoke AuthService.register when AuthController.register is called with valid DI instance', async () => {
    const mockAuthService = {
      register: vi.fn().mockResolvedValue({
        user: {
          id: 'user-di-test-1',
          email: 'di-test@example.com',
          role: UserRole.STUDENT,
          isEmailVerified: false,
          avatarUrl: null,
        },
        tokens: {
          accessToken: 'mock.access.token',
          refreshToken: 'mock.refresh.token',
          expiresIn: '15m',
        },
      }),
    } as unknown as AuthService;

    // Instantiate AuthController passing the AuthService (simulating Nest DI parameter injection)
    const controller = new AuthController(mockAuthService);

    const dto: RegisterDto = {
      fullName: 'DI Test User',
      email: 'di-test@example.com',
      password: 'TestPassword123!',
      role: UserRole.STUDENT,
    };

    const response = await controller.register(dto);

    expect(mockAuthService.register).toHaveBeenCalledTimes(1);
    expect(mockAuthService.register).toHaveBeenCalledWith(dto);
    expect(response.user.email).toBe('di-test@example.com');
  });

  it('would throw TypeError if constructed with undefined AuthService', async () => {
    // Verifies that if DI fails and authService is undefined, controller.register fails as observed in the bug report
    const brokenController = new AuthController(undefined as unknown as AuthService);
    const dto: RegisterDto = {
      fullName: 'DI Test User',
      email: 'di-test@example.com',
      password: 'TestPassword123!',
      role: UserRole.STUDENT,
    };

    await expect(brokenController.register(dto)).rejects.toThrow(
      TypeError,
    );
  });
});

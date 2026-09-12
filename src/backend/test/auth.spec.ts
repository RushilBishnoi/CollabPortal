import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { AuthService } from '../src/modules/auth/auth.service';
import { PrismaService } from '../src/database/prisma.service';
import { RegisterDto } from '../src/modules/auth/dto/register.dto';
import { UserRole } from '@prisma/client';

describe('AuthService Unit & Security Tests', () => {
  let authService: AuthService;
  let prismaMock: any;
  let jwtServiceMock: any;
  let configServiceMock: any;

  beforeEach(() => {
    prismaMock = {
      user: {
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
      refreshToken: {
        create: vi.fn().mockResolvedValue({ id: 'token-1' }),
        findUnique: vi.fn(),
        update: vi.fn().mockResolvedValue({}),
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
    };

    jwtServiceMock = {
      signAsync: vi.fn().mockResolvedValue('mocked.jwt.token'),
      verify: vi.fn(),
    };

    configServiceMock = {
      get: vi.fn((key: string) => {
        if (key === 'JWT_ACCESS_SECRET') return 'test_access_secret_key_min_32_chars';
        if (key === 'JWT_REFRESH_SECRET') return 'test_refresh_secret_key_min_32_chars';
        return null;
      }),
    };

    authService = new AuthService(
      prismaMock as unknown as PrismaService,
      jwtServiceMock as unknown as JwtService,
      configServiceMock as unknown as ConfigService,
    );
  });

  describe('register', () => {
    it('should successfully hash password and register a student with valid full name', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);
      prismaMock.user.create.mockResolvedValue({
        id: 'user-uuid-1',
        email: 'student@uni.edu',
        role: UserRole.STUDENT,
        isEmailVerified: false,
        avatarUrl: null,
      });

      const result = await authService.register({
        fullName: 'Alice Walker',
        email: 'STUDENT@UNI.EDU',
        password: 'Password@123',
        role: UserRole.STUDENT,
      });

      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'student@uni.edu' },
      });

      expect(prismaMock.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            email: 'student@uni.edu',
            role: UserRole.STUDENT,
            status: 'ACTIVE',
          }),
        }),
      );

      // Verify that created password is a valid bcrypt hash, NOT plaintext
      const createdCall = prismaMock.user.create.mock.calls[0][0];
      expect(createdCall.data.passwordHash).not.toBe('Password@123');
      expect(createdCall.data.passwordHash.startsWith('$2')).toBe(true);

      expect(result.user.email).toBe('student@uni.edu');
      expect(result.tokens.accessToken).toBe('mocked.jwt.token');
    });

    it('should throw ConflictException if email is already registered', async () => {
      prismaMock.user.findUnique.mockResolvedValue({ id: 'existing-1', email: 'taken@uni.edu' });

      await expect(
        authService.register({
          fullName: 'Alice Walker',
          email: 'taken@uni.edu',
          password: 'Password@123',
          role: UserRole.STUDENT,
        }),
      ).rejects.toThrow(ConflictException);
    });

    describe('Full Name Required Validation across all roles', () => {
      it('should reject registration when fullName is empty', async () => {
        await expect(
          authService.register({
            fullName: '',
            email: 'newuser@uni.edu',
            password: 'Password@123',
            role: UserRole.STUDENT,
          }),
        ).rejects.toThrow(BadRequestException);
      });

      it('should reject registration when fullName is whitespace-only', async () => {
        await expect(
          authService.register({
            fullName: '    ',
            email: 'newuser@uni.edu',
            password: 'Password@123',
            role: UserRole.STUDENT,
          }),
        ).rejects.toThrow(BadRequestException);
      });

      it('should reject registration when fullName is missing/undefined', async () => {
        await expect(
          authService.register({
            fullName: undefined as unknown as string,
            email: 'newuser@uni.edu',
            password: 'Password@123',
            role: UserRole.STUDENT,
          }),
        ).rejects.toThrow(BadRequestException);
      });

      it('should trim surrounding whitespace from fullName and succeed', async () => {
        prismaMock.user.findUnique.mockResolvedValue(null);
        prismaMock.user.create.mockResolvedValue({
          id: 'user-trimmed-1',
          email: 'ananya@uni.edu',
          role: UserRole.STUDENT,
          isEmailVerified: false,
          avatarUrl: null,
        });

        const dto: RegisterDto = {
          fullName: '   Ananya Sharma   ',
          email: 'ananya@uni.edu',
          password: 'Password@123',
          role: UserRole.STUDENT,
        };

        const result = await authService.register(dto);
        expect(result.user.email).toBe('ananya@uni.edu');
        expect(dto.fullName).toBe('Ananya Sharma');
      });

      it('should enforce full name requirement equally across all registration roles', async () => {
        const roles = [
          UserRole.STUDENT,
          UserRole.FACULTY,
          UserRole.INDUSTRY,
          UserRole.INSTITUTION_ADMIN,
        ];

        for (const role of roles) {
          // Empty full name must be rejected for this role
          await expect(
            authService.register({
              fullName: '',
              email: `${role.toLowerCase()}@uni.edu`,
              password: 'Password@123',
              role,
            }),
          ).rejects.toThrow(BadRequestException);

          // Whitespace-only full name must be rejected for this role
          await expect(
            authService.register({
              fullName: '   \t  ',
              email: `${role.toLowerCase()}@uni.edu`,
              password: 'Password@123',
              role,
            }),
          ).rejects.toThrow(BadRequestException);

          // Valid full name must succeed for this role
          prismaMock.user.findUnique.mockResolvedValue(null);
          prismaMock.user.create.mockResolvedValue({
            id: `user-${role}`,
            email: `${role.toLowerCase()}@uni.edu`,
            role,
            isEmailVerified: false,
            avatarUrl: null,
          });

          const res = await authService.register({
            fullName: 'Ananya Sharma',
            email: `${role.toLowerCase()}@uni.edu`,
            password: 'Password@123',
            role,
          });
          expect(res.user.role).toBe(role);
        }
      });

      it('should validate RegisterDto class-validator constraints', async () => {
        // Missing fullName
        const missingDto = plainToInstance(RegisterDto, {
          email: 'user@uni.edu',
          password: 'Password@123',
          role: UserRole.STUDENT,
        });
        const missingErrors = await validate(missingDto);
        expect(missingErrors.some((e) => e.property === 'fullName')).toBe(true);

        // Whitespace-only fullName (trimmed by Transform to empty string)
        const whitespaceDto = plainToInstance(RegisterDto, {
          fullName: '    ',
          email: 'user@uni.edu',
          password: 'Password@123',
          role: UserRole.STUDENT,
        });
        const whitespaceErrors = await validate(whitespaceDto);
        expect(whitespaceErrors.some((e) => e.property === 'fullName')).toBe(true);

        // Valid fullName
        const validDto = plainToInstance(RegisterDto, {
          fullName: '  Ananya Sharma  ',
          email: 'user@uni.edu',
          password: 'Password@123',
          role: UserRole.STUDENT,
        });
        const validErrors = await validate(validDto);
        expect(validErrors.some((e) => e.property === 'fullName')).toBe(false);
        expect(validDto.fullName).toBe('Ananya Sharma');
      });
    });
  });

  describe('login', () => {
    it('should successfully authenticate user with correct password', async () => {
      const passwordHash = await bcrypt.hash('Secret@123', 10);
      prismaMock.user.findUnique.mockResolvedValue({
        id: 'user-uuid-1',
        email: 'user@uni.edu',
        passwordHash,
        role: UserRole.STUDENT,
        status: 'ACTIVE',
        isEmailVerified: true,
        avatarUrl: null,
      });
      prismaMock.user.update.mockResolvedValue({});

      const result = await authService.login({
        email: 'user@uni.edu',
        password: 'Secret@123',
      });

      expect(result.user.id).toBe('user-uuid-1');
      expect(result.tokens.accessToken).toBe('mocked.jwt.token');
    });

    it('should throw UnauthorizedException if password is incorrect', async () => {
      const passwordHash = await bcrypt.hash('Correct@123', 10);
      prismaMock.user.findUnique.mockResolvedValue({
        id: 'user-uuid-1',
        email: 'user@uni.edu',
        passwordHash,
        status: 'ACTIVE',
      });
      prismaMock.user.update.mockResolvedValue({});

      await expect(
        authService.login({
          email: 'user@uni.edu',
          password: 'WrongPassword@123',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if user does not exist', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      await expect(
        authService.login({
          email: 'nonexistent@uni.edu',
          password: 'Password@123',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if account is suspended', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: 'user-suspended-1',
        email: 'suspended@uni.edu',
        passwordHash: 'hash',
        status: 'SUSPENDED',
      });

      await expect(
        authService.login({
          email: 'suspended@uni.edu',
          password: 'Password@123',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should reject login if account is temporarily locked due to brute force attempts', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: 'user-locked-1',
        email: 'locked@uni.edu',
        passwordHash: 'hash',
        status: 'ACTIVE',
        lockedUntil: new Date(Date.now() + 10 * 60 * 1000), // locked for 10 more minutes
      });

      await expect(
        authService.login({
          email: 'locked@uni.edu',
          password: 'Password@123',
        }),
      ).rejects.toThrow(/temporarily locked/i);
    });
  });

  describe('refresh', () => {
    it('should rotate refresh token and return fresh tokens', async () => {
      jwtServiceMock.verify.mockReturnValue({
        sub: 'user-1',
        email: 'user@uni.edu',
        role: UserRole.STUDENT,
      });

      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 5);

      prismaMock.refreshToken.findUnique.mockResolvedValue({
        id: 'token-rec-1',
        userId: 'user-1',
        tokenHash: 'hash123',
        expiresAt: futureDate,
        revokedAt: null,
        user: {
          id: 'user-1',
          email: 'user@uni.edu',
          role: UserRole.STUDENT,
          status: 'ACTIVE',
        },
      });

      prismaMock.refreshToken.update.mockResolvedValue({});

      const result = await authService.refresh({ refreshToken: 'valid.refresh.token' });

      expect(prismaMock.refreshToken.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'token-rec-1' },
          data: expect.objectContaining({ revokedAt: expect.any(Date) }),
        }),
      );

      expect(result.accessToken).toBe('mocked.jwt.token');
    });

    it('should reject already revoked refresh tokens (theft detection)', async () => {
      jwtServiceMock.verify.mockReturnValue({
        sub: 'user-1',
        email: 'user@uni.edu',
        role: UserRole.STUDENT,
      });

      prismaMock.refreshToken.findUnique.mockResolvedValue({
        id: 'token-rec-1',
        userId: 'user-1',
        revokedAt: new Date(Date.now() - 10000), // already revoked!
        expiresAt: new Date(Date.now() + 100000),
        user: { id: 'user-1', status: 'ACTIVE' },
      });

      await expect(
        authService.refresh({ refreshToken: 'stolen.refresh.token' }),
      ).rejects.toThrow(/already been used and revoked/i);
    });
  });
});

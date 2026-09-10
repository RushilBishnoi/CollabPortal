import {
  Injectable,
  Inject,
  UnauthorizedException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { PrismaService } from '../../database/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import {
  AuthResponseData,
  AuthTokens,
  AuthenticatedUser,
  JwtPayload,
} from './interfaces/jwt-payload.interface';
import { UserRole } from '@prisma/client';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(JwtService) private readonly jwtService: JwtService,
    @Inject(ConfigService) private readonly configService: ConfigService,
  ) {}

  /**
   * Register a new user persona (STUDENT, FACULTY, INDUSTRY, INSTITUTION_ADMIN)
   */
  async register(dto: RegisterDto): Promise<AuthResponseData> {
    // Prevent privilege escalation: SUPER_ADMIN cannot be self-registered
    if (dto.role === UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Registration for the SUPER_ADMIN role is not permitted');
    }

    // Enforce required full name for all registration roles (reject empty / whitespace-only)
    const trimmedFullName = typeof dto.fullName === 'string' ? dto.fullName.trim() : '';
    if (!trimmedFullName || trimmedFullName.length === 0) {
      throw new BadRequestException('Full name is required');
    }
    dto.fullName = trimmedFullName;

    const normalizedEmail = dto.email.toLowerCase().trim();

    try {
      const existingUser = await this.prisma.user.findUnique({
        where: { email: normalizedEmail },
      });

      if (existingUser) {
        throw new ConflictException('An account with this email already exists');
      }

      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(dto.password, saltRounds);

      const user = await this.prisma.user.create({
        data: {
          email: normalizedEmail,
          passwordHash,
          role: dto.role,
          status: 'ACTIVE',
          isEmailVerified: false,
        },
        select: {
          id: true,
          email: true,
          role: true,
          isEmailVerified: true,
          avatarUrl: true,
        },
      });

      // Auto-populate initial profile with registered Full Name where applicable
      if (dto.role === UserRole.STUDENT && this.prisma.studentProfile?.create) {
        await this.prisma.studentProfile.create({
          data: {
            userId: user.id,
            fullName: trimmedFullName,
          },
        }).catch((err) => {
          this.logger.warn(`Could not auto-create student profile on registration: ${err.message}`);
        });
      } else if (dto.role === UserRole.FACULTY && this.prisma.facultyProfile?.create) {
        await this.prisma.facultyProfile.create({
          data: {
            userId: user.id,
            fullName: trimmedFullName,
          },
        }).catch((err) => {
          this.logger.warn(`Could not auto-create faculty profile on registration: ${err.message}`);
        });
      }

      const tokens = await this.generateTokens(user.id, user.email, user.role);
      await this.saveRefreshToken(user.id, tokens.refreshToken);

      return {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          isEmailVerified: user.isEmailVerified,
          avatarUrl: user.avatarUrl,
        },
        tokens,
      };
    } catch (error) {
      if (
        error instanceof ConflictException ||
        error instanceof BadRequestException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      this.logger.error(`Registration error: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Authenticate user with credentials
   */
  async login(dto: LoginDto): Promise<AuthResponseData> {
    const normalizedEmail = dto.email.toLowerCase().trim();

    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      // Timing attack mitigation: Perform dummy bcrypt compare to equalize processing time
      await bcrypt.compare(
        dto.password,
        '$2a$12$e8YQz32ZzGq/iE5W1c3G8e5F1V3.H4u6O5h7B8j9k0l1m2n3o4p5q',
      );
      throw new UnauthorizedException('Invalid email or password');
    }

    if (user.status === 'SUSPENDED') {
      throw new UnauthorizedException(
        'Your account has been suspended. Please contact platform support.',
      );
    }

    if (user.status === 'INACTIVE') {
      throw new UnauthorizedException(
        'Your account is currently inactive. Please contact your administrator.',
      );
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const remainingMinutes = Math.ceil(
        (user.lockedUntil.getTime() - Date.now()) / (60 * 1000),
      );
      throw new UnauthorizedException(
        `Account is temporarily locked due to multiple failed login attempts. Please try again in ${remainingMinutes} minute(s).`,
      );
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      const nextFailedAttempts = (user.failedLoginAttempts || 0) + 1;
      const willLock = nextFailedAttempts >= 5;
      const lockedUntilDate = willLock
        ? new Date(Date.now() + 15 * 60 * 1000) // 15-minute lockout
        : null;

      await this.prisma.user
        .update({
          where: { id: user.id },
          data: {
            failedLoginAttempts: nextFailedAttempts,
            lockedUntil: lockedUntilDate,
          },
        })
        .catch(() => null);

      if (willLock) {
        throw new UnauthorizedException(
          'Account has been temporarily locked for 15 minutes due to 5 consecutive failed login attempts.',
        );
      }

      throw new UnauthorizedException('Invalid email or password');
    }

    // Reset failed attempts and update lastLoginAt upon successful authentication
    await this.prisma.user
      .update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: 0,
          lockedUntil: null,
          lastLoginAt: new Date(),
        },
      })
      .catch(() => null);

    const tokens = await this.generateTokens(user.id, user.email, user.role);
    await this.saveRefreshToken(user.id, tokens.refreshToken);

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        avatarUrl: user.avatarUrl,
      },
      tokens,
    };
  }

  /**
   * Exchange a valid refresh token for a new access & refresh token pair (Token Rotation)
   */
  async refresh(dto: RefreshTokenDto): Promise<AuthTokens> {
    const refreshTokenSecret = this.getRefreshSecret();

    try {
      this.jwtService.verify<JwtPayload>(dto.refreshToken, {
        secret: refreshTokenSecret,
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const tokenHash = this.hashToken(dto.refreshToken);

    const tokenRecord = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!tokenRecord) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Token reuse / theft detection: If a revoked token is presented, revoke all sessions
    if (tokenRecord.revokedAt !== null) {
      this.logger.warn(
        `Revoked refresh token reuse detected for user ${tokenRecord.userId}. Revoking all sessions.`,
      );
      await this.prisma.refreshToken
        .updateMany({
          where: { userId: tokenRecord.userId, revokedAt: null },
          data: { revokedAt: new Date() },
        })
        .catch(() => null);

      throw new UnauthorizedException(
        'Refresh token has already been used and revoked. Please sign in again.',
      );
    }

    if (tokenRecord.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token has expired');
    }

    if (
      tokenRecord.user.status === 'SUSPENDED' ||
      tokenRecord.user.status === 'INACTIVE'
    ) {
      throw new UnauthorizedException('Account is no longer active');
    }

    // Revoke old refresh token (rotation)
    await this.prisma.refreshToken.update({
      where: { id: tokenRecord.id },
      data: { revokedAt: new Date() },
    });

    // Generate new token pair
    const tokens = await this.generateTokens(
      tokenRecord.userId,
      tokenRecord.user.email,
      tokenRecord.user.role,
    );

    await this.saveRefreshToken(tokenRecord.userId, tokens.refreshToken);

    return tokens;
  }

  /**
   * Log out and revoke refresh token
   */
  async logout(userId: string, refreshToken?: string): Promise<{ success: boolean; message: string }> {
    if (refreshToken) {
      const tokenHash = this.hashToken(refreshToken);
      await this.prisma.refreshToken
        .updateMany({
          where: { userId, tokenHash, revokedAt: null },
          data: { revokedAt: new Date() },
        })
        .catch(() => null);
    } else {
      // Revoke all active refresh tokens for user
      await this.prisma.refreshToken
        .updateMany({
          where: { userId, revokedAt: null },
          data: { revokedAt: new Date() },
        })
        .catch(() => null);
    }

    return {
      success: true,
      message: 'Successfully logged out',
    };
  }

  /**
   * Retrieve current user profile
   */
  async getMe(userId: string): Promise<AuthenticatedUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        isEmailVerified: true,
        avatarUrl: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }

  /**
   * Generate access token and refresh token
   */
  private async generateTokens(
    userId: string,
    email: string,
    role: UserRole,
  ): Promise<AuthTokens> {
    const payload: JwtPayload = { sub: userId, email, role };

    const accessSecret = this.getAccessSecret();
    const accessExpiration =
      this.configService.get<string>('JWT_ACCESS_EXPIRATION') || '15m';

    const refreshSecret = this.getRefreshSecret();
    const refreshExpiration =
      this.configService.get<string>('JWT_REFRESH_EXPIRATION') || '7d';

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: accessSecret,
        expiresIn: accessExpiration,
      }),
      this.jwtService.signAsync(payload, {
        secret: refreshSecret,
        expiresIn: refreshExpiration,
      }),
    ]);

    return {
      accessToken,
      refreshToken,
      expiresIn: accessExpiration,
    };
  }

  public getAccessSecret(): string {
    const secret = this.configService.get<string>('JWT_ACCESS_SECRET');
    if (process.env.NODE_ENV === 'production') {
      if (!secret || secret.length < 32 || secret.startsWith('DEFAULT_FALLBACK')) {
        throw new Error(
          'CRITICAL SECURITY CONFIGURATION: JWT_ACCESS_SECRET must be explicitly configured and at least 32 characters long in production.',
        );
      }
      return secret;
    }
    return secret || 'DEFAULT_FALLBACK_DEV_SECRET_MIN_32_CHARS_LONG_KEY';
  }

  public getRefreshSecret(): string {
    const secret = this.configService.get<string>('JWT_REFRESH_SECRET');
    if (process.env.NODE_ENV === 'production') {
      if (!secret || secret.length < 32 || secret.startsWith('DEFAULT_FALLBACK')) {
        throw new Error(
          'CRITICAL SECURITY CONFIGURATION: JWT_REFRESH_SECRET must be explicitly configured and at least 32 characters long in production.',
        );
      }
      return secret;
    }
    return secret || 'DEFAULT_FALLBACK_REFRESH_SECRET_KEY_MIN_32';
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private async saveRefreshToken(userId: string, token: string): Promise<void> {
    const tokenHash = this.hashToken(token);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.prisma.refreshToken
      .create({
        data: {
          userId,
          tokenHash,
          expiresAt,
        },
      })
      .catch((err) => {
        this.logger.warn(`Could not persist refresh token: ${err.message}`);
      });
  }
}

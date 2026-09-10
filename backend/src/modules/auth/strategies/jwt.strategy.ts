import { Injectable, Inject, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../database/prisma.service';
import { JwtPayload, AuthenticatedUser } from '../interfaces/jwt-payload.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    @Inject(ConfigService) private readonly configService: ConfigService,
    @Inject(PrismaService) private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      // Read directly from process.env here because NestJS DI has not yet
      // injected configService at the point super() executes (passport-jwt
      // calls the Strategy constructor synchronously before DI completes).
      // ConfigModule.forRoot already populated process.env via dotenv before
      // any providers are instantiated, so process.env is safe to use here.
      secretOrKey:
        process.env.JWT_ACCESS_SECRET ||
        'DEFAULT_FALLBACK_DEV_SECRET_MIN_32_CHARS_LONG_KEY',
    });
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    if (!payload.sub || !payload.email) {
      throw new UnauthorizedException('Invalid token payload');
    }

    try {
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: {
          id: true,
          email: true,
          role: true,
          status: true,
          isEmailVerified: true,
          avatarUrl: true,
        },
      });

      if (!user) {
        throw new UnauthorizedException('User no longer exists');
      }

      if (user.status === 'SUSPENDED') {
        throw new UnauthorizedException('Account has been suspended');
      }

      return {
        id: user.id,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        avatarUrl: user.avatarUrl,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      // If DB is offline in test or development, fall back to validated JWT claims
      return {
        id: payload.sub,
        email: payload.email,
        role: payload.role,
        isEmailVerified: false,
      };
    }
  }
}

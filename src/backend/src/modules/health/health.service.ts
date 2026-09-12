import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

export interface HealthCheckData {
  status: 'ok' | 'degraded';
  timestamp: string;
  uptime: number;
  environment: string;
  version: string;
  services: {
    database: {
      status: 'connected' | 'disconnected';
    };
  };
}

export interface LivenessData {
  status: 'ok';
  uptime: number;
  timestamp: string;
}

export interface ReadinessData {
  status: 'ready' | 'unready';
  database: 'connected' | 'disconnected';
  timestamp: string;
}

@Injectable()
export class HealthService {
  private readonly startTime = Date.now();

  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async check(): Promise<HealthCheckData> {
    const isDbHealthy = await this.prisma.isHealthy();
    const uptimeSeconds = Math.floor((Date.now() - this.startTime) / 1000);

    return {
      status: isDbHealthy ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: uptimeSeconds,
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0',
      services: {
        database: {
          status: isDbHealthy ? 'connected' : 'disconnected',
        },
      },
    };
  }

  liveness(): LivenessData {
    const uptimeSeconds = Math.floor((Date.now() - this.startTime) / 1000);
    return {
      status: 'ok',
      uptime: uptimeSeconds,
      timestamp: new Date().toISOString(),
    };
  }

  async readiness(): Promise<ReadinessData> {
    const isDbHealthy = await this.prisma.isHealthy();
    return {
      status: isDbHealthy ? 'ready' : 'unready',
      database: isDbHealthy ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString(),
    };
  }
}

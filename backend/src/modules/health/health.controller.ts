import { Controller, Get, Res, Inject } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Response } from 'express';
import { HealthService, HealthCheckData, LivenessData } from './health.service';

@ApiTags('System')
@Controller('health')
export class HealthController {
  constructor(@Inject(HealthService) private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({ summary: 'System health check and diagnostic status' })
  @ApiResponse({
    status: 200,
    description: 'System health status retrieved successfully',
  })
  async getHealth(): Promise<HealthCheckData> {
    return this.healthService.check();
  }

  @Get('liveness')
  @ApiOperation({ summary: 'Liveness probe — confirms process is alive' })
  @ApiResponse({ status: 200, description: 'Process is alive' })
  getLiveness(): LivenessData {
    return this.healthService.liveness();
  }

  @Get('readiness')
  @ApiOperation({ summary: 'Readiness probe — confirms database connectivity' })
  @ApiResponse({ status: 200, description: 'Service is ready' })
  @ApiResponse({ status: 503, description: 'Service is not ready (database unavailable)' })
  async getReadiness(@Res() res: Response): Promise<void> {
    const data = await this.healthService.readiness();
    const status = data.status === 'ready' ? 200 : 503;
    res.status(status).json(data);
  }
}

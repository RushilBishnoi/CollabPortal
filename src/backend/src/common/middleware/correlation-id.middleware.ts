import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction): void {
    const correlationId =
      (req.headers['x-correlation-id'] as string) ||
      (req.headers['x-request-id'] as string) ||
      randomUUID();

    (req as any).correlationId = correlationId;
    res.setHeader('X-Correlation-ID', correlationId);

    const startAt = Date.now();

    res.on('finish', () => {
      const durationMs = Date.now() - startAt;
      this.logger.log(
        req.method + ' ' + req.path + ' ' + res.statusCode + ' ' + durationMs + 'ms [' + correlationId + ']',
      );
    });

    next();
  }
}

import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger, INestApplication } from '@nestjs/common';
import { ExpressAdapter } from '@nestjs/platform-express';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import compression from 'compression';
import express, { Express } from 'express';
import { validateProductionEnv } from './config/env.validation';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

export async function createNestApp(
  expressInstance?: Express,
): Promise<{ app: INestApplication; expressApp: Express }> {
  // Fail-fast environment validation for production
  validateProductionEnv();

  const expressApp = expressInstance || express();
  const app = await NestFactory.create(
    AppModule,
    new ExpressAdapter(expressApp),
  );

  // Configure reverse proxy trust when enabled in deployment topology
  if (process.env.NODE_ENV === 'production' && process.env.TRUST_PROXY === 'true') {
    (app as any).set('trust proxy', 1);
  }

  // Explicit payload size limits
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Set standard API version prefix
  app.setGlobalPrefix('api/v1');

  // HTTP response compression for JSON payloads > 1KB
  app.use(
    compression({
      threshold: 1024,
      filter: (req, res) => {
        if (req.headers['x-no-compression']) {
          return false;
        }
        return compression.filter(req, res);
      },
    }),
  );

  // CORS security configuration with strict origin validator
  const rawCors = process.env.CORS_ORIGIN || process.env.FRONTEND_URL || 'http://localhost:5173';
  const allowedOrigins = rawCors.includes(',')
    ? rawCors.split(',').map((s) => s.trim())
    : [rawCors.trim()];

  app.enableCors({
    origin: (origin, callback) => {
      // Allow server-to-server, health checks, or non-browser agents with no origin
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      callback(new Error(`Origin '${origin}' not permitted by CORS policy.`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });

  // Global validation pipeline
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global filters and interceptors adhering to api-specification.md
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new TransformInterceptor());

  // OpenAPI / Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('CollabPortal API')
    .setDescription(
      'REST API for Skill Mapping, Internships, and Placement Portal',
    )
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // Enable graceful shutdown hooks for SIGINT/SIGTERM connection draining
  app.enableShutdownHooks();

  return { app, expressApp };
}

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const { app } = await createNestApp();
  const port = process.env.PORT || 4000;
  await app.listen(port);
  logger.log(`Backend server successfully listening on port ${port}`);
  logger.log(`API documentation available at http://localhost:${port}/api/docs`);
  logger.log(`Health endpoint at http://localhost:${port}/api/v1/health`);
}

bootstrap();

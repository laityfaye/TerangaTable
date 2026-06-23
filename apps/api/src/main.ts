import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { randomUUID } from 'crypto';
import * as path from 'path';
import * as fs from 'fs';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { ResponseTransformInterceptor } from './common/interceptors/response-transform.interceptor';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { bufferLogs: true });

  // Serve local uploads (dev fallback when MinIO is not running)
  const uploadsDir = path.join(process.cwd(), 'uploads');
  fs.mkdirSync(uploadsDir, { recursive: true });
  app.useStaticAssets(uploadsDir, { prefix: '/uploads' });
  const logger = new Logger('Bootstrap');

  // ── Security headers ────────────────────────────────────────────────────────
  app.use(helmet());

  // ── CORS — origines depuis CORS_ORIGINS (virgule-séparées) ou APP_URL ───────
  const rawOrigins =
    process.env['CORS_ORIGINS'] ?? process.env['APP_URL'] ?? 'http://localhost:3000';
  const allowedOrigins = rawOrigins.split(',').map((o) => o.trim());
  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: origin ${origin} non autorisée`));
      }
    },
    credentials: true,
  });

  // ── Global prefix ───────────────────────────────────────────────────────────
  app.setGlobalPrefix('v1');

  // ── Request ID middleware ───────────────────────────────────────────────────
  app.use((req: { headers: Record<string, string> }, _res: unknown, next: () => void) => {
    req.headers['x-request-id'] = req.headers['x-request-id'] ?? randomUUID();
    next();
  });

  // ── Validation ──────────────────────────────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new GlobalExceptionFilter());
  app.useGlobalInterceptors(new ResponseTransformInterceptor());

  // ── Swagger ─────────────────────────────────────────────────────────────────
  const config = new DocumentBuilder()
    .setTitle('TérangaTable API')
    .setDescription('API multi-tenant pour la plateforme de restauration TérangaTable')
    .setVersion('1.0')
    .addBearerAuth()
    .addApiKey({ type: 'apiKey', in: 'header', name: 'X-Tenant-ID' }, 'tenant-id')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  const port = process.env['PORT'] ?? 3001;
  await app.listen(port);
  logger.log(`API running on http://localhost:${port}/v1`);
  logger.log(`Swagger docs at http://localhost:${port}/docs`);
}

bootstrap();

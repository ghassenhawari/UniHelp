import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { WinstonModule } from 'nest-winston';
import { winstonConfig } from './common/logger/winston.config';

async function bootstrap() {
  const logger = WinstonModule.createLogger(winstonConfig);
  const app = await NestFactory.create(AppModule, { logger });

  const config = app.get(ConfigService);
  const port = config.get<number>('PORT', 3001);

  // ── Security ────────────────────────────────────────────────────
  app.use(helmet());
  app.enableCors({
    origin: true, // Configuré pour le dev, restreindre en prod
    credentials: true,
  });

  // ── Global prefix ───────────────────────────────────────────────
  app.setGlobalPrefix('api');

  // ── Validation ──────────────────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // ── Swagger ──────────────────────────────────────────────────────
  const swaggerConfig = new DocumentBuilder()
    .setTitle('UniHelp API & Auth')
    .setDescription('Backend API with RAG and secure Auth module')
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api-docs', app, document);

  await app.listen(port);
  logger.log(`🚀 UniHelp API running on http://localhost:${port}/api`, 'Bootstrap');
}

bootstrap();

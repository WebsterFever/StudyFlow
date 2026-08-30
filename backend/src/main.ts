import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Never trust client input past this point: strips unknown fields and
  // rejects anything that fails a DTO's class-validator decorators.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  const frontendUrl = configService.get<string>('FRONTEND_URL', 'http://localhost:5173');
  const allowedOrigins = frontendUrl
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.enableCors({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  const port = configService.get<string>('PORT', '3000');
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`StudyFlow API listening on port ${port} (CORS: ${allowedOrigins.join(', ')})`);
}

bootstrap();

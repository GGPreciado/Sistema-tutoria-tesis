import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());

  // CORS: en producción leer FRONTEND_URL desde variables de entorno
  const origenPermitido = process.env.FRONTEND_URL ?? 'http://localhost:4200';
  app.enableCors({ origin: origenPermitido });

  const puerto = process.env.PORT ?? '3000';
  await app.listen(puerto);
  console.log(`Backend corriendo en http://localhost:${puerto}`);
}

bootstrap();

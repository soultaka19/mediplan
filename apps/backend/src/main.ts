import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Préfixe global d'API (décision archi Phase 2). /health reste hors préfixe
  // pour servir de sonde de disponibilité simple.
  app.setGlobalPrefix('api/v1', { exclude: ['health'] });

  // Validation globale des DTO (rejette les entrées invalides en 400).
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );

  const port = process.env.BACKEND_PORT ?? process.env.PORT ?? 3000;
  await app.listen(port);
}
void bootstrap();

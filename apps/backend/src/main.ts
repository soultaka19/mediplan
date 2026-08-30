import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // En-têtes HTTP de sécurité (CSP, HSTS, nosniff, X-Frame-Options…) et retrait
  // de `X-Powered-By: Express`, qui révélait la pile technique.
  app.use(helmet());

  // Arrêt gracieux : SIGTERM/SIGINT (scale-to-zero, redéploiement, Ctrl+C)
  // déclenchent `onModuleDestroy`/`onApplicationShutdown`, dont la fermeture
  // propre du pool de connexions TypeORM.
  app.enableShutdownHooks();

  // Préfixe global d'API (décision archi Phase 2). /health reste hors préfixe
  // pour servir de sonde de disponibilité simple.
  app.setGlobalPrefix('api/v1', { exclude: ['health'] });

  // Validation globale des DTO (rejette les entrées invalides en 400).
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );

  // Filtre global : normalise toutes les erreurs en JSON { statusCode, error,
  // message } sans fuite d'info sensible (401/403/409/423… cohérents).
  app.useGlobalFilters(new HttpExceptionFilter());

  const port = process.env.BACKEND_PORT ?? process.env.PORT ?? 3000;
  await app.listen(port);
}
void bootstrap();

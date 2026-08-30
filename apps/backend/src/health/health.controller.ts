import { Controller, Get, HttpStatus, Logger, Res } from '@nestjs/common';
import type { Response } from 'express';
import { DataSource } from 'typeorm';

/** Réponse de la sonde : même forme que la base réponde ou non. */
export interface HealthResponse {
  status: 'ok' | 'error';
  timestamp: string;
}

/**
 * Sonde de disponibilité (`GET /health`, hors préfixe `api/v1`).
 *
 * Elle sert de readiness probe (Container Apps) et de healthcheck (Compose) :
 * elle vérifie donc que PostgreSQL répond (`SELECT 1`), pas seulement que le
 * processus Node est vivant. Base injoignable => 503 `{ status: 'error' }`,
 * sans détail interne (l'erreur réelle est journalisée côté serveur).
 */
@Controller('health')
export class HealthController {
  private readonly logger = new Logger(HealthController.name);

  constructor(private readonly dataSource: DataSource) {}

  @Get()
  async check(@Res({ passthrough: true }) res: Response): Promise<HealthResponse> {
    const timestamp = new Date().toISOString();

    try {
      await this.dataSource.query('SELECT 1');
      return { status: 'ok', timestamp };
    } catch (error) {
      this.logger.error(
        'Sonde /health : base de données injoignable',
        error instanceof Error ? error.stack : String(error),
      );
      res.status(HttpStatus.SERVICE_UNAVAILABLE);
      return { status: 'error', timestamp };
    }
  }
}

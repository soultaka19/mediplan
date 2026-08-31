import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DemoService } from './demo.service';

/**
 * Efface périodiquement les bacs à sable expirés.
 *
 * Sans lui, la promesse « jetable » serait fausse : les données d'un visiteur
 * resteraient en base indéfiniment. Écrit avec `setInterval` plutôt qu'avec
 * `@nestjs/schedule` pour ne pas ajouter une dépendance à un projet qui n'en
 * a pas besoin par ailleurs.
 */
@Injectable()
export class DemoCleanupService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DemoCleanupService.name);
  private readonly intervalMs: number;
  private timer?: NodeJS.Timeout;

  constructor(
    private readonly demoService: DemoService,
    configService: ConfigService,
  ) {
    this.intervalMs = Number(configService.get('DEMO_CLEANUP_INTERVAL_SECONDS') ?? 300) * 1000;
  }

  onModuleInit(): void {
    // Un premier passage au démarrage : si l'API a été arrêtée plusieurs
    // heures, des bacs expirés attendent déjà.
    void this.purger();

    this.timer = setInterval(() => void this.purger(), this.intervalMs);
    // Ne pas retenir la boucle d'événements : sans cela, le processus refuse
    // de s'arrêter proprement et les tests restent suspendus.
    this.timer.unref();
  }

  onModuleDestroy(): void {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }

  private async purger(): Promise<void> {
    try {
      await this.demoService.purgeExpired();
    } catch (error) {
      // Une purge ratée ne doit pas tuer le service : elle sera retentée au
      // prochain passage.
      this.logger.error('Échec de la purge des bacs à sable', error as Error);
    }
  }
}

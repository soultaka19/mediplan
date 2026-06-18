import { InjectionToken } from '@angular/core';

import { environment } from '@env/environment';

/**
 * Configuration applicative injectable.
 *
 * On passe par un `InjectionToken` plutôt qu'un import direct de `environment`
 * dans les services : cela découple la logique des fichiers d'environnement et
 * facilite le remplacement de la config dans les tests (override de provider).
 */
export interface EnvConfig {
  /** Production ou non (utile pour activer/désactiver certains comportements). */
  readonly production: boolean;
  /** URL de base de l'API (relative, ex. `/api/v1`). */
  readonly apiUrl: string;
}

export const ENV_CONFIG = new InjectionToken<EnvConfig>('ENV_CONFIG', {
  providedIn: 'root',
  factory: () => ({
    production: environment.production,
    apiUrl: environment.apiUrl,
  }),
});

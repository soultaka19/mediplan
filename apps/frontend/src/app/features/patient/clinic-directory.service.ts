import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ENV_CONFIG } from '@core/config/env.config';
import { PublicClinic } from './patient.models';

/**
 * Annuaire public des cliniques.
 *
 * Appelé depuis l'écran d'inscription, donc **sans jeton** : la route serveur
 * est volontairement ouverte. L'intercepteur Bearer n'ajoute rien quand aucune
 * session n'existe, l'appel passe tel quel.
 */
@Injectable({ providedIn: 'root' })
export class ClinicDirectoryService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(ENV_CONFIG).apiUrl;

  listClinics(): Observable<PublicClinic[]> {
    return this.http.get<PublicClinic[]>(`${this.apiUrl}/clinics`);
  }
}

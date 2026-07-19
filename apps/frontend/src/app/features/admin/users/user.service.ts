import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ENV_CONFIG } from '@core/config/env.config';
import { PublicUser } from '@core/auth';

/**
 * Service HTTP de gestion des utilisateurs (administration).
 *
 * Responsabilité unique : parler à l'API `/users`. Aucune gestion d'état ni de
 * stockage (la page consommatrice détient l'état via signals). Le Bearer est
 * ajouté par l'intercepteur ; l'autorisation (clinic_admin / super_admin) et le
 * scope `clinic_id` font foi côté serveur (403 sinon).
 */
@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(ENV_CONFIG).apiUrl;

  /**
   * Liste les utilisateurs accessibles (GET /users → 200).
   *
   * L'endpoint renvoie un tableau simple `PublicUser[]` (pas de pagination).
   */
  listUsers(): Observable<PublicUser[]> {
    return this.http.get<PublicUser[]>(`${this.apiUrl}/users`);
  }

  createLightPatient(payload: CreateLightPatientPayload): Observable<PublicUser> {
    return this.http.post<PublicUser>(`${this.apiUrl}/users/light-patients`, payload);
  }

  updatePatient(patientId: string, payload: UpdatePatientPayload): Observable<PublicUser> {
    return this.http.patch<PublicUser>(`${this.apiUrl}/users/${patientId}`, payload);
  }

  deletePatient(patientId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/users/${patientId}`);
  }
}

export interface CreateLightPatientPayload {
  firstName?: string;
  lastName?: string;
  email?: string;
  clinicId?: string;
}

export interface UpdatePatientPayload {
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
}

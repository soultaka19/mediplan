import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ENV_CONFIG } from '@core/config/env.config';
import { AppointmentFlowItem } from '@features/clinic-flow/appointment-flow.models';
import { BookSelfPayload, OpenSlot } from './patient.models';

/**
 * Service HTTP de l'espace patient (MEDIPLAN-21).
 *
 * Les trois routes sont réservées au rôle `patient` côté serveur. Aucune ne
 * prend d'identifiant de patient en paramètre : le périmètre est déduit du
 * jeton, ce qui rend impossible de consulter ou réserver pour quelqu'un d'autre.
 */
@Injectable({ providedIn: 'root' })
export class PatientAppointmentsService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(ENV_CONFIG).apiUrl;

  /** Rendez-vous du patient connecté, plus récents d'abord. */
  listMine(): Observable<AppointmentFlowItem[]> {
    return this.http.get<AppointmentFlowItem[]>(`${this.apiUrl}/appointments/mine`);
  }

  /** Créneaux libres à venir dans la clinique du patient. */
  listOpenSlots(): Observable<OpenSlot[]> {
    return this.http.get<OpenSlot[]>(`${this.apiUrl}/appointments/open-slots`);
  }

  /** Réserve un créneau pour soi-même. */
  bookSelf(payload: BookSelfPayload): Observable<AppointmentFlowItem> {
    return this.http.post<AppointmentFlowItem>(`${this.apiUrl}/appointments/self`, payload);
  }
}

import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ENV_CONFIG } from '@core/config/env.config';
import { AppointmentFlowItem, UpdateAppointmentStatusPayload } from './appointment-flow.models';

@Injectable({ providedIn: 'root' })
export class AppointmentFlowService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(ENV_CONFIG).apiUrl;

  listToday(): Observable<AppointmentFlowItem[]> {
    return this.http.get<AppointmentFlowItem[]>(`${this.apiUrl}/appointments/today`);
  }

  exportCsv(from: string, to: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/appointments/export.csv`, {
      params: { from, to },
      responseType: 'blob',
    });
  }

  updateStatus(
    appointmentId: string,
    payload: UpdateAppointmentStatusPayload,
  ): Observable<AppointmentFlowItem> {
    return this.http.patch<AppointmentFlowItem>(
      `${this.apiUrl}/appointments/${appointmentId}/status`,
      payload,
    );
  }

  /** Annule un rendez-vous avec un motif obligatoire (libère le créneau). */
  cancel(appointmentId: string, cancellationReason: string): Observable<AppointmentFlowItem> {
    return this.http.patch<AppointmentFlowItem>(
      `${this.apiUrl}/appointments/${appointmentId}/cancel`,
      { cancellationReason },
    );
  }
}

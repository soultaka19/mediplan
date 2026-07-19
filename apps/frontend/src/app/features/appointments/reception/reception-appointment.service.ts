import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ENV_CONFIG } from '@core/config/env.config';
import {
  CreateReceptionAppointmentPayload,
  ReceptionAppointment,
} from './reception-appointment.models';

@Injectable({ providedIn: 'root' })
export class ReceptionAppointmentService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(ENV_CONFIG).apiUrl;

  create(payload: CreateReceptionAppointmentPayload): Observable<ReceptionAppointment> {
    return this.http.post<ReceptionAppointment>(`${this.apiUrl}/appointments/reception`, payload);
  }
}

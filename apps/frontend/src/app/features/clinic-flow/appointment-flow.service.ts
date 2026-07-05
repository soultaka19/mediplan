import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ENV_CONFIG } from '@core/config/env.config';
import {
  AppointmentFlowItem,
  ShiftDoctorAppointmentsPayload,
  ShiftDoctorAppointmentsResponse,
  UpdateAppointmentStatusPayload,
} from './appointment-flow.models';

@Injectable({ providedIn: 'root' })
export class AppointmentFlowService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(ENV_CONFIG).apiUrl;

  listToday(): Observable<AppointmentFlowItem[]> {
    return this.http.get<AppointmentFlowItem[]>(`${this.apiUrl}/appointments/today`);
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

  shiftDoctorAppointments(
    payload: ShiftDoctorAppointmentsPayload,
  ): Observable<ShiftDoctorAppointmentsResponse> {
    return this.http.patch<ShiftDoctorAppointmentsResponse>(
      `${this.apiUrl}/appointments/doctor/shift`,
      payload,
    );
  }
}

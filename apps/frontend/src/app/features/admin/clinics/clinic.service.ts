import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ENV_CONFIG } from '@core/config/env.config';
import { Clinic, CreateClinicPayload, UpdateClinicPayload } from './clinic.models';

@Injectable({ providedIn: 'root' })
export class ClinicService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(ENV_CONFIG).apiUrl;

  listClinics(): Observable<Clinic[]> {
    return this.http.get<Clinic[]>(`${this.apiUrl}/clinics`);
  }

  createClinic(payload: CreateClinicPayload): Observable<Clinic> {
    return this.http.post<Clinic>(`${this.apiUrl}/clinics`, payload);
  }

  updateClinic(id: string, payload: UpdateClinicPayload): Observable<Clinic> {
    return this.http.patch<Clinic>(`${this.apiUrl}/clinics/${id}`, payload);
  }
}

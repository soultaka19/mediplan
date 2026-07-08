import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ENV_CONFIG } from '@core/config/env.config';
import { Availability, AvailabilitySlot, CreateAvailabilityPayload } from './availability.models';

@Injectable({ providedIn: 'root' })
export class AvailabilityService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(ENV_CONFIG).apiUrl;

  listAvailabilities(): Observable<Availability[]> {
    return this.http.get<Availability[]>(`${this.apiUrl}/availabilities`);
  }

  createAvailability(payload: CreateAvailabilityPayload): Observable<Availability> {
    return this.http.post<Availability>(`${this.apiUrl}/availabilities`, payload);
  }

  deleteAvailability(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/availabilities/${id}`);
  }

  generateSlots(id: string): Observable<AvailabilitySlot[]> {
    return this.http.get<AvailabilitySlot[]>(`${this.apiUrl}/availabilities/${id}/slots`);
  }
}

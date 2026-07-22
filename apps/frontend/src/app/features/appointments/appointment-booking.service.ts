import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ENV_CONFIG } from '@core/config/env.config';
import { BookReceptionPayload, BookedAppointment } from './booking.models';

/**
 * Service HTTP de prise de rendez-vous par la réception.
 *
 * Responsabilité unique : parler à `POST /appointments/reception`. Le créneau
 * (`slotId`) provient d'une matérialisation préalable des créneaux d'une
 * disponibilité (cf. AvailabilityService.materializeSlots).
 */
@Injectable({ providedIn: 'root' })
export class AppointmentBookingService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(ENV_CONFIG).apiUrl;

  bookByReception(payload: BookReceptionPayload): Observable<BookedAppointment> {
    return this.http.post<BookedAppointment>(`${this.apiUrl}/appointments/reception`, payload);
  }
}

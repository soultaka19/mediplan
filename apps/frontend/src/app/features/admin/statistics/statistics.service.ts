import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ENV_CONFIG } from '@core/config/env.config';
import { StatisticsFilters, StatisticsResponse } from './statistics.models';

@Injectable({ providedIn: 'root' })
export class StatisticsService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(ENV_CONFIG).apiUrl;

  getActivity(filters: StatisticsFilters): Observable<StatisticsResponse> {
    let params = new HttpParams();

    if (filters.startDate) {
      params = params.set('startDate', filters.startDate);
    }
    if (filters.endDate) {
      params = params.set('endDate', filters.endDate);
    }
    if (filters.doctorId) {
      params = params.set('doctorId', filters.doctorId);
    }

    return this.http.get<StatisticsResponse>(`${this.apiUrl}/statistics/activity`, { params });
  }
}

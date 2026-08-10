import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ENV_CONFIG } from '@core/config/env.config';
import { InternalNotification, UnreadNotificationCount } from './notification.models';

@Injectable({ providedIn: 'root' })
export class NotificationCenterService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(ENV_CONFIG).apiUrl;

  list(): Observable<InternalNotification[]> {
    return this.http.get<InternalNotification[]>(`${this.apiUrl}/notifications`);
  }

  unreadCount(): Observable<UnreadNotificationCount> {
    return this.http.get<UnreadNotificationCount>(`${this.apiUrl}/notifications/unread-count`);
  }

  markAsRead(id: string): Observable<InternalNotification> {
    return this.http.patch<InternalNotification>(`${this.apiUrl}/notifications/${id}/read`, {});
  }
}

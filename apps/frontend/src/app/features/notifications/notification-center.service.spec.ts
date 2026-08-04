import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { InternalNotification } from './notification.models';
import { NotificationCenterService } from './notification-center.service';

const notification: InternalNotification = {
  id: 'notification-1',
  type: 'appointment_booked',
  title: 'Nouveau rendez-vous',
  message: 'Un rendez-vous a ete reserve.',
  actionUrl: '/clinic-flow/today',
  readAt: null,
  createdAt: '2026-07-05T13:00:00.000Z',
};

describe('NotificationCenterService', () => {
  let service: NotificationCenterService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(withInterceptors([])), provideHttpClientTesting()],
    });
    service = TestBed.inject(NotificationCenterService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('GET /api/v1/notifications', () => {
    let received: InternalNotification[] | undefined;

    service.list().subscribe((res) => (received = res));

    const req = httpMock.expectOne('/api/v1/notifications');
    expect(req.request.method).toBe('GET');
    req.flush([notification]);

    expect(received).toEqual([notification]);
  });

  it('GET /api/v1/notifications/unread-count', () => {
    service.unreadCount().subscribe((res) => expect(res.unreadCount).toBe(3));

    const req = httpMock.expectOne('/api/v1/notifications/unread-count');
    expect(req.request.method).toBe('GET');
    req.flush({ unreadCount: 3 });
  });

  it('PATCH /api/v1/notifications/:id/read', () => {
    service.markAsRead('notification-1').subscribe((res) => expect(res.readAt).not.toBeNull());

    const req = httpMock.expectOne('/api/v1/notifications/notification-1/read');
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({});
    req.flush({ ...notification, readAt: '2026-07-05T13:05:00.000Z' });
  });
});

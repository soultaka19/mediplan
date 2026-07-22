import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { AppointmentFlowItem } from './appointment-flow.models';
import { AppointmentFlowService } from './appointment-flow.service';

const item: AppointmentFlowItem = {
  id: 'a1',
  slotId: 's1',
  clinicId: 'c1',
  patientId: 'p1',
  doctorId: 'd1',
  createdById: 'u1',
  status: 'booked',
  reason: null,
  cancellationReason: null,
  startAt: '2026-07-05T13:00:00.000Z',
  endAt: '2026-07-05T13:30:00.000Z',
  createdAt: '2026-07-05T12:00:00.000Z',
};

describe('AppointmentFlowService', () => {
  let service: AppointmentFlowService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(withInterceptors([])), provideHttpClientTesting()],
    });
    service = TestBed.inject(AppointmentFlowService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('GET /api/v1/appointments/today', () => {
    let received: AppointmentFlowItem[] | undefined;

    service.listToday().subscribe((res) => (received = res));

    const req = httpMock.expectOne('/api/v1/appointments/today');
    expect(req.request.method).toBe('GET');
    req.flush([item]);

    expect(received).toEqual([item]);
  });

  it('PATCH /api/v1/appointments/:id/status', () => {
    service.updateStatus('a1', { status: 'arrived' }).subscribe();

    const req = httpMock.expectOne('/api/v1/appointments/a1/status');
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ status: 'arrived' });
    req.flush({ ...item, status: 'arrived' });
  });
});

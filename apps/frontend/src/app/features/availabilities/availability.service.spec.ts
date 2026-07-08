import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { ENV_CONFIG } from '@core/config/env.config';
import { AvailabilityService } from './availability.service';

describe('AvailabilityService', () => {
  let service: AvailabilityService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AvailabilityService,
        provideHttpClient(withInterceptors([])),
        provideHttpClientTesting(),
        { provide: ENV_CONFIG, useValue: { production: false, apiUrl: '/api/v1' } },
      ],
    });

    service = TestBed.inject(AvailabilityService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('liste les disponibilites via GET /availabilities', () => {
    service.listAvailabilities().subscribe();

    const req = httpMock.expectOne('/api/v1/availabilities');
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('cree une disponibilite via POST /availabilities', () => {
    const payload = {
      startAt: '2026-06-24T13:00:00.000Z',
      endAt: '2026-06-24T14:00:00.000Z',
    };

    service.createAvailability(payload).subscribe();

    const req = httpMock.expectOne('/api/v1/availabilities');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush({ id: 'a1' });
  });
});

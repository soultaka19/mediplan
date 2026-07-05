import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { ENV_CONFIG } from '@core/config/env.config';
import { ClinicService } from './clinic.service';

describe('ClinicService', () => {
  let service: ClinicService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ClinicService,
        provideHttpClient(withInterceptors([])),
        provideHttpClientTesting(),
        { provide: ENV_CONFIG, useValue: { production: false, apiUrl: '/api/v1' } },
      ],
    });

    service = TestBed.inject(ClinicService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('liste les cliniques via GET /clinics', () => {
    service.listClinics().subscribe();

    const req = httpMock.expectOne('/api/v1/clinics');
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('cree une clinique via POST /clinics', () => {
    const payload = { name: 'Clinique Centrale' };

    service.createClinic(payload).subscribe();

    const req = httpMock.expectOne('/api/v1/clinics');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush({ id: 'clinic-1' });
  });

  it('met a jour une clinique via PATCH /clinics/:id', () => {
    const payload = { isActive: false };

    service.updateClinic('clinic-1', payload).subscribe();

    const req = httpMock.expectOne('/api/v1/clinics/clinic-1');
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual(payload);
    req.flush({ id: 'clinic-1' });
  });
});

import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { AuthResponse } from './models/auth.models';
import { AuthService } from './auth.service';

/** Construit une réponse d'auth factice typée. */
function fakeAuthResponse(): AuthResponse {
  return {
    accessToken: 'jwt-token',
    tokenType: 'Bearer',
    expiresIn: '60m',
    user: {
      id: 'u1',
      email: 'patient@example.com',
      firstName: 'Ada',
      lastName: 'Lovelace',
      role: 'patient',
      clinicId: null,
      isActive: true,
      createdAt: '2026-06-17T00:00:00.000Z',
    },
  };
}

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([])),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('POST /api/v1/auth/register avec le bon corps', () => {
    const payload = { email: 'patient@example.com', password: 'Str0ng!Pass' };
    let received: AuthResponse | undefined;

    service.register(payload).subscribe((res) => (received = res));

    const req = httpMock.expectOne('/api/v1/auth/register');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush(fakeAuthResponse());
    expect(received?.accessToken).toBe('jwt-token');
  });

  it('POST /api/v1/auth/login avec le bon corps', () => {
    const payload = { email: 'patient@example.com', password: 'Str0ng!Pass' };

    service.login(payload).subscribe();

    const req = httpMock.expectOne('/api/v1/auth/login');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush(fakeAuthResponse());
  });

  it('GET /api/v1/users/me et renvoie le profil', () => {
    let received: { id: string } | undefined;

    service.me().subscribe((res) => (received = res));

    const req = httpMock.expectOne('/api/v1/users/me');
    expect(req.request.method).toBe('GET');
    req.flush(fakeAuthResponse().user);
    expect(received?.id).toBe('u1');
  });

  it('POST /api/v1/auth/forgot-password avec { email }', () => {
    service.forgotPassword('patient@example.com').subscribe();

    const req = httpMock.expectOne('/api/v1/auth/forgot-password');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ email: 'patient@example.com' });
    req.flush(null, { status: 202, statusText: 'Accepted' });
  });

  it('POST /api/v1/auth/reset-password avec { token, newPassword }', () => {
    service.resetPassword('reset-token-123', 'Str0ng!Pass').subscribe();

    const req = httpMock.expectOne('/api/v1/auth/reset-password');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ token: 'reset-token-123', newPassword: 'Str0ng!Pass' });
    req.flush({ message: 'Mot de passe réinitialisé.' });
  });
});

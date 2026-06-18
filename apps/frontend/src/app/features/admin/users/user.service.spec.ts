import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { PublicUser } from '@core/auth';
import { UserService } from './user.service';

/** Construit un utilisateur public factice typé. */
function fakeUser(overrides: Partial<PublicUser> = {}): PublicUser {
  return {
    id: 'u1',
    email: 'admin@example.com',
    firstName: 'Ada',
    lastName: 'Lovelace',
    role: 'clinic_admin',
    clinicId: 'c1',
    isActive: true,
    createdAt: '2026-06-17T00:00:00.000Z',
    ...overrides,
  };
}

describe('UserService', () => {
  let service: UserService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(withInterceptors([])), provideHttpClientTesting()],
    });
    service = TestBed.inject(UserService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('GET /api/v1/users et renvoie la liste des utilisateurs', () => {
    let received: PublicUser[] | undefined;

    service.listUsers().subscribe((res) => (received = res));

    const req = httpMock.expectOne('/api/v1/users');
    expect(req.request.method).toBe('GET');
    req.flush([fakeUser(), fakeUser({ id: 'u2', email: 'doc@example.com', role: 'doctor' })]);

    expect(received?.length).toBe(2);
    expect(received?.[0].id).toBe('u1');
  });
});

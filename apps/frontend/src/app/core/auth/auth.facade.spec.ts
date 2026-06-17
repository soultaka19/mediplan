import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { AuthFacade } from './auth.facade';
import { AuthResponse } from './models/auth.models';
import { TokenStorage } from './token-storage';

function fakeAuthResponse(): AuthResponse {
  return {
    accessToken: 'jwt-token',
    tokenType: 'Bearer',
    expiresIn: '60m',
    user: {
      id: 'u1',
      email: 'patient@example.com',
      firstName: null,
      lastName: null,
      role: 'patient',
      clinicId: null,
      isActive: true,
      createdAt: '2026-06-17T00:00:00.000Z',
    },
  };
}

describe('AuthFacade', () => {
  let facade: AuthFacade;
  let httpMock: HttpTestingController;
  let tokenStorage: TokenStorage;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([])),
        provideHttpClientTesting(),
      ],
    });
    facade = TestBed.inject(AuthFacade);
    httpMock = TestBed.inject(HttpTestingController);
    tokenStorage = TestBed.inject(TokenStorage);
  });

  afterEach(() => {
    httpMock.verify();
    tokenStorage.clear();
  });

  it('stocke le jeton et l’utilisateur après un login réussi', () => {
    expect(facade.isAuthenticated()).toBe(false);

    facade.login({ email: 'patient@example.com', password: 'Str0ng!Pass' }).subscribe();
    httpMock.expectOne('/api/v1/auth/login').flush(fakeAuthResponse());

    expect(tokenStorage.getToken()).toBe('jwt-token');
    expect(facade.isAuthenticated()).toBe(true);
    expect(facade.currentUser()?.id).toBe('u1');
  });

  it('purge le jeton et l’état au logout', () => {
    facade.register({ email: 'patient@example.com', password: 'Str0ng!Pass' }).subscribe();
    httpMock.expectOne('/api/v1/auth/register').flush(fakeAuthResponse());
    expect(facade.isAuthenticated()).toBe(true);

    facade.logout();

    expect(tokenStorage.getToken()).toBeNull();
    expect(facade.isAuthenticated()).toBe(false);
    expect(facade.currentUser()).toBeNull();
  });
});

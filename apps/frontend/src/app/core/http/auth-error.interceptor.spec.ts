import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';

import { AuthFacade } from '../auth/auth.facade';
import { TokenStorage } from '../auth/token-storage';
import { authErrorInterceptor } from './auth-error.interceptor';

describe('authErrorInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let tokenStorage: TokenStorage;
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authErrorInterceptor])),
        provideHttpClientTesting(),
        {
          provide: Router,
          useValue: { navigate: vi.fn() },
        },
      ],
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    tokenStorage = TestBed.inject(TokenStorage);
    router = TestBed.inject(Router);
  });

  afterEach(() => {
    httpMock.verify();
    tokenStorage.clear();
  });

  it('sur 401 hors auth : purge le jeton et redirige vers /login', () => {
    const facade = TestBed.inject(AuthFacade);
    const logoutSpy = vi.spyOn(facade, 'logout');
    tokenStorage.setToken('jwt-token');

    http.get('/api/v1/protected').subscribe({ error: () => undefined });
    httpMock.expectOne('/api/v1/protected').flush(null, { status: 401, statusText: 'Unauthorized' });

    expect(logoutSpy).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('sur 401 du login : ne redirige pas (erreur propagée au formulaire)', () => {
    http.post('/api/v1/auth/login', {}).subscribe({ error: () => undefined });
    httpMock
      .expectOne('/api/v1/auth/login')
      .flush(null, { status: 401, statusText: 'Unauthorized' });

    expect(router.navigate).not.toHaveBeenCalled();
  });
});

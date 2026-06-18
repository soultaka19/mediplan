import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { TokenStorage } from '../auth/token-storage';
import { authBearerInterceptor } from './auth-bearer.interceptor';

describe('authBearerInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let tokenStorage: TokenStorage;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authBearerInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    tokenStorage = TestBed.inject(TokenStorage);
  });

  afterEach(() => {
    httpMock.verify();
    tokenStorage.clear();
  });

  it('ajoute le Bearer aux requêtes /api/ quand un jeton existe', () => {
    tokenStorage.setToken('jwt-token');
    http.get('/api/v1/anything').subscribe();

    const req = httpMock.expectOne('/api/v1/anything');
    expect(req.request.headers.get('Authorization')).toBe('Bearer jwt-token');
    req.flush({});
  });

  it("n'ajoute pas d'en-tête sans jeton", () => {
    http.get('/api/v1/anything').subscribe();

    const req = httpMock.expectOne('/api/v1/anything');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });

  it('ignore les URLs hors /api/', () => {
    tokenStorage.setToken('jwt-token');
    http.get('https://cdn.example.com/asset.json').subscribe();

    const req = httpMock.expectOne('https://cdn.example.com/asset.json');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });
});

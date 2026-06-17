import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ENV_CONFIG } from '../config/env.config';
import { AuthResponse, LoginPayload, RegisterPayload } from './models/auth.models';

/**
 * Service HTTP d'authentification.
 *
 * Responsabilité unique : parler à l'API `/auth/*`. Aucune gestion d'état ni
 * de stockage ici (c'est le rôle de l'AuthFacade et du TokenStorage).
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(ENV_CONFIG).apiUrl;

  /** Inscription patient libre-service (POST /auth/register → 201). */
  register(payload: RegisterPayload): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/register`, payload);
  }

  /** Connexion (POST /auth/login → 200). */
  login(payload: LoginPayload): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/login`, payload);
  }
}

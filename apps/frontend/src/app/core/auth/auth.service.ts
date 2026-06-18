import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ENV_CONFIG } from '../config/env.config';
import {
  AuthResponse,
  ForgotPasswordPayload,
  LoginPayload,
  MessageResponse,
  PublicUser,
  RegisterPayload,
  ResetPasswordPayload,
} from './models/auth.models';

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

  /**
   * Profil de l'utilisateur courant (GET /users/me → 200).
   *
   * Source de vérité du profil (rôle/clinique inclus) ; affine l'utilisateur
   * reconstruit depuis les claims du JWT au démarrage. Requiert le Bearer
   * (ajouté par l'intercepteur).
   */
  me(): Observable<PublicUser> {
    return this.http.get<PublicUser>(`${this.apiUrl}/users/me`);
  }

  /**
   * Demande de réinitialisation (POST /auth/forgot-password → 202 toujours).
   *
   * Anti-énumération : le backend répond 202 que le compte existe ou non. Le
   * front affiche un message neutre identique dans tous les cas.
   */
  forgotPassword(email: string): Observable<void> {
    const payload: ForgotPasswordPayload = { email };
    return this.http.post<void>(`${this.apiUrl}/auth/forgot-password`, payload);
  }

  /**
   * Réinitialisation du mot de passe (POST /auth/reset-password → 200).
   *
   * 400 générique si le jeton est invalide/expiré/déjà utilisé ; 400 de
   * validation si `newPassword` viole la politique.
   */
  resetPassword(token: string, newPassword: string): Observable<MessageResponse> {
    const payload: ResetPasswordPayload = { token, newPassword };
    return this.http.post<MessageResponse>(`${this.apiUrl}/auth/reset-password`, payload);
  }
}

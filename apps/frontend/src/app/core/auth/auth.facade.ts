import { computed, inject, Injectable, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';

import { AuthService } from './auth.service';
import { AuthResponse, LoginPayload, PublicUser, RegisterPayload } from './models/auth.models';
import { TokenStorage } from './token-storage';

/**
 * Façade d'authentification : source unique de l'état d'auth partagé.
 *
 * Expose des signals readonly (`isAuthenticated`, `currentUser`) consommés par
 * les guards et les composants, et orchestre service HTTP + stockage du jeton.
 * Les composants ne parlent jamais à AuthService/TokenStorage directement.
 */
@Injectable({ providedIn: 'root' })
export class AuthFacade {
  private readonly authService = inject(AuthService);
  private readonly tokenStorage = inject(TokenStorage);

  /** État interne mutable de l'utilisateur courant. */
  private readonly userState = signal<PublicUser | null>(null);

  /** Utilisateur courant (lecture seule). */
  readonly currentUser = this.userState.asReadonly();

  /** Vrai si un jeton est présent (état dérivé). */
  readonly isAuthenticated = computed(() => this.userState() !== null);

  /** Inscription : enregistre le jeton et l'utilisateur en cas de succès. */
  register(payload: RegisterPayload): Observable<AuthResponse> {
    return this.authService.register(payload).pipe(tap((res) => this.handleAuthSuccess(res)));
  }

  /** Connexion : enregistre le jeton et l'utilisateur en cas de succès. */
  login(payload: LoginPayload): Observable<AuthResponse> {
    return this.authService.login(payload).pipe(tap((res) => this.handleAuthSuccess(res)));
  }

  /** Déconnexion : purge le jeton et l'état utilisateur. */
  logout(): void {
    this.tokenStorage.clear();
    this.userState.set(null);
  }

  /** Persiste le jeton et met à jour l'état utilisateur après authentification. */
  private handleAuthSuccess(response: AuthResponse): void {
    this.tokenStorage.setToken(response.accessToken);
    this.userState.set(response.user);
  }
}

import { computed, inject, Injectable, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';

import { userFromAccessToken } from './access-token';
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

  /** Vrai si un utilisateur est authentifié (état dérivé). */
  readonly isAuthenticated = computed(() => this.userState() !== null);

  constructor() {
    this.restoreSession();
  }

  /**
   * Réhydrate la session au démarrage à partir du jeton persistant.
   *
   * Faute d'endpoint `/me`, on reconstruit l'utilisateur depuis les claims du
   * JWT. Un jeton absent, mal formé ou expiré ne crée pas de session (et est
   * purgé le cas échéant). Permet à `isAuthenticated` de survivre à un
   * rechargement de page.
   */
  private restoreSession(): void {
    const token = this.tokenStorage.getToken();
    if (!token) {
      return;
    }
    const user = userFromAccessToken(token);
    if (user) {
      this.userState.set(user);
      // Le JWT est la source initiale ; /users/me affine le profil (prénom/nom).
      //
      // ⚠️ Différé hors du constructeur (microtask) : l'appel /users/me traverse
      // `authErrorInterceptor`, qui fait `inject(AuthFacade)`. Déclenché pendant
      // la construction de la façade, cela lève NG0200 (dépendance circulaire) et
      // la requête échoue sans partir → le profil n'était jamais rafraîchi au
      // rechargement (l'en-tête retombait sur la partie locale de l'e-mail). Le
      // microtask garantit que la façade est entièrement construite (et en cache
      // dans l'injecteur) avant que l'intercepteur ne la réinjecte.
      queueMicrotask(() => this.refreshCurrentUser());
    } else {
      this.tokenStorage.clear();
    }
  }

  /**
   * Rafraîchit l'utilisateur courant depuis `/users/me`.
   *
   * Met à jour l'état en cas de succès. En cas d'erreur, on conserve l'état
   * existant sans casser la session : l'expiration du jeton (401) est gérée par
   * l'intercepteur, et la réhydratation JWT reste une source valable.
   */
  refreshCurrentUser(): void {
    this.authService.me().subscribe({
      next: (user) => this.userState.set(user),
      error: () => {
        /* Profil non rafraîchi : on garde l'état courant (cf. intercepteur 401). */
      },
    });
  }

  /** Inscription : enregistre le jeton et l'utilisateur en cas de succès. */
  register(payload: RegisterPayload): Observable<AuthResponse> {
    return this.authService.register(payload).pipe(tap((res) => this.handleAuthSuccess(res)));
  }

  /** Connexion : enregistre le jeton et l'utilisateur en cas de succès. */
  login(payload: LoginPayload): Observable<AuthResponse> {
    return this.authService.login(payload).pipe(tap((res) => this.handleAuthSuccess(res)));
  }

  /**
   * Ouvre une session à partir d'une réponse d'authentification déjà obtenue.
   *
   * Le bac à sable de démonstration renvoie son jeton dès la création : sans
   * cette méthode il faudrait rejouer une connexion pour un jeton qu'on a déjà.
   */
  applySession(response: AuthResponse): void {
    this.handleAuthSuccess(response);
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
    // Confirme/affine le profil depuis la source de vérité serveur.
    this.refreshCurrentUser();
  }
}

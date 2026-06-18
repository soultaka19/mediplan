import { Injectable } from '@angular/core';

/**
 * Accès au jeton d'authentification persistant.
 *
 * SEUL endroit de l'application autorisé à toucher `localStorage`. Centraliser
 * ici facilite un éventuel changement de stratégie de stockage et évite la
 * dispersion des accès au stockage navigateur.
 */
@Injectable({ providedIn: 'root' })
export class TokenStorage {
  /** Clé de stockage du jeton d'accès. */
  private static readonly TOKEN_KEY = 'mediplan.accessToken';

  /** Lit le jeton courant, ou `null` s'il n'y en a pas. */
  getToken(): string | null {
    return localStorage.getItem(TokenStorage.TOKEN_KEY);
  }

  /** Enregistre le jeton d'accès. */
  setToken(token: string): void {
    localStorage.setItem(TokenStorage.TOKEN_KEY, token);
  }

  /** Supprime le jeton (déconnexion / purge sur 401). */
  clear(): void {
    localStorage.removeItem(TokenStorage.TOKEN_KEY);
  }
}

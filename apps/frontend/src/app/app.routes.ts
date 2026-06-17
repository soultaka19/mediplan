import { Routes } from '@angular/router';

import { authGuard, guestGuard } from '@core/auth';

/**
 * Routes applicatives.
 *
 * Écrans publics (login/register) protégés par `guestGuard` (interdits si déjà
 * connecté). `authGuard` est câblé sur la route racine pour être prêt aux
 * écrans protégés à venir : tant qu'aucun écran réel n'existe, un utilisateur
 * non authentifié est redirigé vers `/login` par le guard, et un utilisateur
 * authentifié est redirigé (placeholder) vers `/login` également.
 */
export const routes: Routes = [
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('@features/auth/login/login-page').then((m) => m.LoginPage),
  },
  {
    path: 'register',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('@features/auth/register/register-page').then((m) => m.RegisterPage),
  },
  {
    // Point d'entrée protégé (cible de redirection après connexion). Aucun
    // écran réel dans ce ticket : on redirige vers login en attendant le
    // tableau de bord. `authGuard` reste appliqué pour valider son câblage.
    path: '',
    pathMatch: 'full',
    canActivate: [authGuard],
    redirectTo: 'login',
  },
  {
    path: '**',
    redirectTo: 'login',
  },
];

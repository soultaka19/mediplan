import { Routes } from '@angular/router';

import { authGuard, guestGuard } from '@core/auth';

/**
 * Routes applicatives.
 *
 * - `login`/`register` : écrans publics protégés par `guestGuard` (interdits si
 *   déjà connecté → redirigés vers `/dashboard`).
 * - `dashboard` : écran protégé par `authGuard` (un visiteur non authentifié est
 *   renvoyé vers `/login`). Cible de redirection après connexion/inscription.
 * - `''` et `**` redirigent vers `/dashboard` ; `authGuard` aiguille ensuite
 *   vers `/login` si la session n'est pas valide. (On ne combine jamais
 *   `redirectTo` et `canActivate` sur une même route : Angular évalue les
 *   redirections avant les guards.)
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
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () =>
      import('@features/dashboard/dashboard-page').then((m) => m.DashboardPage),
  },
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'dashboard',
  },
  {
    path: '**',
    redirectTo: 'dashboard',
  },
];

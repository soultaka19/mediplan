import { Routes } from '@angular/router';

import { guestGuard } from '@core/auth';

/**
 * Routes applicatives.
 *
 * Écrans publics (login/register) protégés par `guestGuard` (interdits si déjà
 * connecté). La route racine redirige (placeholder) vers `/login` en attendant
 * le tableau de bord. `authGuard` est exporté et testé, prêt à être appliqué
 * sur le premier écran protégé réel — il ne peut pas être combiné à `redirectTo`
 * sur la même route (Angular exécute les redirections avant les guards).
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
    // Aucun écran réel dans ce ticket : on redirige vers login en attendant
    // le tableau de bord (qui portera alors `authGuard`).
    path: '',
    pathMatch: 'full',
    redirectTo: 'login',
  },
  {
    path: '**',
    redirectTo: 'login',
  },
];

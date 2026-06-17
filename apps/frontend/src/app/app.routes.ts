import { Routes } from '@angular/router';

import { authGuard, guestGuard } from '@core/auth';

/**
 * Routes applicatives (cf. design-system §7.2).
 *
 * Deux layouts distincts :
 * - `login`/`register` : écrans PUBLICS hors shell, dans `AuthLayout` (carte
 *   centrée). Protégés par `guestGuard` (redirigés vers `/dashboard` si déjà
 *   connecté).
 * - écrans PROTÉGÉS : enfants d'une route parente portant `LayoutShell` (header
 *   + sidenav), protégée par `authGuard` (visiteur non authentifié → `/login`).
 *
 * Règle respectée : on ne combine jamais `redirectTo` et `canActivate` sur une
 * même route. La redirection `''` → `dashboard` vit DANS les enfants du shell,
 * sous la protection de l'`authGuard` parent.
 */
export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('@core/layout').then((m) => m.AuthLayout),
    canActivate: [guestGuard],
    children: [
      {
        path: 'login',
        loadComponent: () => import('@features/auth/login/login-page').then((m) => m.LoginPage),
      },
      {
        path: 'register',
        loadComponent: () =>
          import('@features/auth/register/register-page').then((m) => m.RegisterPage),
      },
      {
        path: 'forgot-password',
        loadComponent: () =>
          import('@features/auth/forgot-password/forgot-password-page').then(
            (m) => m.ForgotPasswordPage,
          ),
      },
      {
        path: 'reset-password',
        loadComponent: () =>
          import('@features/auth/reset-password/reset-password-page').then(
            (m) => m.ResetPasswordPage,
          ),
      },
    ],
  },
  {
    path: '',
    loadComponent: () => import('@core/layout').then((m) => m.LayoutShell),
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('@features/dashboard/dashboard-page').then((m) => m.DashboardPage),
      },
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'dashboard',
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'dashboard',
  },
];

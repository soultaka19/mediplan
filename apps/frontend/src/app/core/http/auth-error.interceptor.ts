import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

import { AuthFacade } from '../auth/auth.facade';

/**
 * Gère le 401 global : purge l'état d'auth (jeton inclus) et redirige vers
 * `/login`. L'erreur est ensuite repropagée pour que l'appelant puisse réagir.
 *
 * On exclut les appels d'authentification eux-mêmes (`/auth/login`,
 * `/auth/register`) : un 401 y signifie « identifiants invalides » et doit être
 * affiché dans le formulaire, pas déclencher une redirection.
 */
export const authErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthFacade);
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: unknown) => {
      const isAuthEndpoint = req.url.includes('/auth/login') || req.url.includes('/auth/register');

      if (error instanceof HttpErrorResponse && error.status === 401 && !isAuthEndpoint) {
        auth.logout();
        void router.navigate(['/login']);
      }
      return throwError(() => error);
    }),
  );
};

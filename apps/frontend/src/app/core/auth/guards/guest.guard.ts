import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthFacade } from '../auth.facade';

/**
 * Empêche l'accès aux écrans publics (login/register) si déjà connecté.
 *
 * Redirige l'utilisateur authentifié vers l'accueil applicatif.
 */
export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthFacade);
  const router = inject(Router);

  if (!auth.isAuthenticated()) {
    return true;
  }
  return router.createUrlTree(['/']);
};

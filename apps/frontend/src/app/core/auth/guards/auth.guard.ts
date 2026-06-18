import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthFacade } from '../auth.facade';

/**
 * Protège les routes nécessitant une authentification.
 *
 * Non utilisé par un écran réel dans ce ticket, mais câblé et prêt pour les
 * écrans protégés à venir (tableau de bord, RDV, etc.).
 */
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthFacade);
  const router = inject(Router);

  if (auth.isAuthenticated()) {
    return true;
  }
  return router.createUrlTree(['/login']);
};

import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthFacade } from '../auth.facade';
import { UserRole } from '../models/user-role';

/**
 * Fabrique un guard d'autorisation par rôle (RBAC côté client).
 *
 * Usage : `canActivate: [roleGuard('clinic_admin', 'super_admin')]`. C'est un
 * garde-fou UX (équivalent du 403 serveur) — l'autorisation faisant foi reste
 * imposée par l'API. Comportement :
 * - non authentifié → redirige vers `/login` ;
 * - authentifié mais rôle non autorisé → redirige vers `/dashboard` ;
 * - rôle autorisé → laisse passer.
 */
export function roleGuard(...allowedRoles: readonly UserRole[]): CanActivateFn {
  return () => {
    const auth = inject(AuthFacade);
    const router = inject(Router);

    if (!auth.isAuthenticated()) {
      return router.createUrlTree(['/login']);
    }

    const role = auth.currentUser()?.role;
    if (role && allowedRoles.includes(role)) {
      return true;
    }
    return router.createUrlTree(['/dashboard']);
  };
}

import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';

import { TokenStorage } from '../auth/token-storage';

/**
 * Ajoute l'en-tête `Authorization: Bearer <token>` aux requêtes vers l'API.
 *
 * On ne décore que les URLs `/api/` (relatives) afin de ne jamais fuiter le
 * jeton vers un domaine tiers.
 */
export const authBearerInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(TokenStorage).getToken();

  if (token && req.url.startsWith('/api/')) {
    return next(
      req.clone({
        setHeaders: { Authorization: `Bearer ${token}` },
      }),
    );
  }
  return next(req);
};

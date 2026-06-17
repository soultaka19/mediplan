import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { AuthenticatedUser } from '../auth.types';

/**
 * Injecte l'utilisateur authentifié (`request.user`, peuplé par JwtStrategy)
 * dans un paramètre de contrôleur. À n'utiliser que derrière `JwtAuthGuard`.
 *
 * Exemple : `getProfile(@CurrentUser() user: AuthenticatedUser) { ... }`
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthenticatedUser => {
    const request = ctx.switchToHttp().getRequest<Request & { user: AuthenticatedUser }>();
    return request.user;
  },
);

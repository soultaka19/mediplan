import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { AuthenticatedUser } from '../auth.types';
import { UserRole } from '../../user/user-role.enum';
import { ROLES_KEY } from '../decorators/roles.decorator';

/**
 * Guard de contrôle d'accès basé sur les rôles (RBAC, MEDIPLAN-17 / EF-09).
 *
 * Responsabilité unique : vérifier que le rôle de l'utilisateur authentifié figure
 * parmi les rôles requis (`@Roles(...)`). L'AUTHENTIFICATION reste assurée en amont
 * par `JwtAuthGuard` ; ce guard suppose donc `request.user` déjà peuplé.
 *
 * Comportement :
 * - aucun `@Roles(...)` sur la route → autorise (contrôle de rôle opt-in) ;
 * - `request.user` absent (route mal câblée, sans `JwtAuthGuard`) → 403 défensif ;
 * - rôle de l'utilisateur ∈ rôles requis → autorise ; sinon → 403 générique.
 *
 * Le message d'erreur reste volontairement générique (aucune fuite sur les rôles
 * attendus). À utiliser via `@UseGuards(JwtAuthGuard, RolesGuard)`.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Le handler prime sur la classe (override possible au niveau méthode).
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[] | undefined>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Route sans contrainte de rôle : ce guard n'a rien à appliquer.
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request & { user?: AuthenticatedUser }>();
    const user = request.user;

    if (!user) {
      // Ne devrait pas arriver derrière JwtAuthGuard ; on refuse par sécurité.
      throw new ForbiddenException('Accès refusé : rôle insuffisant.');
    }

    if (!requiredRoles.includes(user.role)) {
      throw new ForbiddenException('Accès refusé : rôle insuffisant.');
    }

    return true;
  }
}

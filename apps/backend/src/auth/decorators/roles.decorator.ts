import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../../user/user-role.enum';

/** Clé de métadonnée portant la liste des rôles autorisés sur un handler/contrôleur. */
export const ROLES_KEY = 'roles';

/**
 * Déclare les rôles autorisés à accéder à une route (RBAC, MEDIPLAN-17).
 *
 * À combiner avec `@UseGuards(JwtAuthGuard, RolesGuard)` : `JwtAuthGuard` assure
 * l'authentification (token valide), `RolesGuard` lit ces métadonnées et autorise
 * uniquement si le rôle de l'utilisateur courant en fait partie.
 *
 * Exemple : `@Roles(UserRole.CLINIC_ADMIN, UserRole.SUPER_ADMIN)`.
 * Sans ce décorateur, `RolesGuard` laisse passer (le contrôle de rôle est opt-in).
 */
export const Roles = (...roles: UserRole[]): MethodDecorator & ClassDecorator =>
  SetMetadata(ROLES_KEY, roles);

import { UserRole } from '../user/user-role.enum';

/**
 * Claims portés par l'access token JWT (HS256).
 *
 * - `sub`       : identifiant de l'utilisateur (user.id) — claim standard ;
 * - `role`      : rôle applicatif, base du futur RBAC (MEDIPLAN-17) ;
 * - `clinic_id` : périmètre clinique (null pour les rôles globaux) ;
 * - `email`     : confort côté client, non utilisé comme identité de confiance ;
 * - `iat`/`exp` : ajoutés automatiquement par @nestjs/jwt.
 */
export interface JwtPayload {
  sub: string;
  role: UserRole;
  clinic_id: string | null;
  email: string | null;
  iat?: number;
  exp?: number;
}

/**
 * Identité authentifiée injectée dans `request.user` par la JwtStrategy.
 * Forme normalisée et explicite (pas l'entité TypeORM).
 */
export interface AuthenticatedUser {
  id: string;
  role: UserRole;
  clinicId: string | null;
  email: string | null;
}

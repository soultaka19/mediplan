import { UserRole } from '../../user/user-role.enum';
import { User } from '../../user/user.entity';

/**
 * Vue publique d'un utilisateur renvoyée par l'API.
 *
 * SÉCURITÉ : ne contient JAMAIS `passwordHash`, `failedLoginAttempts` ni
 * `lockedUntil`. On construit explicitement cet objet plutôt que de sérialiser
 * l'entité brute, pour garantir qu'aucun champ sensible ne fuite.
 */
export interface PublicUser {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  role: UserRole;
  clinicId: string | null;
  isActive: boolean;
  createdAt: Date;
}

/** Réponse de connexion : jeton d'accès + utilisateur public. */
export interface AuthResponse {
  accessToken: string;
  tokenType: 'Bearer';
  /** Durée de validité du jeton, telle que configurée (ex. `60m`). */
  expiresIn: string;
  user: PublicUser;
}

/** Projette une entité User vers sa vue publique (sans champs sensibles). */
export function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    clinicId: user.clinicId,
    isActive: user.isActive,
    createdAt: user.createdAt,
  };
}

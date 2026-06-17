import { UserRole } from './user-role';

/**
 * Vue publique d'un utilisateur renvoyée par l'API.
 *
 * Miroir de `PublicUser` côté backend. `createdAt` est une chaîne ISO car
 * sérialisée en JSON sur le réseau (le backend expose un `Date`).
 */
export interface PublicUser {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  role: UserRole;
  clinicId: string | null;
  isActive: boolean;
  createdAt: string;
}

/** Réponse identique pour register (201) et login (200). */
export interface AuthResponse {
  accessToken: string;
  tokenType: 'Bearer';
  /** Durée de validité du jeton telle que configurée (ex. `60m`). */
  expiresIn: string;
  user: PublicUser;
}

/**
 * Corps de la requête d'inscription.
 *
 * SÉCURITÉ : on n'envoie JAMAIS `role` ni `clinicId` — le backend les rejette
 * et force le rôle `patient` pour l'inscription libre-service.
 */
export interface RegisterPayload {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

/** Corps de la requête de connexion. */
export interface LoginPayload {
  email: string;
  password: string;
}

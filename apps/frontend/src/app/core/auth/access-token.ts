import { PublicUser } from './models/auth.models';
import { UserRole } from './models/user-role';

/**
 * Claims portés par l'access token JWT (miroir du backend `auth.types.ts`).
 * Seuls les champs exploités côté client sont décrits.
 */
interface AccessTokenClaims {
  sub: string;
  role: UserRole;
  clinic_id: string | null;
  email: string | null;
  exp?: number;
}

/**
 * Reconstruit une vue utilisateur minimale à partir de l'access token.
 *
 * Utilisé pour réhydrater la session au rechargement de la page : faute
 * d'endpoint `/me`, on s'appuie sur les claims du jeton. Les champs absents des
 * claims (`firstName`, `lastName`, `createdAt`) sont neutres ; ils seront
 * complétés par la réponse d'authentification lors d'un login/register réel.
 *
 * Retourne `null` si le jeton est mal formé ou expiré (le jeton ne doit alors
 * pas être considéré comme une session valide).
 */
export function userFromAccessToken(token: string): PublicUser | null {
  const claims = decodeClaims(token);
  if (!claims) {
    return null;
  }
  // Expiration : `exp` est en secondes (epoch). On rejette un jeton périmé.
  if (typeof claims.exp === 'number' && claims.exp * 1000 <= Date.now()) {
    return null;
  }
  return {
    id: claims.sub,
    email: claims.email ?? null,
    firstName: null,
    lastName: null,
    role: claims.role,
    clinicId: claims.clinic_id ?? null,
    isActive: true,
    consultationDurationMin: 30,
    createdAt: '',
  };
}

/** Décode le payload (2e segment) du JWT, ou `null` si invalide. */
function decodeClaims(token: string): AccessTokenClaims | null {
  const segments = token.split('.');
  if (segments.length !== 3) {
    return null;
  }
  try {
    const json = atob(base64UrlToBase64(segments[1]));
    const payload = JSON.parse(json) as Partial<AccessTokenClaims>;
    if (typeof payload.sub !== 'string' || typeof payload.role !== 'string') {
      return null;
    }
    return payload as AccessTokenClaims;
  } catch {
    return null;
  }
}

/** Convertit un segment base64url (JWT) en base64 standard (pour `atob`). */
function base64UrlToBase64(value: string): string {
  const replaced = value.replace(/-/g, '+').replace(/_/g, '/');
  const padding = replaced.length % 4;
  return padding ? replaced + '='.repeat(4 - padding) : replaced;
}

import { PublicUser } from '@core/auth/models/auth.models';
import { UserRole } from '@core/auth/models/user-role';

/** Un compte du bac à sable, proposé dans le sélecteur de rôles du bandeau. */
export interface DemoAccount {
  readonly email: string;
  readonly role: UserRole;
  readonly firstName: string;
  readonly lastName: string;
}

/** Réponse de `POST /demo/sandbox`. */
export interface DemoSession {
  readonly accessToken: string;
  readonly tokenType: 'Bearer';
  readonly expiresIn: string;
  readonly user: PublicUser;
  readonly clinicId: string;
  readonly clinicName: string;
  /** ISO 8601 : passée cette date, le serveur efface tout. */
  readonly sandboxExpiresAt: string;
  /** Mot de passe commun aux comptes du bac, pour changer de rôle. */
  readonly sharedPassword: string;
  readonly accounts: readonly DemoAccount[];
}

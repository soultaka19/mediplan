import { PublicUser } from '../auth/dto/auth-response.dto';
import { UserRole } from '../user/user-role.enum';

/** Un compte proposé dans le sélecteur de rôles du bandeau de démonstration. */
export interface DemoAccount {
  email: string;
  role: UserRole;
  firstName: string;
  lastName: string;
}

/**
 * Réponse à la création d'un bac à sable : de quoi entrer immédiatement,
 * sans formulaire ni information personnelle.
 */
export interface DemoSession {
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: string;
  user: PublicUser;
  clinicId: string;
  clinicName: string;
  /** ISO 8601. Passée cette date, le serveur efface tout. */
  sandboxExpiresAt: string;
  /** Mot de passe commun aux comptes du bac, pour changer de rôle. */
  sharedPassword: string;
  accounts: DemoAccount[];
}

import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { IsStrongPassword } from '../validators/password-policy.validator';

/**
 * Corps de la requête de réinitialisation effective (POST /auth/reset-password).
 *
 * - `token` : jeton reçu (en clair côté client) ; on en cherchera le hash en base.
 * - `newPassword` : doit respecter la politique de mot de passe (`@IsStrongPassword`),
 *   sinon le ValidationPipe global rejette en HTTP 400.
 */
export class ResetPasswordDto {
  @IsString()
  @IsNotEmpty({ message: 'Le jeton est requis.' })
  @MaxLength(512)
  token: string;

  @IsStrongPassword()
  newPassword: string;
}

import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';
import { IsStrongPassword } from '../validators/password-policy.validator';

/**
 * Corps de la requête d'inscription patient (POST /auth/register).
 *
 * SÉCURITÉ — AC5 (auto-attribution de rôle interdite) :
 * ce DTO n'expose AUCUN champ `role` ni `clinicId`. Combiné au ValidationPipe
 * global (`whitelist: true, forbidNonWhitelisted: true`), tout body contenant
 * `role`/`clinicId` est rejeté en HTTP 400. Le service force par ailleurs
 * `role = patient` et `clinicId = null` côté serveur.
 */
export class RegisterDto {
  @IsEmail({}, { message: "L'adresse e-mail est invalide." })
  @MaxLength(320)
  email: string;

  @IsStrongPassword()
  password: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  firstName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  lastName?: string;
}

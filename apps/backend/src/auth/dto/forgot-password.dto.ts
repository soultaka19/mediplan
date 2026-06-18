import { IsEmail, MaxLength } from 'class-validator';

/**
 * Corps de la requête de demande de réinitialisation (POST /auth/forgot-password).
 *
 * Seul l'email est requis. La réponse est TOUJOURS 202 (anti-énumération) :
 * ce DTO ne valide donc que le format de l'email, sans révéler si le compte existe.
 */
export class ForgotPasswordDto {
  @IsEmail({}, { message: "L'adresse e-mail est invalide." })
  @MaxLength(320)
  email: string;
}

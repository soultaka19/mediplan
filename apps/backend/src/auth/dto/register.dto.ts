import { IsEmail, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { IsStrongPassword } from '../validators/password-policy.validator';

/**
 * Corps de la requête d'inscription patient (POST /auth/register).
 *
 * SÉCURITÉ — AC5 (auto-attribution de rôle interdite) :
 * ce DTO n'expose AUCUN champ `role`. Combiné au ValidationPipe global
 * (`whitelist: true, forbidNonWhitelisted: true`), tout body contenant `role`
 * est rejeté en HTTP 400. Le service force `role = patient` côté serveur.
 *
 * `clinicId` est le SEUL champ de rattachement accepté du client, et seulement
 * depuis MEDIPLAN-21 (réservation par le patient lui-même). Un patient doit
 * pouvoir désigner la clinique où il se fait soigner : sans rattachement, il
 * n'a accès à aucun créneau et son compte est un cul-de-sac.
 *
 * Ce que cette ouverture ne concède PAS :
 * - le rôle reste forcé à `patient`, donc aucune élévation de privilège ;
 * - la valeur est confrontée à la base (clinique existante ET active) avant
 *   d'être écrite ;
 * - le rattachement ne donne accès qu'aux créneaux libres et à ses propres
 *   rendez-vous — jamais aux dossiers des autres patients.
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

  /**
   * Clinique de rattachement, choisie dans l'annuaire public (`GET /clinics`).
   *
   * Optionnelle : un compte sans clinique reste créable (compatibilité avec les
   * inscriptions antérieures à MEDIPLAN-21), il ne peut simplement pas réserver.
   */
  @IsOptional()
  @IsUUID()
  clinicId?: string;
}

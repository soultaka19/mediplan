import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';

/**
 * Corps de la requête de connexion (POST /auth/login).
 *
 * On ne ré-applique PAS la politique de mot de passe ici : un identifiant
 * historique non conforme doit pouvoir tenter de se connecter (la vérification
 * réelle se fait par comparaison de hash). On valide seulement le format minimal
 * pour éviter des entrées vides/aberrantes.
 */
export class LoginDto {
  @IsEmail({}, { message: "L'adresse e-mail est invalide." })
  @MaxLength(320)
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'Le mot de passe est requis.' })
  @MaxLength(200)
  password: string;
}

import { IsEmail, MaxLength } from 'class-validator';
import { IsStrongPassword } from '../../auth/validators/password-policy.validator';

export class ActivateLightPatientDto {
  @IsEmail({}, { message: "L'adresse e-mail est invalide." })
  @MaxLength(320)
  email: string;

  @IsStrongPassword()
  password: string;
}

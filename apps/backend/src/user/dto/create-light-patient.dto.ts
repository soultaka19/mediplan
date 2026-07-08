import { IsEmail, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateLightPatientDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  firstName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  lastName?: string;

  @IsOptional()
  @IsEmail({}, { message: "L'adresse e-mail est invalide." })
  @MaxLength(320)
  email?: string;

  /**
   * Utilise par un super_admin pour cibler la clinique. Ignore pour clinic_admin,
   * dont la clinique vient du JWT.
   */
  @IsOptional()
  @IsUUID()
  clinicId?: string;
}

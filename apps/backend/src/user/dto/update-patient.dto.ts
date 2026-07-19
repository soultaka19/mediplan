import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdatePatientDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  firstName?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  lastName?: string | null;

  @IsOptional()
  @IsEmail({}, { message: "L'adresse e-mail est invalide." })
  @MaxLength(320)
  email?: string | null;
}

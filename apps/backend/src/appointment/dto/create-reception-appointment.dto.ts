import { Type } from 'class-transformer';
import { IsEmail, IsOptional, IsString, IsUUID, MaxLength, ValidateNested } from 'class-validator';

export class ReceptionPatientInputDto {
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
}

export class CreateReceptionAppointmentDto {
  @IsUUID()
  slotId: string;

  @IsOptional()
  @IsUUID()
  patientId?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => ReceptionPatientInputDto)
  patient?: ReceptionPatientInputDto;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

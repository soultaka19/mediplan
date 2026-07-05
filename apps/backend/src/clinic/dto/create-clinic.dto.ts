import { IsBoolean, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

const TIME_MESSAGE = "L'heure doit respecter le format HH:mm.";

export class CreateClinicDto {
  @IsString()
  @MaxLength(150)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  address?: string;

  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: TIME_MESSAGE })
  openingHour?: string;

  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: TIME_MESSAGE })
  closingHour?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

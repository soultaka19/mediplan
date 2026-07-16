import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { AvailabilityType } from '../availability-type.enum';

export class CreateAvailabilityDto {
  /**
   * Requis pour clinic_admin/super_admin. Ignoré pour doctor : le médecin courant
   * crée uniquement ses propres plages.
   */
  @IsOptional()
  @IsUUID()
  doctorId?: string;

  @IsDateString()
  startAt: string;

  @IsDateString()
  endAt: string;

  @IsOptional()
  @IsEnum(AvailabilityType)
  type?: AvailabilityType;

  @IsOptional()
  @IsString()
  note?: string;
}

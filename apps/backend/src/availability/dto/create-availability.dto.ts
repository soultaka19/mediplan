import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
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
  @IsInt()
  @Min(5)
  @Max(240)
  slotDurationMin?: number;

  @IsOptional()
  @IsEnum(AvailabilityType)
  type?: AvailabilityType;

  @IsOptional()
  @IsString()
  note?: string;
}

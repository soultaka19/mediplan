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

export class UpdateAvailabilityDto {
  @IsOptional()
  @IsUUID()
  doctorId?: string;

  @IsOptional()
  @IsDateString()
  startAt?: string;

  @IsOptional()
  @IsDateString()
  endAt?: string;

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

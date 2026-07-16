import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
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
  @IsEnum(AvailabilityType)
  type?: AvailabilityType;

  @IsOptional()
  @IsString()
  note?: string;
}

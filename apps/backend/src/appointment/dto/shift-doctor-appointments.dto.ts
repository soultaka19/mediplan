import { Type } from 'class-transformer';
import { IsInt, IsString, IsUUID, Matches, Max, Min } from 'class-validator';
import { AppointmentResponse } from './appointment-response.dto';

export class ShiftDoctorAppointmentsDto {
  @IsUUID('4')
  doctorId: string;

  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'La date doit etre au format YYYY-MM-DD.',
  })
  date: string;

  @Type(() => Number)
  @IsInt()
  @Min(-240)
  @Max(240)
  minutes: number;
}

export interface ShiftDoctorAppointmentsResponse {
  shiftedCount: number;
  appointments: AppointmentResponse[];
}

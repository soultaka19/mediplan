import { IsEnum } from 'class-validator';
import { AppointmentStatus } from '../appointment-status.enum';

const FLOW_STATUSES = [
  AppointmentStatus.ARRIVED,
  AppointmentStatus.IN_CONSULTATION,
  AppointmentStatus.COMPLETED,
  AppointmentStatus.ABSENT,
] as const;

export type FlowAppointmentStatus = (typeof FLOW_STATUSES)[number];

export class UpdateAppointmentStatusDto {
  @IsEnum(FLOW_STATUSES, {
    message: 'Le statut doit etre arrive, en consultation, termine ou absent.',
  })
  status: FlowAppointmentStatus;
}

export const FLOW_APPOINTMENT_STATUSES: readonly FlowAppointmentStatus[] = FLOW_STATUSES;

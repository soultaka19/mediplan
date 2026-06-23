import { Appointment } from '../appointment.entity';
import { AppointmentStatus } from '../appointment-status.enum';

export interface AppointmentResponse {
  id: string;
  slotId: string;
  clinicId: string;
  patientId: string;
  doctorId: string;
  createdById: string;
  status: AppointmentStatus;
  reason: string | null;
  startAt?: Date;
  endAt?: Date;
  createdAt: Date;
}

export function toAppointmentResponse(appointment: Appointment): AppointmentResponse {
  return {
    id: appointment.id,
    slotId: appointment.slotId,
    clinicId: appointment.clinicId,
    patientId: appointment.patientId,
    doctorId: appointment.doctorId,
    createdById: appointment.createdById,
    status: appointment.status,
    reason: appointment.reason,
    startAt: appointment.slot?.startAt,
    endAt: appointment.slot?.endAt,
    createdAt: appointment.createdAt,
  };
}

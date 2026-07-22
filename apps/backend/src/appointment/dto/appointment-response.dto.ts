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
  cancellationReason: string | null;
  startAt?: Date;
  endAt?: Date;
  patientName?: string;
  doctorName?: string;
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
    cancellationReason: appointment.cancellationReason,
    startAt: appointment.slot?.startAt,
    endAt: appointment.slot?.endAt,
    patientName: displayUserName(appointment.patient),
    doctorName: displayUserName(appointment.doctor),
    createdAt: appointment.createdAt,
  };
}

function displayUserName(user: Appointment['patient'] | undefined): string | undefined {
  if (!user) {
    return undefined;
  }

  const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
  return fullName || user.email || undefined;
}

export type AppointmentStatus =
  | 'booked'
  | 'cancelled'
  | 'arrived'
  | 'in_consultation'
  | 'completed'
  | 'absent';

export interface AppointmentFlowItem {
  id: string;
  slotId: string;
  clinicId: string;
  patientId: string;
  doctorId: string;
  createdById: string;
  status: AppointmentStatus;
  reason: string | null;
  startAt?: string;
  endAt?: string;
  patientName?: string;
  doctorName?: string;
  createdAt: string;
}

export interface UpdateAppointmentStatusPayload {
  status: Extract<AppointmentStatus, 'arrived' | 'in_consultation' | 'completed' | 'absent'>;
}

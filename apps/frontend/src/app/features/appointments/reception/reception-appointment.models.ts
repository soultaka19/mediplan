export interface CreateReceptionAppointmentPayload {
  slotId: string;
  patientId?: string;
  patient?: {
    firstName?: string;
    lastName?: string;
    email?: string;
  };
  reason?: string;
}

export interface ReceptionAppointment {
  id: string;
  slotId: string;
  clinicId: string;
  patientId: string;
  doctorId: string;
  createdById: string;
  status: string;
  reason: string | null;
  startAt?: string;
  endAt?: string;
  patientName?: string;
  doctorName?: string;
  createdAt: string;
}

/** Informations minimales d'un patient léger créé au comptoir. */
export interface ReceptionPatientInput {
  firstName?: string;
  lastName?: string;
  email?: string;
}

/**
 * Charge utile de réservation par la réception.
 *
 * Fournir soit `patientId` (patient existant), soit `patient` (création d'un
 * patient léger au comptoir) — jamais les deux (règle imposée par le backend).
 */
export interface BookReceptionPayload {
  slotId: string;
  patient?: ReceptionPatientInput;
  patientId?: string;
  reason?: string;
}

/** Rendez-vous renvoyé après réservation. */
export interface BookedAppointment {
  id: string;
  status: string;
}

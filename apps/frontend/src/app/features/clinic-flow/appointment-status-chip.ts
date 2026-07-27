import { StatusChipModel } from '@shared/ui';
import { AppointmentStatus } from './appointment-flow.models';

/**
 * Statut de RDV → puce de statut (source unique des libellés, accents corrects).
 * Remplace les maps dupliquées jadis dans clinic-flow / appointments.
 */
export const APPOINTMENT_STATUS_CHIP: Record<AppointmentStatus, StatusChipModel> = {
  booked: { tone: 'booked', label: 'Réservé' },
  arrived: { tone: 'arrived', label: 'Arrivé' },
  in_consultation: { tone: 'active', label: 'En consultation', pulse: true },
  completed: { tone: 'done', label: 'Terminé' },
  absent: { tone: 'absent', label: 'Absent' },
  cancelled: { tone: 'cancelled', label: 'Annulé', strike: true },
};

/** Puce pour un statut de RDV. */
export function appointmentStatusChip(status: AppointmentStatus): StatusChipModel {
  return APPOINTMENT_STATUS_CHIP[status];
}

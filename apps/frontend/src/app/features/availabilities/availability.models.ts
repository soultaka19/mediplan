export type AvailabilityType = 'available' | 'time_off';

export interface Availability {
  id: string;
  doctorId: string;
  clinicId: string;
  startAt: string;
  endAt: string;
  slotDurationMin: number;
  type: AvailabilityType;
  note: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AvailabilitySlot {
  startAt: string;
  endAt: string;
}

/**
 * Créneau matérialisé (persisté) et réservable : porte l'`id` à passer à la
 * réservation réception, et `isBooked` pour n'afficher que les créneaux libres.
 */
export interface MaterializedSlot {
  id: string;
  startAt: string;
  endAt: string;
  isBooked: boolean;
}

export interface CreateAvailabilityPayload {
  doctorId?: string;
  startAt: string;
  endAt: string;
  slotDurationMin?: number;
  type?: AvailabilityType;
  note?: string;
}

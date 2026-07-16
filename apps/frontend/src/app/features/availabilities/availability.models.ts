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

export interface CreateAvailabilityPayload {
  doctorId?: string;
  startAt: string;
  endAt: string;
  type?: AvailabilityType;
  note?: string;
}

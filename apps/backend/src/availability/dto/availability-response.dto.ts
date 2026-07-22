import { Availability } from '../availability.entity';
import { AvailabilityType } from '../availability-type.enum';

export interface AvailabilityResponseDto {
  id: string;
  doctorId: string;
  clinicId: string;
  startAt: Date;
  endAt: Date;
  slotDurationMin: number;
  type: AvailabilityType;
  note: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AvailabilitySlotDto {
  startAt: string;
  endAt: string;
}

/**
 * Créneau matérialisé (persisté) et réservable : porte l'`id` du créneau à
 * passer à `POST /appointments/reception`, et `isBooked` pour masquer/afficher
 * la disponibilité côté réception.
 */
export interface MaterializedSlotDto {
  id: string;
  startAt: string;
  endAt: string;
  isBooked: boolean;
}

export function toAvailabilityResponse(availability: Availability): AvailabilityResponseDto {
  return {
    id: availability.id,
    doctorId: availability.doctorId,
    clinicId: availability.clinicId,
    startAt: availability.startAt,
    endAt: availability.endAt,
    slotDurationMin: availability.slotDurationMin,
    type: availability.type,
    note: availability.note,
    createdAt: availability.createdAt,
    updatedAt: availability.updatedAt,
  };
}

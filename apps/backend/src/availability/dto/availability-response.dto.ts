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

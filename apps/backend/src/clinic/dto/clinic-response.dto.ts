import { Clinic } from '../clinic.entity';

export interface ClinicResponseDto {
  id: string;
  name: string;
  address: string | null;
  openingHour: string | null;
  closingHour: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export function toClinicResponse(clinic: Clinic): ClinicResponseDto {
  return {
    id: clinic.id,
    name: clinic.name,
    address: clinic.address,
    openingHour: clinic.openingHour,
    closingHour: clinic.closingHour,
    isActive: clinic.isActive,
    createdAt: clinic.createdAt,
    updatedAt: clinic.updatedAt,
  };
}

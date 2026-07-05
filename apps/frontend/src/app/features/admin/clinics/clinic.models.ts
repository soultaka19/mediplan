export interface Clinic {
  id: string;
  name: string;
  address: string | null;
  openingHour: string | null;
  closingHour: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateClinicPayload {
  name: string;
  address?: string;
  openingHour?: string;
  closingHour?: string;
  isActive?: boolean;
}

export type UpdateClinicPayload = Partial<CreateClinicPayload>;

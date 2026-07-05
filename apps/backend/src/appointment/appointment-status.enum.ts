export enum AppointmentStatus {
  BOOKED = 'booked',
  CANCELLED = 'cancelled',
  ARRIVED = 'arrived',
  IN_CONSULTATION = 'in_consultation',
  COMPLETED = 'completed',
  ABSENT = 'absent',
}

export const APPOINTMENT_STATUS_VALUES = Object.values(AppointmentStatus);

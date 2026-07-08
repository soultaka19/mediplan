/**
 * Type de plage gérée par le médecin.
 *
 * - `available` : plage ouvrant des créneaux réservables ;
 * - `time_off` : congé / indisponibilité ponctuelle.
 */
export enum AvailabilityType {
  AVAILABLE = 'available',
  TIME_OFF = 'time_off',
}

export const AVAILABILITY_TYPE_VALUES = Object.values(AvailabilityType);

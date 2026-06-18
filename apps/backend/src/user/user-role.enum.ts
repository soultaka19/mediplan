/**
 * Rôles applicatifs (RBAC) — alignés sur le type PostgreSQL natif `user_role`.
 *
 * Sprint 2 : 4 valeurs. Le 5e rôle `receptionist` est prévu au Sprint 3 ;
 * l'ajout se fera via une migration `ALTER TYPE user_role ADD VALUE 'receptionist'`
 * (les enums PostgreSQL sont extensibles par ajout de valeur).
 */
export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  CLINIC_ADMIN = 'clinic_admin',
  DOCTOR = 'doctor',
  PATIENT = 'patient',
}

/** Liste ordonnée des valeurs, source unique pour l'entité et les migrations. */
export const USER_ROLE_VALUES = Object.values(UserRole);

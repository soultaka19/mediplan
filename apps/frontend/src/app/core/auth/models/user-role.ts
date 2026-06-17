/**
 * Rôles applicatifs (RBAC).
 *
 * Aligné strictement sur le backend `apps/backend/src/user/user-role.enum.ts`
 * (Sprint 2 : 4 valeurs). Toute évolution côté backend doit être répercutée ici.
 */
export type UserRole = 'patient' | 'doctor' | 'clinic_admin' | 'super_admin';

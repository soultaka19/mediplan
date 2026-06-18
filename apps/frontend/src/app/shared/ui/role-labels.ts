import { UserRole } from '@core/auth';

/**
 * Libellés français des rôles applicatifs (affichage).
 *
 * Source unique partagée par `RoleBadgeComponent`, le dashboard et tout écran
 * affichant un rôle — évite la duplication (auparavant défini dans
 * `dashboard-page.ts`).
 */
export const ROLE_LABELS: Record<UserRole, string> = {
  patient: 'Patient',
  doctor: 'Médecin',
  clinic_admin: 'Administrateur de clinique',
  super_admin: 'Super administrateur',
};

/** Libellé français d'un rôle, ou chaîne vide si absent. */
export function roleLabel(role: UserRole | null | undefined): string {
  return role ? ROLE_LABELS[role] : '';
}

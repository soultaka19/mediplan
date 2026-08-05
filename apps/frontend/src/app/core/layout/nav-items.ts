import { UserRole } from '@core/auth';

/** Définition d'un item de navigation du sidenav. */
export interface NavItem {
  /** Libellé affiché. */
  label: string;
  /** Icône Material Symbols. */
  icon: string;
  /** Route cible ; `null` si l'écran n'existe pas encore (item désactivé). */
  route: string | null;
  /**
   * Rôles autorisés à voir l'item (RBAC côté affichage).
   *
   * Absent = visible par tous les utilisateurs. Présent = visible uniquement
   * si le rôle courant figure dans la liste. Le masquage est purement UX :
   * l'autorisation réelle reste assurée côté serveur.
   */
  roles?: readonly UserRole[];
}

/**
 * Items de navigation principale (cf. design-system §3, décision client n°5).
 *
 * « Rendez-vous » (prise de RDV réception) et « Utilisateurs » sont réservés aux
 * administrateurs (`clinic_admin` / `super_admin`). L'entrée « Profil » n'est pas
 * listée tant que son écran n'existe pas : on n'affiche pas de fonctionnalité non
 * développée. Ajouter un item ici (avec sa `route`) suffit à l'activer quand
 * l'écran est prêt ; `route: null` reste possible pour un item « bientôt ».
 */
export const NAV_ITEMS: readonly NavItem[] = [
  { label: 'Tableau de bord', icon: 'dashboard', route: '/dashboard' },
  {
    label: 'Disponibilités',
    icon: 'event_note',
    route: '/availabilities',
    roles: ['doctor', 'clinic_admin', 'super_admin'],
  },
  {
    label: 'Rendez-vous',
    icon: 'event',
    route: '/appointments',
    roles: ['clinic_admin', 'super_admin'],
  },
  {
    label: 'Flux du jour',
    icon: 'playlist_add_check',
    route: '/clinic-flow/today',
    roles: ['doctor', 'clinic_admin', 'super_admin'],
  },
  {
    label: 'Statistiques',
    icon: 'monitoring',
    route: '/admin/statistics',
    roles: ['clinic_admin', 'super_admin'],
  },
  {
    label: 'Utilisateurs',
    icon: 'group',
    route: '/admin/users',
    roles: ['clinic_admin', 'super_admin'],
  },
] as const;

/**
 * Filtre les items de navigation visibles pour un rôle donné.
 *
 * Un item sans `roles` est toujours visible (comportement par défaut). Un item
 * restreint n'apparaît que si `role` figure dans `item.roles`. Un `role` null
 * (non authentifié) ne voit que les items non restreints. Fonction pure :
 * facile à tester et réutilisable dans un `computed`.
 */
export function visibleNavItems(items: readonly NavItem[], role: UserRole | null): NavItem[] {
  return items.filter((item) => !item.roles || (role !== null && item.roles.includes(role)));
}

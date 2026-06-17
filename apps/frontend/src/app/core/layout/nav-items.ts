/** Définition d'un item de navigation du sidenav. */
export interface NavItem {
  /** Libellé affiché. */
  label: string;
  /** Icône Material Symbols. */
  icon: string;
  /** Route cible ; `null` si l'écran n'existe pas encore (item désactivé). */
  route: string | null;
}

/**
 * Items de navigation principale (cf. design-system §3, décision client n°5).
 *
 * 3 items : « Tableau de bord » actif, « Rendez-vous » et « Profil » désactivés
 * (« bientôt ») tant que leurs écrans n'existent pas. Ajouter une `route` ici
 * suffira à activer un item quand l'écran sera prêt.
 */
export const NAV_ITEMS: readonly NavItem[] = [
  { label: 'Tableau de bord', icon: 'dashboard', route: '/dashboard' },
  { label: 'Rendez-vous', icon: 'event', route: null },
  { label: 'Profil', icon: 'person', route: null },
] as const;

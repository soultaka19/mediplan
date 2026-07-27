/**
 * Tonalité visuelle d'un `StatusChip`. Chaque tonalité mappe un couple de tokens
 * `--mp-status-{tone}-bg` / `--mp-status-{tone}-fg` (clair + sombre, cf. _theme.scss).
 * Générique et sans dépendance domaine : le même rendu sert RDV, disponibilités
 * et comptes. Le mapping domaine → tonalité vit dans chaque feature.
 */
export type StatusTone = 'booked' | 'arrived' | 'active' | 'done' | 'absent' | 'cancelled';

/** Descripteur d'une puce de statut : tonalité + libellé français + options. */
export interface StatusChipModel {
  tone: StatusTone;
  label: string;
  /** Pastille animée (statut « vivant », ex. en consultation). */
  pulse?: boolean;
  /** Libellé barré (ex. annulé). */
  strike?: boolean;
}

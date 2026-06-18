import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { UserRole } from '@core/auth';
import { roleLabel } from '../role-labels';

/**
 * Puce affichant le rôle de l'utilisateur en français (cf. roadmap UX §3.6).
 *
 * Couleur AA-safe : fond clair tonal (`primary-container`) + texte foncé
 * (`primary`) — jamais de texte blanc sur teal. L'information est portée par le
 * texte, pas seulement par la couleur. Libellés mutualisés via `role-labels`.
 */
@Component({
  selector: 'app-role-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  templateUrl: './role-badge.html',
  styleUrl: './role-badge.scss',
})
export class RoleBadge {
  /** Rôle applicatif à afficher. */
  readonly role = input.required<UserRole>();

  /** Libellé français du rôle. */
  readonly label = computed(() => roleLabel(this.role()));
}

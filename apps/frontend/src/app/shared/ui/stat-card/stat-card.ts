import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

/**
 * Carte de KPI (cf. roadmap UX §3.6).
 *
 * `mat-card` avec filet d'accent teal en bord supérieur, icône Material Symbols,
 * grande valeur (token `--mp-font-kpi-*`) et label. Tant que le backend
 * RDV/stats n'existe pas, la valeur reste un placeholder (« — » par défaut).
 *
 * A11y : la valeur et le label sont liés (`aria-labelledby`), l'icône est
 * décorative (`aria-hidden`). L'information n'est jamais portée par la seule
 * couleur (le filet teal est décoratif, le sens vient du texte).
 */
@Component({
  selector: 'app-stat-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatCardModule, MatIconModule],
  templateUrl: './stat-card.html',
  styleUrl: './stat-card.scss',
})
export class StatCard {
  /** Icône Material Symbols (décorative). */
  readonly icon = input('insights');
  /** Libellé du KPI (ex. « Rendez-vous à venir »). */
  readonly label = input.required<string>();
  /** Valeur affichée ; placeholder « — » tant que les données réelles manquent. */
  readonly value = input('—');
  /** Aide/précision optionnelle sous la valeur (ex. « bientôt »). */
  readonly hint = input('');
}

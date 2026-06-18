import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

/**
 * État vide réutilisable : icône neutre + titre + texte + action optionnelle.
 *
 * Évite les « pages blanches » (cf. design-system §5). L'action est rendue
 * uniquement si `actionLabel` est fourni ; le clic émet `action`.
 */
@Component({
  selector: 'app-empty-state',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule, MatButtonModule],
  templateUrl: './empty-state.html',
  styleUrl: './empty-state.scss',
})
export class EmptyState {
  /** Icône Material Symbols (neutre). */
  readonly icon = input('inbox');
  /** Titre court. */
  readonly title = input.required<string>();
  /**
   * Niveau du titre (`2` ou `3`) pour préserver la hiérarchie des titres de la
   * page hôte. Défaut `2` ; passer `3` quand l'état vide est imbriqué sous une
   * section déjà titrée en `<h2>` (évite deux `<h2>` pour un même bloc).
   */
  readonly headingLevel = input<2 | 3>(2);
  /** Phrase explicative. */
  readonly description = input('');
  /** Libellé de l'action ; si absent, aucun bouton n'est affiché. */
  readonly actionLabel = input('');
  /**
   * Compacte la zone (padding/hauteur réduits) pour les contextes denses, ex.
   * carte « prochain rendez-vous » du dashboard. Défaut `false`.
   */
  readonly dense = input(false);

  /** Émis au clic sur l'action. */
  readonly action = output<void>();
}

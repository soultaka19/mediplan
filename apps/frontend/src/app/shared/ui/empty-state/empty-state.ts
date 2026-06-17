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
  /** Phrase explicative. */
  readonly description = input('');
  /** Libellé de l'action ; si absent, aucun bouton n'est affiché. */
  readonly actionLabel = input('');

  /** Émis au clic sur l'action. */
  readonly action = output<void>();
}

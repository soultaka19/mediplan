import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

/**
 * État d'erreur réutilisable : icône + titre + message + action de reprise.
 *
 * Distinct du bandeau `Alert` (erreur inline d'un formulaire, que l'utilisateur
 * relit) : ici on remplace tout le contenu d'une page/section qui n'a pas pu se
 * charger, et on propose de **réessayer** (cf. design-system §5 — les quatre
 * états). Le bouton n'apparaît que si `showRetry` est vrai ; le clic émet `retry`.
 */
@Component({
  selector: 'app-error-state',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule, MatButtonModule],
  templateUrl: './error-state.html',
  styleUrl: './error-state.scss',
})
export class ErrorState {
  /** Icône Material Symbols. */
  readonly icon = input('cloud_off');
  /** Titre court. */
  readonly title = input('Impossible de charger les données');
  /**
   * Niveau du titre (`2` ou `3`) pour préserver la hiérarchie de la page hôte.
   * Défaut `2` ; passer `3` sous une section déjà titrée.
   */
  readonly headingLevel = input<2 | 3>(2);
  /** Message explicatif (souvent le message d'erreur serveur). */
  readonly message = input('');
  /** Libellé de l'action de reprise. */
  readonly retryLabel = input('Réessayer');
  /** Affiche le bouton de reprise. Défaut `true`. */
  readonly showRetry = input(true);
  /** Zone resserrée pour les contextes denses (cartes). Défaut `false`. */
  readonly dense = input(false);

  /** Émis au clic sur « Réessayer ». */
  readonly retry = output<void>();
}

import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

/**
 * Spinner de chargement centré, réutilisable (page ou section).
 *
 * Le conteneur porte `aria-busy="true"` et un libellé accessible. Cf.
 * design-system §4.2/§5 (états de chargement).
 */
@Component({
  selector: 'app-loading-spinner',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatProgressSpinnerModule],
  templateUrl: './loading-spinner.html',
  styleUrl: './loading-spinner.scss',
})
export class LoadingSpinner {
  /** Libellé accessible (annoncé / visible sous le spinner). */
  readonly label = input('Chargement…');
  /** Diamètre du spinner en pixels. */
  readonly diameter = input(40);
}

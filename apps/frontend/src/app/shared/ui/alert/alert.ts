import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

/** Variantes sémantiques du bandeau (couleur + icône). */
export type AlertVariant = 'error' | 'success' | 'warning' | 'info';

/**
 * Bandeau d'alerte inline persistant (distinct du snackbar transitoire).
 *
 * Usage : message contextuel que l'utilisateur doit pouvoir relire — erreur
 * serveur d'un formulaire (401/409/423…), info. Encapsule le rôle ARIA
 * (`role="alert"`) pour annonce aux lecteurs d'écran. Cf. design-system §4.2/§5.
 */
@Component({
  selector: 'app-alert',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule],
  templateUrl: './alert.html',
  styleUrl: './alert.scss',
})
export class Alert {
  /** Variante visuelle/sémantique. */
  readonly variant = input<AlertVariant>('error');
  /** Message à afficher. */
  readonly message = input.required<string>();

  /** Icône Material Symbols selon la variante. */
  protected readonly icon: Record<AlertVariant, string> = {
    error: 'error',
    success: 'check_circle',
    warning: 'warning',
    info: 'info',
  };
}

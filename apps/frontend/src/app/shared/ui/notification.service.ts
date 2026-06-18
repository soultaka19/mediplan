import { inject, Injectable } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';

/**
 * Service centralisant les notifications transitoires (toasts) via MatSnackBar.
 *
 * Garantit une durée, une position et une politesse ARIA homogènes (cf.
 * design-system §5) :
 * - succès : ~3 s, `polite`, sans action ;
 * - erreur : ~5 s, `assertive`, action « Fermer ».
 *
 * Réservé aux confirmations d'action réussie et aux erreurs non bloquantes.
 * Les erreurs de validation/serveur d'un formulaire passent par AlertComponent
 * (inline), pas par le snackbar.
 */
@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly snackBar = inject(MatSnackBar);

  private static readonly BASE: MatSnackBarConfig = {
    horizontalPosition: 'center',
    verticalPosition: 'bottom',
  };

  /** Confirmation d'action réussie. */
  success(message: string): void {
    this.snackBar.open(message, undefined, {
      ...NotificationService.BASE,
      duration: 3000,
      politeness: 'polite',
      panelClass: 'mp-snackbar-success',
    });
  }

  /** Erreur non bloquante ponctuelle (avec action « Fermer »). */
  error(message: string): void {
    this.snackBar.open(message, 'Fermer', {
      ...NotificationService.BASE,
      duration: 5000,
      politeness: 'assertive',
      panelClass: 'mp-snackbar-error',
    });
  }
}

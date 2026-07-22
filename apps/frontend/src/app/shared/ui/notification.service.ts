import { inject, Injectable } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';

import { NoticeDialog, NoticeDialogData } from './notice-dialog/notice-dialog';

/**
 * Service centralisant les retours d'action de l'application.
 *
 * Deux registres complémentaires (cf. design-system §5) :
 * - **snackbar** transitoire pour les confirmations légères et les erreurs non
 *   bloquantes (succès ~3 s `polite`, erreur ~5 s `assertive` avec « Fermer ») ;
 * - **popup** (`successDialog`) persistant et explicite pour les actions
 *   importantes de création/modification (ajout de disponibilité, réservation,
 *   annulation, suppression) — l'utilisateur lit et ferme lui-même.
 *
 * Les erreurs de validation/serveur d'un formulaire passent par AlertComponent
 * (inline), pas par le snackbar.
 */
@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);

  private static readonly BASE: MatSnackBarConfig = {
    horizontalPosition: 'center',
    verticalPosition: 'bottom',
  };

  /** Confirmation légère (snackbar transitoire). */
  success(message: string): void {
    this.snackBar.open(message, undefined, {
      ...NotificationService.BASE,
      duration: 3000,
      politeness: 'polite',
      panelClass: 'mp-snackbar-success',
    });
  }

  /**
   * Popup de confirmation d'action réussie (persistant, fermé par l'utilisateur).
   * Renvoie la référence du dialogue pour enchaîner sur sa fermeture si besoin
   * (ex. rediriger après « OK »).
   */
  successDialog(title: string, message: string): MatDialogRef<NoticeDialog, true> {
    return this.dialog.open(NoticeDialog, {
      data: { title, message, variant: 'success' } satisfies NoticeDialogData,
      autoFocus: 'dialog',
      restoreFocus: true,
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

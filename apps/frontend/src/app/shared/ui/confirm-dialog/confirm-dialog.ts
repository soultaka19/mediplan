import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

/** Données du dialogue de confirmation générique. */
export interface ConfirmDialogData {
  /** Titre court (ex. « Confirmer »). */
  title: string;
  /** Question explicite (ex. « Marquer le RDV de X comme Terminé ? »). */
  message: string;
  /** Libellé du bouton de confirmation. Défaut « Confirmer ». */
  confirmLabel?: string;
  /** Libellé du bouton d'annulation. Défaut « Annuler ». */
  cancelLabel?: string;
  /** Icône Material Symbols illustrant l'action. Défaut « help ». */
  icon?: string;
  /** Style « destructif » (teinte d'erreur) pour une action irréversible. */
  danger?: boolean;
}

/**
 * Dialogue de confirmation réutilisable : titre + question + Annuler/Confirmer.
 *
 * Rend une action explicite avant de l'exécuter (cf. actions irréversibles du
 * flux clinique : Terminé, Absent). Renvoie `true` à la confirmation, `false`
 * (ou `undefined`) sinon — l'appelant n'agit que sur `true`.
 */
@Component({
  selector: 'app-confirm-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <h2 mat-dialog-title class="confirm-dialog__title">
      <mat-icon aria-hidden="true" [class.confirm-dialog__icon--danger]="data.danger">
        {{ data.icon ?? 'help' }}
      </mat-icon>
      {{ data.title }}
    </h2>
    <mat-dialog-content>
      <p class="confirm-dialog__message">{{ data.message }}</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button matButton type="button" [mat-dialog-close]="false" data-testid="confirm-dialog-cancel">
        {{ data.cancelLabel ?? 'Annuler' }}
      </button>
      <button
        [class]="data.danger ? 'confirm-dialog__confirm--danger' : ''"
        matButton="filled"
        type="button"
        [mat-dialog-close]="true"
        data-testid="confirm-dialog-confirm"
        cdkFocusInitial
      >
        {{ data.confirmLabel ?? 'Confirmer' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: `
    .confirm-dialog__title {
      display: flex;
      align-items: center;
      gap: var(--mp-space-2);
    }

    .confirm-dialog__icon--danger {
      color: var(--mp-color-error);
    }

    .confirm-dialog__message {
      margin: 0;
      min-width: 320px;
      max-width: 42ch;
      color: var(--mp-color-text-secondary);
    }

    .confirm-dialog__confirm--danger {
      --mat-filled-button-container-color: var(--mp-color-error);
    }
  `,
})
export class ConfirmDialog {
  protected readonly data = inject<ConfirmDialogData>(MAT_DIALOG_DATA);
}

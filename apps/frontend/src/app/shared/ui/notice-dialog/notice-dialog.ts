import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

/** Variante visuelle du popup d'information. */
export type NoticeVariant = 'success' | 'info';

/** Données du popup de confirmation/information (une seule action : « OK »). */
export interface NoticeDialogData {
  /** Titre court (ex. « Disponibilité ajoutée »). */
  title: string;
  /** Message clair, éventuellement multi-ligne (détails de l'action). */
  message: string;
  /** Variante : succès (vert, coché) ou info (bleu). Défaut « success ». */
  variant?: NoticeVariant;
  /** Icône Material Symbols. Défaut selon la variante. */
  icon?: string;
  /** Libellé du bouton de fermeture. Défaut « OK ». */
  closeLabel?: string;
}

/**
 * Popup de confirmation d'action réussie : icône + titre + message clair + « OK ».
 *
 * Complète (et, pour les actions importantes, remplace) le snackbar transitoire :
 * une confirmation explicite et persistante que l'utilisateur lit et ferme
 * lui-même — ajout d'une disponibilité, réservation, annulation, suppression.
 */
@Component({
  selector: 'app-notice-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <div class="notice" [class.notice--info]="data.variant === 'info'">
      <span class="notice__badge" aria-hidden="true">
        <mat-icon class="notice__icon">{{ data.icon ?? defaultIcon() }}</mat-icon>
      </span>
      <h2 mat-dialog-title class="notice__title">{{ data.title }}</h2>
      <mat-dialog-content>
        <p class="notice__message">{{ data.message }}</p>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button
          matButton="filled"
          type="button"
          [mat-dialog-close]="true"
          cdkFocusInitial
          data-testid="notice-close"
        >
          {{ data.closeLabel ?? 'OK' }}
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: `
    .notice {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: var(--mp-space-2);
      min-width: min(360px, 80vw);
      max-width: 460px;
    }

    .notice__badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 64px;
      height: 64px;
      margin-top: var(--mp-space-2);
      border-radius: var(--mp-radius-full);
      color: var(--mp-color-success);
      background: color-mix(in srgb, var(--mp-color-success) 14%, transparent);
    }

    .notice--info .notice__badge {
      color: var(--mp-color-info);
      background: color-mix(in srgb, var(--mp-color-info) 14%, transparent);
    }

    .notice__icon {
      width: 34px;
      height: 34px;
      font-size: 34px;
      line-height: 34px;
    }

    .notice__title {
      margin: 0;
      padding: 0;
      font-size: 20px;
      font-weight: 600;
      color: var(--mp-color-text);
    }

    .notice__message {
      margin: 0;
      color: var(--mp-color-text-secondary);
      white-space: pre-line;
    }

    mat-dialog-actions {
      width: 100%;
      justify-content: center;
      padding-bottom: var(--mp-space-2);
    }
  `,
})
export class NoticeDialog {
  protected readonly data = inject<NoticeDialogData>(MAT_DIALOG_DATA);

  protected defaultIcon(): string {
    return this.data.variant === 'info' ? 'info' : 'check_circle';
  }
}

import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

/** Données passées au dialogue : nom du patient (contexte d'affichage). */
export interface CancelDialogData {
  patientName: string;
}

/**
 * Dialogue d'annulation de rendez-vous : saisie d'un **motif obligatoire**.
 *
 * Renvoie le motif (chaîne non vide) à la fermeture « Confirmer », ou `undefined`
 * si l'utilisateur annule le dialogue.
 */
@Component({
  selector: 'app-cancel-appointment-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
  ],
  template: `
    <h2 mat-dialog-title>Annuler le rendez-vous</h2>
    <mat-dialog-content>
      <p>
        Annulation du rendez-vous de <strong>{{ data.patientName }}</strong
        >.
      </p>
      <form [formGroup]="form" (ngSubmit)="confirm()">
        <mat-form-field appearance="outline" class="cancel-dialog__field">
          <mat-label>Motif de l'annulation</mat-label>
          <textarea
            matInput
            formControlName="reason"
            rows="3"
            maxlength="500"
            data-testid="cancel-reason"
          ></textarea>
          @if (form.controls.reason.touched && form.controls.reason.invalid) {
            <mat-error>Le motif est obligatoire.</mat-error>
          }
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button matButton type="button" (click)="dismiss()" data-testid="cancel-dialog-close">
        Fermer
      </button>
      <button
        matButton="filled"
        type="button"
        [disabled]="form.invalid"
        (click)="confirm()"
        data-testid="cancel-dialog-confirm"
      >
        Confirmer l'annulation
      </button>
    </mat-dialog-actions>
  `,
  styles: `
    .cancel-dialog__field {
      width: 100%;
      min-width: 360px;
    }
  `,
})
export class CancelAppointmentDialog {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly dialogRef = inject(MatDialogRef<CancelAppointmentDialog, string>);
  protected readonly data = inject<CancelDialogData>(MAT_DIALOG_DATA);

  readonly form = this.fb.group({
    reason: ['', [Validators.required]],
  });

  confirm(): void {
    const reason = this.form.controls.reason.value.trim();
    if (!reason) {
      this.form.controls.reason.setErrors({ required: true });
      this.form.controls.reason.markAsTouched();
      return;
    }
    this.dialogRef.close(reason);
  }

  dismiss(): void {
    this.dialogRef.close();
  }
}

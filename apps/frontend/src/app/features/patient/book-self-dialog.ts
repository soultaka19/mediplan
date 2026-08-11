import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { finalize } from 'rxjs/operators';

import { authErrorMessage } from '@shared/http/http-error-message';
import { EmptyState, ErrorState, NotificationService } from '@shared/ui';
import { PatientAppointmentsService } from './patient-appointments.service';
import { OpenSlot } from './patient.models';

/** Médecin déduit des créneaux libres (pas d'annuaire exposé au patient). */
interface DoctorChoice {
  readonly id: string;
  readonly name: string;
  readonly slotCount: number;
}

/** Créneaux d'une même journée, pour le regroupement du sélecteur. */
interface SlotDay {
  readonly label: string;
  readonly slots: readonly OpenSlot[];
}

const DAY_FMT = new Intl.DateTimeFormat('fr-CA', { dateStyle: 'full' });
const TIME_FMT = new Intl.DateTimeFormat('fr-CA', { timeStyle: 'short' });

/**
 * Dialogue de prise de rendez-vous **par le patient lui-même** (MEDIPLAN-21).
 *
 * Volontairement plus court que celui de la réception : le patient n'a personne
 * à créer ni à rechercher, il se réserve lui-même. Deux choix — un médecin, une
 * heure — et un motif facultatif.
 *
 * La liste des médecins n'est pas un annuaire : elle est **déduite des créneaux
 * réellement libres**. Un médecin sans disponibilité ouverte n'apparaît donc
 * pas, ce qui évite de proposer un choix qui ne mène à rien.
 */
@Component({
  selector: 'app-book-self-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressBarModule,
    MatSelectModule,
    EmptyState,
    ErrorState,
  ],
  templateUrl: './book-self-dialog.html',
  styleUrl: './book-self-dialog.scss',
})
export class BookSelfDialog {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly patientService = inject(PatientAppointmentsService);
  private readonly notifications = inject(NotificationService);
  private readonly dialogRef = inject(MatDialogRef<BookSelfDialog, boolean>);

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly loadError = signal<string | null>(null);
  readonly slots = signal<readonly OpenSlot[]>([]);

  private readonly selectedDoctorId = signal<string | null>(null);

  readonly form = this.fb.group({
    doctorId: ['', [Validators.required]],
    slotId: this.fb.control({ value: '', disabled: true }, [Validators.required]),
    reason: [''],
  });

  /** Aucun créneau libre dans toute la clinique : l'écran le dit franchement. */
  readonly noSlots = computed(
    () => !this.loading() && this.loadError() === null && this.slots().length === 0,
  );

  /** Médecins ayant au moins un créneau libre, par ordre alphabétique. */
  readonly doctors = computed<readonly DoctorChoice[]>(() => {
    const byDoctor = new Map<string, DoctorChoice>();
    for (const slot of this.slots()) {
      const existing = byDoctor.get(slot.doctorId);
      byDoctor.set(slot.doctorId, {
        id: slot.doctorId,
        name: slot.doctorName,
        slotCount: (existing?.slotCount ?? 0) + 1,
      });
    }
    return [...byDoctor.values()].sort((a, b) => a.name.localeCompare(b.name, 'fr'));
  });

  /**
   * Créneaux du médecin choisi, groupés par journée.
   *
   * Le regroupement n'est pas cosmétique : une liste plate de plusieurs dizaines
   * d'heures consécutives est illisible dès qu'on dépasse une journée.
   */
  readonly slotDays = computed<readonly SlotDay[]>(() => {
    const doctorId = this.selectedDoctorId();
    if (!doctorId) {
      return [];
    }

    const days = new Map<string, OpenSlot[]>();
    for (const slot of this.slots()) {
      if (slot.doctorId !== doctorId) {
        continue;
      }
      // La clé est la date locale du créneau : deux créneaux du même jour se
      // rangent ensemble même si l'un franchit une frontière d'heure UTC.
      const key = new Date(slot.startAt).toDateString();
      const bucket = days.get(key);
      if (bucket) {
        bucket.push(slot);
      } else {
        days.set(key, [slot]);
      }
    }

    return [...days.values()].map((slots) => ({
      label: DAY_FMT.format(new Date(slots[0].startAt)),
      slots,
    }));
  });

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.loadError.set(null);

    this.patientService
      .listOpenSlots()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (slots) => this.slots.set(slots),
        error: (err: unknown) => this.loadError.set(authErrorMessage(err)),
      });
  }

  onDoctorChange(doctorId: string): void {
    this.selectedDoctorId.set(doctorId || null);
    const slotId = this.form.controls.slotId;
    slotId.reset('');
    if (doctorId) {
      slotId.enable();
    } else {
      slotId.disable();
    }
  }

  submit(): void {
    this.error.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const slot = this.slots().find((s) => s.id === value.slotId);
    this.saving.set(true);

    this.patientService
      .bookSelf({
        slotId: value.slotId,
        reason: value.reason.trim() || undefined,
      })
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: () => {
          // Fermer d'abord, afficher la confirmation ensuite : deux dialogues
          // empilés se recouvrent (même convention que la réservation réception).
          this.dialogRef.close(true);
          this.notifications.successDialog(
            'Rendez-vous confirmé',
            slot
              ? `Avec ${slot.doctorName}, le ${DAY_FMT.format(new Date(slot.startAt))} à ${TIME_FMT.format(new Date(slot.startAt))}.`
              : 'Votre rendez-vous a bien été enregistré.',
          );
        },
        // Cas nominal du 409 : quelqu'un a pris le créneau entre l'affichage et
        // la validation. On recharge pour que la liste cesse de mentir.
        error: (err: unknown) => {
          this.error.set(authErrorMessage(err));
          this.load();
          this.form.controls.slotId.reset('');
        },
      });
  }

  cancel(): void {
    this.dialogRef.close(false);
  }

  protected slotLabel(slot: OpenSlot): string {
    return `${TIME_FMT.format(new Date(slot.startAt))} – ${TIME_FMT.format(new Date(slot.endAt))}`;
  }

  protected doctorLabel(doctor: DoctorChoice): string {
    const creneaux = doctor.slotCount > 1 ? 'créneaux libres' : 'créneau libre';
    return `${doctor.name} · ${doctor.slotCount} ${creneaux}`;
  }
}

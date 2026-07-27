import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { forkJoin } from 'rxjs';
import { finalize } from 'rxjs/operators';

import { PublicUser } from '@core/auth';
import { UserService } from '@features/admin/users/user.service';
import { Availability, MaterializedSlot } from '@features/availabilities/availability.models';
import { AvailabilityService } from '@features/availabilities/availability.service';
import { authErrorMessage } from '@shared/http/http-error-message';
import { EmptyState, ErrorState, NotificationService } from '@shared/ui';
import { AppointmentBookingService } from './appointment-booking.service';

/**
 * Dialogue de prise de rendez-vous par la réception.
 *
 * Même parcours que l'écran dédié — médecin → disponibilité → créneau libre →
 * patient léger → motif — mais dans une modale, ouverte depuis l'historique des
 * rendez-vous. En cas de succès, affiche un popup de confirmation puis se ferme
 * en renvoyant `true` (l'appelant recharge la liste).
 */
@Component({
  selector: 'app-book-appointment-dialog',
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
  templateUrl: './book-appointment-dialog.html',
  styleUrl: './book-appointment-dialog.scss',
})
export class BookAppointmentDialog {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly availabilityService = inject(AvailabilityService);
  private readonly userService = inject(UserService);
  private readonly bookingService = inject(AppointmentBookingService);
  private readonly notifications = inject(NotificationService);
  private readonly dialogRef = inject(MatDialogRef<BookAppointmentDialog, boolean>);

  readonly loading = signal(true);
  readonly loadingSlots = signal(false);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly loadError = signal<string | null>(null);
  readonly doctors = signal<readonly PublicUser[]>([]);
  readonly availabilities = signal<readonly Availability[]>([]);
  readonly slots = signal<readonly MaterializedSlot[]>([]);

  private readonly selectedDoctorId = signal<string | null>(null);

  readonly noDoctors = computed(
    () => !this.loading() && this.loadError() === null && this.doctors().length === 0,
  );

  readonly doctorAvailabilities = computed(() =>
    this.availabilities().filter(
      (a) => a.doctorId === this.selectedDoctorId() && a.type === 'available',
    ),
  );

  readonly freeSlots = computed(() => this.slots().filter((s) => !s.isBooked));

  // `availabilityId`/`slotId` sont créés désactivés et (dé)activés en cascade
  // dans les handlers — le patron recommandé par Angular pour l'état désactivé
  // d'un contrôle réactif (au lieu de `[disabled]` dans le template, qui émet un
  // avertissement).
  readonly form = this.fb.group({
    doctorId: ['', [Validators.required]],
    availabilityId: this.fb.control({ value: '', disabled: true }, [Validators.required]),
    slotId: this.fb.control({ value: '', disabled: true }, [Validators.required]),
    firstName: ['', [Validators.required]],
    lastName: ['', [Validators.required]],
    email: ['', [Validators.email]],
    reason: [''],
  });

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.loadError.set(null);

    forkJoin({
      doctors: this.userService.listUsers(),
      availabilities: this.availabilityService.listAvailabilities(),
    })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: ({ doctors, availabilities }) => {
          this.doctors.set(doctors.filter((d) => d.role === 'doctor'));
          this.availabilities.set(availabilities);
        },
        error: (err: unknown) => this.loadError.set(authErrorMessage(err)),
      });
  }

  onDoctorChange(doctorId: string): void {
    this.selectedDoctorId.set(doctorId || null);
    const { availabilityId, slotId } = this.form.controls;
    availabilityId.reset('');
    slotId.reset('');
    slotId.disable();
    this.slots.set([]);
    if (doctorId) availabilityId.enable();
    else availabilityId.disable();
  }

  onAvailabilityChange(availabilityId: string): void {
    const slotId = this.form.controls.slotId;
    slotId.reset('');
    slotId.disable();
    this.slots.set([]);
    if (!availabilityId) {
      return;
    }

    this.loadingSlots.set(true);
    this.availabilityService
      .materializeSlots(availabilityId)
      .pipe(finalize(() => this.loadingSlots.set(false)))
      .subscribe({
        next: (slots) => {
          this.slots.set(slots);
          slotId.enable();
        },
        error: (err: unknown) => this.notifications.error(authErrorMessage(err)),
      });
  }

  submit(): void {
    this.error.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    this.saving.set(true);

    this.bookingService
      .bookByReception({
        slotId: value.slotId,
        patient: {
          firstName: value.firstName.trim(),
          lastName: value.lastName.trim(),
          ...(value.email.trim() ? { email: value.email.trim() } : {}),
        },
        reason: value.reason.trim() || undefined,
      })
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: () => {
          const patient = `${value.firstName.trim()} ${value.lastName.trim()}`.trim();
          const doctor = this.doctors().find((d) => d.id === value.doctorId);
          const doctorName = doctor ? this.doctorLabel(doctor) : 'le médecin';
          const slot = this.slots().find((s) => s.id === value.slotId);
          const when = slot
            ? `${new Intl.DateTimeFormat('fr-CA', { dateStyle: 'long' }).format(new Date(slot.startAt))} à ${new Intl.DateTimeFormat('fr-CA', { timeStyle: 'short' }).format(new Date(slot.startAt))}`
            : '';
          // Fermer d'abord la modale de réservation, PUIS afficher la confirmation
          // (évite l'empilement de deux dialogues). L'appelant recharge la liste
          // via `afterClosed(true)` ; le popup de succès s'affiche par-dessus.
          this.dialogRef.close(true);
          this.notifications.successDialog(
            'Rendez-vous réservé',
            `${patient} — avec ${doctorName}${when ? `, le ${when}` : ''}.`,
          );
        },
        error: (err: unknown) => this.error.set(authErrorMessage(err)),
      });
  }

  cancel(): void {
    this.dialogRef.close(false);
  }

  protected doctorLabel(doctor: PublicUser): string {
    const fullName = [doctor.firstName, doctor.lastName].filter(Boolean).join(' ').trim();
    return fullName || doctor.email || 'Médecin';
  }

  protected availabilityLabel(availability: Availability): string {
    const date = new Intl.DateTimeFormat('fr-CA', { dateStyle: 'full' }).format(
      new Date(availability.startAt),
    );
    return `${date} · ${this.time(availability.startAt)} – ${this.time(availability.endAt)}`;
  }

  protected slotLabel(slot: MaterializedSlot): string {
    const date = new Intl.DateTimeFormat('fr-CA', { dateStyle: 'medium' }).format(
      new Date(slot.startAt),
    );
    return `${date} · ${this.time(slot.startAt)} – ${this.time(slot.endAt)}`;
  }

  private time(value: string): string {
    return new Intl.DateTimeFormat('fr-CA', { timeStyle: 'short' }).format(new Date(value));
  }
}

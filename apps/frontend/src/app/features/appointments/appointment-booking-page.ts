import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { finalize } from 'rxjs/operators';

import { PublicUser } from '@core/auth';
import { UserService } from '@features/admin/users/user.service';
import {
  Availability,
  MaterializedSlot,
} from '@features/availabilities/availability.models';
import { AvailabilityService } from '@features/availabilities/availability.service';
import { authErrorMessage } from '@shared/http/http-error-message';
import { Alert, EmptyState, ErrorState, NotificationService } from '@shared/ui';
import { AppointmentBookingService } from './appointment-booking.service';

/**
 * Prise de rendez-vous par la réception (écran réservé `clinic_admin`/`super_admin`).
 *
 * Parcours : choisir un médecin → une de ses disponibilités → un créneau libre
 * (matérialisé à la volée) → renseigner un patient léger (créé au comptoir) →
 * réserver. En cas de succès, on redirige vers le flux du jour.
 */
@Component({
  selector: 'app-appointment-booking-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    Alert,
    EmptyState,
    ErrorState,
  ],
  templateUrl: './appointment-booking-page.html',
  styleUrl: './appointment-booking-page.scss',
})
export class AppointmentBookingPage {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly availabilityService = inject(AvailabilityService);
  private readonly userService = inject(UserService);
  private readonly bookingService = inject(AppointmentBookingService);
  private readonly notifications = inject(NotificationService);
  private readonly router = inject(Router);

  readonly loading = signal(true);
  readonly loadingSlots = signal(false);
  readonly saving = signal(false);
  /** Erreur inline du formulaire (soumission de la réservation). */
  readonly error = signal<string | null>(null);
  /** Erreur de chargement des données du formulaire (médecins/disponibilités). */
  readonly loadError = signal<string | null>(null);
  readonly doctors = signal<readonly PublicUser[]>([]);
  readonly availabilities = signal<readonly Availability[]>([]);
  readonly slots = signal<readonly MaterializedSlot[]>([]);

  /** Vrai quand le chargement a réussi mais aucun médecin n'est disponible. */
  readonly noDoctors = computed(
    () => !this.loading() && this.loadError() === null && this.doctors().length === 0,
  );

  private readonly selectedDoctorId = signal<string | null>(null);

  /** Disponibilités « available » du médecin sélectionné. */
  readonly doctorAvailabilities = computed(() =>
    this.availabilities().filter(
      (a) => a.doctorId === this.selectedDoctorId() && a.type === 'available',
    ),
  );

  /** Créneaux libres (non réservés) de la disponibilité choisie. */
  readonly freeSlots = computed(() => this.slots().filter((s) => !s.isBooked));

  readonly form = this.fb.group({
    doctorId: ['', [Validators.required]],
    availabilityId: ['', [Validators.required]],
    slotId: ['', [Validators.required]],
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

  /** Changement de médecin : réinitialise dispo/créneau et vide la liste. */
  onDoctorChange(doctorId: string): void {
    this.selectedDoctorId.set(doctorId || null);
    this.form.patchValue({ availabilityId: '', slotId: '' });
    this.slots.set([]);
  }

  /** Changement de disponibilité : matérialise et charge les créneaux libres. */
  onAvailabilityChange(availabilityId: string): void {
    this.form.patchValue({ slotId: '' });
    this.slots.set([]);
    if (!availabilityId) {
      return;
    }

    this.loadingSlots.set(true);
    this.availabilityService
      .materializeSlots(availabilityId)
      .pipe(finalize(() => this.loadingSlots.set(false)))
      .subscribe({
        next: (slots) => this.slots.set(slots),
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
          const message = `${patient} — avec ${doctorName}${when ? `, le ${when}` : ''}.`;
          this.notifications
            .successDialog('Rendez-vous réservé', message)
            .afterClosed()
            .subscribe(() => void this.router.navigate(['/clinic-flow/today']));
        },
        error: (err: unknown) => this.error.set(authErrorMessage(err)),
      });
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

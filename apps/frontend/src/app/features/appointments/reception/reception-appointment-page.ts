import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { forkJoin } from 'rxjs';
import { finalize } from 'rxjs/operators';

import { PublicUser } from '@core/auth';
import { UserService } from '@features/admin/users/user.service';
import { Availability, AvailabilitySlot } from '@features/availabilities/availability.models';
import { AvailabilityService } from '@features/availabilities/availability.service';
import { authErrorMessage } from '@shared/http/http-error-message';
import { Alert, EmptyState, NotificationService, Skeleton } from '@shared/ui';
import { ReceptionAppointmentService } from './reception-appointment.service';

@Component({
  selector: 'app-reception-appointment-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressBarModule,
    MatSelectModule,
    Alert,
    EmptyState,
    Skeleton,
  ],
  templateUrl: './reception-appointment-page.html',
  styleUrl: './reception-appointment-page.scss',
})
export class ReceptionAppointmentPage {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly userService = inject(UserService);
  private readonly availabilityService = inject(AvailabilityService);
  private readonly appointmentService = inject(ReceptionAppointmentService);
  private readonly notifications = inject(NotificationService);

  readonly loading = signal(true);
  readonly savingPatient = signal(false);
  readonly savingAppointment = signal(false);
  readonly generatingSlots = signal(false);
  readonly error = signal<string | null>(null);
  readonly patients = signal<readonly PublicUser[]>([]);
  readonly doctors = signal<readonly PublicUser[]>([]);
  readonly availabilities = signal<readonly Availability[]>([]);
  readonly slots = signal<readonly AvailabilitySlot[]>([]);
  readonly createdPatient = signal<PublicUser | null>(null);

  readonly freeSlots = computed(() => this.slots().filter((slot) => !slot.isBooked));
  readonly isEmpty = computed(
    () => !this.loading() && this.error() === null && this.availabilities().length === 0,
  );

  protected readonly skeletonRows = Array.from({ length: 3 });

  readonly patientForm = this.fb.group({
    firstName: ['', [Validators.maxLength(100)]],
    lastName: ['', [Validators.maxLength(100)]],
    email: ['', [Validators.email, Validators.maxLength(320)]],
  });

  readonly appointmentForm = this.fb.group({
    availabilityId: ['', [Validators.required]],
    slotId: ['', [Validators.required]],
    patientId: [''],
    firstName: ['', [Validators.maxLength(100)]],
    lastName: ['', [Validators.maxLength(100)]],
    email: ['', [Validators.email, Validators.maxLength(320)]],
    reason: ['', [Validators.maxLength(500)]],
  });

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);

    forkJoin({
      users: this.userService.listUsers(),
      availabilities: this.availabilityService.listAvailabilities(),
    })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: ({ users, availabilities }) => {
          this.patients.set(users.filter((user) => user.role === 'patient'));
          this.doctors.set(users.filter((user) => user.role === 'doctor'));
          this.availabilities.set(
            availabilities.filter((availability) => availability.type === 'available'),
          );
        },
        error: (err: unknown) => {
          this.error.set(authErrorMessage(err));
        },
      });
  }

  createLightPatient(): void {
    this.error.set(null);

    if (this.patientForm.invalid) {
      this.patientForm.markAllAsTouched();
      return;
    }

    const value = this.patientForm.getRawValue();
    if (!value.firstName.trim() && !value.lastName.trim() && !value.email.trim()) {
      this.patientForm.controls.firstName.setErrors({ required: true });
      this.patientForm.controls.firstName.markAsTouched();
      return;
    }

    this.savingPatient.set(true);
    this.userService
      .createLightPatient({
        firstName: value.firstName.trim() || undefined,
        lastName: value.lastName.trim() || undefined,
        email: value.email.trim() || undefined,
      })
      .pipe(finalize(() => this.savingPatient.set(false)))
      .subscribe({
        next: (patient) => {
          this.createdPatient.set(patient);
          this.patients.update((patients) => [patient, ...patients]);
          this.appointmentForm.patchValue({ patientId: patient.id });
          this.patientForm.reset();
          this.notifications.success('Patient leger cree.');
        },
        error: (err: unknown) => {
          this.error.set(authErrorMessage(err));
        },
      });
  }

  loadSlots(): void {
    const availabilityId = this.appointmentForm.controls.availabilityId.value;
    this.appointmentForm.patchValue({ slotId: '' });
    this.slots.set([]);

    if (!availabilityId) {
      return;
    }

    this.generatingSlots.set(true);
    this.availabilityService
      .generateSlots(availabilityId)
      .pipe(finalize(() => this.generatingSlots.set(false)))
      .subscribe({
        next: (slots) => this.slots.set(slots),
        error: (err: unknown) => this.error.set(authErrorMessage(err)),
      });
  }

  bookByReception(): void {
    this.error.set(null);

    if (this.appointmentForm.invalid) {
      this.appointmentForm.markAllAsTouched();
      return;
    }

    const value = this.appointmentForm.getRawValue();
    const inlinePatient = {
      firstName: value.firstName.trim() || undefined,
      lastName: value.lastName.trim() || undefined,
      email: value.email.trim() || undefined,
    };
    const hasInlinePatient =
      inlinePatient.firstName !== undefined ||
      inlinePatient.lastName !== undefined ||
      inlinePatient.email !== undefined;

    if (!value.patientId && !hasInlinePatient) {
      this.appointmentForm.controls.firstName.setErrors({ required: true });
      this.appointmentForm.controls.firstName.markAsTouched();
      return;
    }

    this.savingAppointment.set(true);
    this.appointmentService
      .create({
        slotId: value.slotId,
        patientId: value.patientId || undefined,
        patient: value.patientId ? undefined : inlinePatient,
        reason: value.reason.trim() || undefined,
      })
      .pipe(finalize(() => this.savingAppointment.set(false)))
      .subscribe({
        next: () => {
          this.notifications.success('Rendez-vous reserve par la reception.');
          this.appointmentForm.patchValue({
            slotId: '',
            patientId: '',
            firstName: '',
            lastName: '',
            email: '',
            reason: '',
          });
          this.loadSlots();
        },
        error: (err: unknown) => {
          this.error.set(authErrorMessage(err));
        },
      });
  }

  protected personName(user: PublicUser): string {
    const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
    return fullName || user.email || `Patient ${user.id.slice(0, 8)}`;
  }

  protected doctorName(doctorId: string): string {
    const doctor = this.doctors().find((item) => item.id === doctorId);
    if (!doctor) {
      return 'Medecin';
    }
    const fullName = [doctor.firstName, doctor.lastName].filter(Boolean).join(' ').trim();
    return fullName || doctor.email || 'Medecin';
  }

  protected availabilityLabel(availability: Availability): string {
    return `${this.doctorName(availability.doctorId)} - ${this.formatDateTime(
      availability.startAt,
    )}`;
  }

  protected slotLabel(slot: AvailabilitySlot): string {
    return `${this.formatDateTime(slot.startAt)} - ${this.formatDateTime(slot.endAt)}`;
  }

  protected formatDateTime(value: string): string {
    return new Intl.DateTimeFormat('fr-CA', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value));
  }
}

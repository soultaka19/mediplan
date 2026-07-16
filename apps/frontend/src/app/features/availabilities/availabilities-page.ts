import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { forkJoin, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';

import { AuthFacade, PublicUser } from '@core/auth';
import { authErrorMessage } from '@shared/http/http-error-message';
import { Alert, EmptyState, NotificationService, Skeleton } from '@shared/ui';
import { UserService } from '@features/admin/users/user.service';
import { Availability, AvailabilitySlot, AvailabilityType } from './availability.models';
import { AvailabilityService } from './availability.service';

@Component({
  selector: 'app-availabilities-page',
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
    MatTableModule,
    Alert,
    EmptyState,
    Skeleton,
  ],
  templateUrl: './availabilities-page.html',
  styleUrl: './availabilities-page.scss',
})
export class AvailabilitiesPage {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly auth = inject(AuthFacade);
  private readonly availabilityService = inject(AvailabilityService);
  private readonly userService = inject(UserService);
  private readonly notifications = inject(NotificationService);

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly availabilities = signal<readonly Availability[]>([]);
  readonly doctors = signal<readonly PublicUser[]>([]);
  readonly selectedSlots = signal<readonly AvailabilitySlot[]>([]);
  readonly selectedAvailabilityId = signal<string | null>(null);

  readonly currentUser = this.auth.currentUser;
  readonly isDoctor = computed(() => this.currentUser()?.role === 'doctor');
  readonly isEmpty = computed(
    () => !this.loading() && this.error() === null && this.availabilities().length === 0,
  );

  protected readonly displayedColumns = ['type', 'period', 'duration', 'note', 'actions'] as const;
  protected readonly skeletonRows = Array.from({ length: 4 });

  readonly form = this.fb.group({
    doctorId: [''],
    type: ['available' as AvailabilityType, [Validators.required]],
    startAt: ['', [Validators.required]],
    endAt: ['', [Validators.required]],
    note: [''],
  });

  readonly preferenceForm = this.fb.group({
    consultationDurationMin: [30, [Validators.required, Validators.min(5), Validators.max(240)]],
  });

  readonly selectedDoctorDuration = computed(() => {
    if (this.isDoctor()) {
      return this.currentUser()?.consultationDurationMin ?? 30;
    }

    const doctorId = this.form.controls.doctorId.value;
    const doctor = this.doctors().find((item) => item.id === doctorId);
    return doctor?.consultationDurationMin ?? 30;
  });

  constructor() {
    const duration = this.currentUser()?.consultationDurationMin ?? 30;
    this.preferenceForm.controls.consultationDurationMin.setValue(duration);
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);

    const doctors$ = this.isDoctor()
      ? of([] as PublicUser[])
      : this.userService.listUsers().pipe(catchError(() => of([] as PublicUser[])));

    forkJoin({
      availabilities: this.availabilityService.listAvailabilities(),
      doctors: doctors$,
    })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: ({ availabilities, doctors }) => {
          this.availabilities.set(availabilities);
          this.doctors.set(doctors.filter((doctor) => doctor.role === 'doctor'));
        },
        error: (err: unknown) => {
          this.error.set(authErrorMessage(err));
        },
      });
  }

  submit(): void {
    this.error.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    if (!this.isDoctor() && !this.form.controls.doctorId.value) {
      this.form.controls.doctorId.setErrors({ required: true });
      this.form.controls.doctorId.markAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    this.saving.set(true);

    this.availabilityService
      .createAvailability({
        doctorId: this.isDoctor() ? undefined : value.doctorId || undefined,
        type: value.type,
        startAt: this.toIsoDateTime(value.startAt),
        endAt: this.toIsoDateTime(value.endAt),
        note: value.note.trim() || undefined,
      })
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: () => {
          this.notifications.success('Disponibilité ajoutée.');
          this.form.patchValue({
            startAt: '',
            endAt: '',
            note: '',
            type: 'available',
          });
          this.form.markAsPristine();
          this.load();
        },
        error: (err: unknown) => {
          this.error.set(authErrorMessage(err));
        },
      });
  }

  saveDoctorPreference(): void {
    if (this.preferenceForm.invalid) {
      this.preferenceForm.markAllAsTouched();
      return;
    }

    const { consultationDurationMin } = this.preferenceForm.getRawValue();
    this.saving.set(true);

    this.userService
      .updateDoctorPreferences({ consultationDurationMin })
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: (user) => {
          this.preferenceForm.controls.consultationDurationMin.setValue(
            user.consultationDurationMin ?? 30,
          );
          this.auth.refreshCurrentUser();
          this.notifications.success('Preference medecin mise a jour.');
        },
        error: (err: unknown) => {
          this.error.set(authErrorMessage(err));
        },
      });
  }

  deleteAvailability(availability: Availability): void {
    this.availabilityService.deleteAvailability(availability.id).subscribe({
      next: () => {
        this.notifications.success('Disponibilité supprimée.');
        if (this.selectedAvailabilityId() === availability.id) {
          this.selectedAvailabilityId.set(null);
          this.selectedSlots.set([]);
        }
        this.load();
      },
      error: (err: unknown) => {
        this.notifications.error(authErrorMessage(err));
      },
    });
  }

  showSlots(availability: Availability): void {
    this.selectedAvailabilityId.set(availability.id);
    this.availabilityService.generateSlots(availability.id).subscribe({
      next: (slots) => this.selectedSlots.set(slots),
      error: (err: unknown) => this.notifications.error(authErrorMessage(err)),
    });
  }

  protected doctorName(doctorId: string): string {
    const doctor = this.doctors().find((item) => item.id === doctorId);
    if (!doctor) {
      return 'Médecin';
    }
    const fullName = [doctor.firstName, doctor.lastName].filter(Boolean).join(' ').trim();
    return fullName || doctor.email || 'Médecin';
  }

  protected typeLabel(type: AvailabilityType): string {
    return type === 'available' ? 'Disponible' : 'Congé';
  }

  protected formatDateTime(value: string): string {
    return new Intl.DateTimeFormat('fr-CA', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value));
  }

  private toIsoDateTime(value: string): string {
    return new Date(value).toISOString();
  }
}

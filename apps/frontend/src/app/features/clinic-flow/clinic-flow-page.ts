import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';

import { AuthFacade, PublicUser } from '@core/auth';
import { UserService } from '@features/admin/users/user.service';
import { authErrorMessage } from '@shared/http/http-error-message';
import { Alert, EmptyState, NotificationService, Skeleton } from '@shared/ui';
import {
  AppointmentFlowItem,
  AppointmentStatus,
  UpdateAppointmentStatusPayload,
} from './appointment-flow.models';
import { AppointmentFlowService } from './appointment-flow.service';

@Component({
  selector: 'app-clinic-flow-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatTableModule,
    Alert,
    EmptyState,
    Skeleton,
  ],
  templateUrl: './clinic-flow-page.html',
  styleUrl: './clinic-flow-page.scss',
})
export class ClinicFlowPage {
  private readonly auth = inject(AuthFacade);
  private readonly flowService = inject(AppointmentFlowService);
  private readonly userService = inject(UserService);
  private readonly notifications = inject(NotificationService);

  readonly loading = signal(true);
  readonly doctorsLoading = signal(false);
  readonly shifting = signal(false);
  readonly updatingId = signal<string | null>(null);
  readonly error = signal<string | null>(null);
  readonly shiftError = signal<string | null>(null);
  readonly appointments = signal<readonly AppointmentFlowItem[]>([]);
  readonly doctors = signal<readonly PublicUser[]>([]);

  readonly isEmpty = computed(
    () => !this.loading() && this.error() === null && this.appointments().length === 0,
  );
  readonly canShiftAppointments = computed(() => {
    const role = this.auth.currentUser()?.role;
    return role === 'clinic_admin' || role === 'super_admin';
  });

  protected readonly displayedColumns = ['time', 'patient', 'doctor', 'status', 'actions'] as const;
  protected readonly skeletonRows = Array.from({ length: 5 });
  protected readonly shiftForm = new FormGroup({
    doctorId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    date: new FormControl(todayDateInput(), {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(/^\d{4}-\d{2}-\d{2}$/)],
    }),
    minutes: new FormControl(30, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(-240), Validators.max(240)],
    }),
  });

  constructor() {
    this.load();
    if (this.canShiftAppointments()) {
      this.loadDoctors();
    }
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);

    this.flowService.listToday().subscribe({
      next: (appointments) => {
        this.appointments.set(appointments);
        this.loading.set(false);
      },
      error: (err: unknown) => {
        this.error.set(authErrorMessage(err));
        this.loading.set(false);
      },
    });
  }

  updateStatus(
    appointment: AppointmentFlowItem,
    status: UpdateAppointmentStatusPayload['status'],
  ): void {
    if (!this.canSetStatus(appointment.status, status)) {
      return;
    }

    this.updatingId.set(appointment.id);
    this.flowService.updateStatus(appointment.id, { status }).subscribe({
      next: (updated) => {
        this.appointments.update((items) =>
          items.map((item) => (item.id === updated.id ? updated : item)),
        );
        this.updatingId.set(null);
        this.notifications.success('Statut du rendez-vous mis a jour.');
      },
      error: (err: unknown) => {
        this.updatingId.set(null);
        this.notifications.error(authErrorMessage(err));
      },
    });
  }

  shiftDoctorAppointments(): void {
    if (this.shiftForm.invalid) {
      this.shiftForm.markAllAsTouched();
      return;
    }

    const { doctorId, date, minutes } = this.shiftForm.getRawValue();
    if (minutes === 0) {
      this.shiftError.set('Le decalage doit etre different de 0 minute.');
      return;
    }

    this.shifting.set(true);
    this.shiftError.set(null);

    this.flowService.shiftDoctorAppointments({ doctorId, date, minutes }).subscribe({
      next: (result) => {
        this.shifting.set(false);
        this.notifications.success(`${result.shiftedCount} rendez-vous decale(s).`);
        this.load();
      },
      error: (err: unknown) => {
        this.shifting.set(false);
        this.shiftError.set(authErrorMessage(err));
      },
    });
  }

  private loadDoctors(): void {
    this.doctorsLoading.set(true);

    this.userService.listUsers().subscribe({
      next: (users) => {
        const doctors = users.filter((user) => user.role === 'doctor' && user.isActive);
        this.doctors.set(doctors);
        if (!this.shiftForm.controls.doctorId.value && doctors[0]) {
          this.shiftForm.controls.doctorId.setValue(doctors[0].id);
        }
        this.doctorsLoading.set(false);
      },
      error: () => {
        this.doctors.set([]);
        this.doctorsLoading.set(false);
      },
    });
  }

  protected statusLabel(status: AppointmentStatus): string {
    const labels: Record<AppointmentStatus, string> = {
      booked: 'Reserve',
      cancelled: 'Annule',
      arrived: 'Arrive',
      in_consultation: 'En consultation',
      completed: 'Termine',
      absent: 'Absent',
    };
    return labels[status];
  }

  protected canSetStatus(current: AppointmentStatus, next: AppointmentStatus): boolean {
    if (current === next) {
      return false;
    }

    const transitions: Record<AppointmentStatus, readonly AppointmentStatus[]> = {
      booked: ['arrived', 'absent'],
      arrived: ['in_consultation', 'absent'],
      in_consultation: ['completed', 'absent'],
      completed: [],
      absent: [],
      cancelled: [],
    };

    return transitions[current].includes(next);
  }

  protected patientLabel(appointment: AppointmentFlowItem): string {
    return appointment.patientName || `Patient ${appointment.patientId.slice(0, 8)}`;
  }

  protected doctorLabel(appointment: AppointmentFlowItem): string {
    return appointment.doctorName || `Medecin ${appointment.doctorId.slice(0, 8)}`;
  }

  protected displayDoctor(doctor: PublicUser): string {
    const fullName = [doctor.firstName, doctor.lastName].filter(Boolean).join(' ').trim();
    return fullName || doctor.email || `Medecin ${doctor.id.slice(0, 8)}`;
  }
}

function todayDateInput(): string {
  return new Date().toISOString().slice(0, 10);
}

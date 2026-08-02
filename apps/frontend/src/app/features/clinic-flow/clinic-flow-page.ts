import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';

import { AuthFacade } from '@core/auth';
import { authErrorMessage } from '@shared/http/http-error-message';
import { Alert, EmptyState, NotificationService, Skeleton } from '@shared/ui';
import {
  AppointmentFlowItem,
  AppointmentStatus,
  UpdateAppointmentStatusPayload,
} from './appointment-flow.models';
import { AppointmentFlowService } from './appointment-flow.service';
import { CancelAppointmentDialog, CancelDialogData } from './cancel-appointment-dialog';

/** Statuts depuis lesquels un rendez-vous peut encore être annulé. */
const CANCELLABLE_STATUSES: readonly AppointmentStatus[] = ['booked', 'arrived'];

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
    MatTableModule,
    Alert,
    EmptyState,
    Skeleton,
  ],
  templateUrl: './clinic-flow-page.html',
  styleUrl: './clinic-flow-page.scss',
})
export class ClinicFlowPage {
  private readonly flowService = inject(AppointmentFlowService);
  private readonly notifications = inject(NotificationService);
  private readonly dialog = inject(MatDialog);
  private readonly auth = inject(AuthFacade);
  private readonly fb = inject(NonNullableFormBuilder);

  readonly loading = signal(true);
  readonly exporting = signal(false);
  readonly updatingId = signal<string | null>(null);
  readonly error = signal<string | null>(null);
  readonly appointments = signal<readonly AppointmentFlowItem[]>([]);
  readonly exportForm = this.fb.group({
    from: [this.todayInputValue(), [Validators.required]],
    to: [this.todayInputValue(), [Validators.required]],
  });

  /** L'annulation est une action de réception (clinic_admin/super_admin). */
  readonly canCancel = computed(() => {
    const role = this.auth.currentUser()?.role;
    return role === 'clinic_admin' || role === 'super_admin';
  });

  readonly canExport = computed(() => {
    const role = this.auth.currentUser()?.role;
    return role === 'clinic_admin' || role === 'super_admin';
  });

  readonly isEmpty = computed(
    () => !this.loading() && this.error() === null && this.appointments().length === 0,
  );

  protected readonly displayedColumns = ['time', 'patient', 'doctor', 'status', 'actions'] as const;
  protected readonly skeletonRows = Array.from({ length: 5 });

  constructor() {
    this.load();
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

  exportCsv(): void {
    if (this.exportForm.invalid) {
      this.exportForm.markAllAsTouched();
      return;
    }

    const { from, to } = this.exportForm.getRawValue();
    if (from > to) {
      this.notifications.error('La date de debut doit etre avant la date de fin.');
      return;
    }

    this.exporting.set(true);
    this.flowService.exportCsv(from, to).subscribe({
      next: (blob) => {
        this.exporting.set(false);
        this.downloadBlob(blob, `mediplan-rendez-vous-${from}-${to}.csv`);
        this.notifications.success('Export CSV telecharge.');
      },
      error: (err: unknown) => {
        this.exporting.set(false);
        this.notifications.error(authErrorMessage(err));
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

  /** Vrai si le rendez-vous est encore annulable (aligné sur le backend). */
  protected isCancellable(status: AppointmentStatus): boolean {
    return CANCELLABLE_STATUSES.includes(status);
  }

  /** Ouvre le dialogue de motif puis annule le rendez-vous (libère le créneau). */
  cancel(appointment: AppointmentFlowItem): void {
    const data: CancelDialogData = { patientName: this.patientLabel(appointment) };
    this.dialog
      .open(CancelAppointmentDialog, { data })
      .afterClosed()
      .subscribe((reason?: string) => {
        if (!reason) {
          return;
        }
        this.updatingId.set(appointment.id);
        this.flowService.cancel(appointment.id, reason).subscribe({
          next: () => {
            this.updatingId.set(null);
            this.notifications.success('Rendez-vous annulé.');
            this.load();
          },
          error: (err: unknown) => {
            this.updatingId.set(null);
            this.notifications.error(authErrorMessage(err));
          },
        });
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

  private todayInputValue(): string {
    return new Date().toISOString().slice(0, 10);
  }

  private downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }
}

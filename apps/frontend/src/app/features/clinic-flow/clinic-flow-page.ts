import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';

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
  imports: [DatePipe, MatButtonModule, MatIconModule, MatTableModule, Alert, EmptyState, Skeleton],
  templateUrl: './clinic-flow-page.html',
  styleUrl: './clinic-flow-page.scss',
})
export class ClinicFlowPage {
  private readonly flowService = inject(AppointmentFlowService);
  private readonly notifications = inject(NotificationService);

  readonly loading = signal(true);
  readonly updatingId = signal<string | null>(null);
  readonly error = signal<string | null>(null);
  readonly appointments = signal<readonly AppointmentFlowItem[]>([]);

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
}

import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';

import { authErrorMessage } from '@shared/http/http-error-message';
import { EmptyState, ErrorState, Skeleton } from '@shared/ui';
import { AppointmentFlowItem, AppointmentStatus } from '@features/clinic-flow/appointment-flow.models';
import { AppointmentFlowService } from '@features/clinic-flow/appointment-flow.service';
import { BookAppointmentDialog } from './book-appointment-dialog';

/**
 * Historique des rendez-vous du périmètre (onglet « Rendez-vous »).
 *
 * Liste tous les rendez-vous (tous statuts, plus récents d'abord) avec les quatre
 * états (chargement, erreur+reprise, vide, succès), une recherche et une
 * pagination côté client. Le bouton « Ajouter » ouvre la réservation en modale ;
 * au succès, la liste est rechargée.
 */
@Component({
  selector: 'app-appointments-history-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatPaginatorModule,
    MatTableModule,
    EmptyState,
    ErrorState,
    Skeleton,
  ],
  templateUrl: './appointments-history-page.html',
  styleUrl: './appointments-history-page.scss',
})
export class AppointmentsHistoryPage {
  private readonly flowService = inject(AppointmentFlowService);
  private readonly dialog = inject(MatDialog);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly appointments = signal<readonly AppointmentFlowItem[]>([]);
  readonly searchTerm = signal('');
  readonly filteredCount = signal(0);

  readonly dataSource = new MatTableDataSource<AppointmentFlowItem>([]);
  private readonly paginator = viewChild(MatPaginator);

  readonly isEmpty = computed(
    () => !this.loading() && this.error() === null && this.appointments().length === 0,
  );

  protected readonly displayedColumns = ['datetime', 'patient', 'doctor', 'status', 'reason'] as const;
  protected readonly skeletonRows = Array.from({ length: 6 });

  constructor() {
    this.dataSource.filterPredicate = (item, filter) =>
      [
        this.patientLabel(item),
        this.doctorLabel(item),
        this.statusLabel(item.status),
        item.reason ?? '',
      ]
        .join(' ')
        .toLowerCase()
        .includes(filter);

    effect(() => {
      this.dataSource.paginator = this.paginator() ?? null;
    });

    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);

    this.flowService.listAll().subscribe({
      next: (appointments) => {
        this.appointments.set(appointments);
        this.dataSource.data = [...appointments];
        this.applyFilter(this.searchTerm());
        this.loading.set(false);
      },
      error: (err: unknown) => {
        this.error.set(authErrorMessage(err));
        this.loading.set(false);
      },
    });
  }

  applyFilter(value: string): void {
    this.searchTerm.set(value);
    this.dataSource.filter = value.trim().toLowerCase();
    this.filteredCount.set(this.dataSource.filteredData.length);
    this.dataSource.paginator?.firstPage();
  }

  /** Ouvre la réservation en modale ; recharge la liste si un RDV a été créé. */
  openBooking(): void {
    this.dialog
      .open(BookAppointmentDialog, { autoFocus: 'dialog', restoreFocus: true })
      .afterClosed()
      .subscribe((created?: boolean) => {
        if (created) {
          this.load();
        }
      });
  }

  protected statusLabel(status: AppointmentStatus): string {
    const labels: Record<AppointmentStatus, string> = {
      booked: 'Réservé',
      cancelled: 'Annulé',
      arrived: 'Arrivé',
      in_consultation: 'En consultation',
      completed: 'Terminé',
      absent: 'Absent',
    };
    return labels[status];
  }

  protected patientLabel(appointment: AppointmentFlowItem): string {
    return appointment.patientName || `Patient ${appointment.patientId.slice(0, 8)}`;
  }

  protected doctorLabel(appointment: AppointmentFlowItem): string {
    return appointment.doctorName || `Medecin ${appointment.doctorId.slice(0, 8)}`;
  }

  protected reasonLabel(appointment: AppointmentFlowItem): string {
    if (appointment.status === 'cancelled' && appointment.cancellationReason) {
      return `Annulé : ${appointment.cancellationReason}`;
    }
    return appointment.reason || '—';
  }
}

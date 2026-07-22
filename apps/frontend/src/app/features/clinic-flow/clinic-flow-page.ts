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

import { AuthFacade } from '@core/auth';
import { authErrorMessage } from '@shared/http/http-error-message';
import {
  ConfirmDialog,
  ConfirmDialogData,
  EmptyState,
  ErrorState,
  NotificationService,
  Skeleton,
} from '@shared/ui';
import {
  AppointmentFlowItem,
  AppointmentStatus,
  UpdateAppointmentStatusPayload,
} from './appointment-flow.models';
import { AppointmentFlowService } from './appointment-flow.service';
import { CancelAppointmentDialog, CancelDialogData } from './cancel-appointment-dialog';

/** Statuts depuis lesquels un rendez-vous peut encore être annulé. */
const CANCELLABLE_STATUSES: readonly AppointmentStatus[] = ['booked', 'arrived'];

/** Action de changement de statut proposée dans le menu « Actions ». */
interface FlowAction {
  status: UpdateAppointmentStatusPayload['status'];
  label: string;
  icon: string;
}

/** Catalogue des transitions possibles (filtré par ligne selon le statut courant). */
const FLOW_ACTIONS: readonly FlowAction[] = [
  { status: 'arrived', label: 'Arrivé', icon: 'login' },
  { status: 'in_consultation', label: 'En consultation', icon: 'stethoscope' },
  { status: 'completed', label: 'Terminé', icon: 'task_alt' },
  { status: 'absent', label: 'Absent', icon: 'person_off' },
];

/**
 * Statuts « terminaux » (irréversibles) : on demande une confirmation explicite
 * avant de les appliquer. Les étapes intermédiaires (Arrivé, En consultation)
 * s'appliquent directement pour ne pas alourdir le geste courant.
 */
const CONFIRM_STATUSES: readonly AppointmentStatus[] = ['completed', 'absent'];

@Component({
  selector: 'app-clinic-flow-page',
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
  templateUrl: './clinic-flow-page.html',
  styleUrl: './clinic-flow-page.scss',
})
export class ClinicFlowPage {
  private readonly flowService = inject(AppointmentFlowService);
  private readonly notifications = inject(NotificationService);
  private readonly dialog = inject(MatDialog);
  private readonly auth = inject(AuthFacade);

  readonly loading = signal(true);
  readonly updatingId = signal<string | null>(null);
  readonly error = signal<string | null>(null);
  readonly appointments = signal<readonly AppointmentFlowItem[]>([]);
  /** Terme de recherche courant (pour le message « aucun résultat »). */
  readonly searchTerm = signal('');
  /** Nombre de lignes après filtre (0 = aucun résultat pour la recherche). */
  readonly filteredCount = signal(0);

  /** Source de données Material : pilote filtre + pagination sur la table. */
  readonly dataSource = new MatTableDataSource<AppointmentFlowItem>([]);
  private readonly paginator = viewChild(MatPaginator);

  /** L'annulation est une action de réception (clinic_admin/super_admin). */
  readonly canCancel = computed(() => {
    const role = this.auth.currentUser()?.role;
    return role === 'clinic_admin' || role === 'super_admin';
  });

  readonly isEmpty = computed(
    () => !this.loading() && this.error() === null && this.appointments().length === 0,
  );

  protected readonly displayedColumns = ['time', 'patient', 'doctor', 'status', 'actions'] as const;
  protected readonly skeletonRows = Array.from({ length: 5 });

  constructor() {
    // Filtre sur patient + médecin + libellé de statut (recherche « humaine »).
    this.dataSource.filterPredicate = (item, filter) => {
      const haystack = [
        this.patientLabel(item),
        this.doctorLabel(item),
        this.statusLabel(item.status),
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(filter);
    };

    // Branche la pagination dès que le composant paginator apparaît (état succès).
    effect(() => {
      this.dataSource.paginator = this.paginator() ?? null;
    });

    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);

    this.flowService.listToday().subscribe({
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

  /** Applique le filtre de recherche et met à jour le compteur de résultats. */
  applyFilter(value: string): void {
    this.searchTerm.set(value);
    this.dataSource.filter = value.trim().toLowerCase();
    this.filteredCount.set(this.dataSource.filteredData.length);
    this.dataSource.paginator?.firstPage();
  }

  /** Actions de statut valides pour ce rendez-vous (menu contextuel). */
  protected availableActions(appointment: AppointmentFlowItem): FlowAction[] {
    return FLOW_ACTIONS.filter((action) => this.canSetStatus(appointment.status, action.status));
  }

  /** Vrai s'il existe au moins une action (statut ou annulation) pour la ligne. */
  protected hasActions(appointment: AppointmentFlowItem): boolean {
    return (
      this.availableActions(appointment).length > 0 ||
      (this.canCancel() && this.isCancellable(appointment.status))
    );
  }

  updateStatus(
    appointment: AppointmentFlowItem,
    status: UpdateAppointmentStatusPayload['status'],
  ): void {
    if (!this.canSetStatus(appointment.status, status) || this.updatingId() === appointment.id) {
      return;
    }

    // Étapes intermédiaires : appliquées directement. Statuts terminaux
    // (Terminé / Absent) : confirmation explicite au préalable.
    if (!CONFIRM_STATUSES.includes(status)) {
      this.applyStatus(appointment, status);
      return;
    }

    const label = FLOW_ACTIONS.find((action) => action.status === status)?.label ?? '';
    this.dialog
      .open(ConfirmDialog, {
        data: {
          title: 'Confirmer l’action',
          message: `Marquer le rendez-vous de ${this.patientLabel(appointment)} comme « ${label} » ?`,
          confirmLabel: label,
          icon: status === 'absent' ? 'person_off' : 'task_alt',
          danger: status === 'absent',
        } satisfies ConfirmDialogData,
      })
      .afterClosed()
      .subscribe((confirmed: boolean) => {
        if (confirmed) {
          this.applyStatus(appointment, status);
        }
      });
  }

  private applyStatus(
    appointment: AppointmentFlowItem,
    status: UpdateAppointmentStatusPayload['status'],
  ): void {
    this.updatingId.set(appointment.id);
    this.flowService.updateStatus(appointment.id, { status }).subscribe({
      next: (updated) => {
        this.appointments.update((items) =>
          items.map((item) => (item.id === updated.id ? updated : item)),
        );
        this.dataSource.data = [...this.appointments()];
        this.applyFilter(this.searchTerm());
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
            this.notifications.successDialog(
              'Rendez-vous annulé',
              `Le rendez-vous de ${this.patientLabel(appointment)} a été annulé. Le créneau est de nouveau disponible.`,
            );
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
}

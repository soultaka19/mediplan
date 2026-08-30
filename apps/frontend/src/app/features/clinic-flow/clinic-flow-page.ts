import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';

import { AuthFacade } from '@core/auth';
import { authErrorMessage } from '@shared/http/http-error-message';
import { ConfirmDialog, ConfirmDialogData, NotificationService, StatusChip } from '@shared/ui';
import { appointmentStatusChip } from './appointment-status-chip';
import {
  AppointmentFlowItem,
  AppointmentStatus,
  UpdateAppointmentStatusPayload,
} from './appointment-flow.models';
import { AppointmentFlowService } from './appointment-flow.service';
import { CancelAppointmentDialog, CancelDialogData } from './cancel-appointment-dialog';

/** Statuts depuis lesquels un rendez-vous peut encore être annulé. */
const CANCELLABLE_STATUSES: readonly AppointmentStatus[] = ['booked', 'arrived'];

/** Statuts « terminaux » (irréversibles) : confirmation explicite avant application. */
const CONFIRM_STATUSES: readonly AppointmentStatus[] = ['completed', 'absent'];

/** Transition « avancer » principale (bouton d'action de la ligne). */
const FORWARD: Partial<Record<AppointmentStatus, UpdateAppointmentStatusPayload['status']>> = {
  booked: 'arrived',
  arrived: 'in_consultation',
  in_consultation: 'completed',
};

/** Libellés des transitions (bouton d'avancement + menu). */
const STATUS_ACTION_LABEL: Record<UpdateAppointmentStatusPayload['status'], string> = {
  arrived: 'Marquer arrivé',
  in_consultation: 'Démarrer la consultation',
  completed: 'Terminer',
  absent: 'Marquer absent',
};

/** Statuts « en cours » (groupe actif, mis en avant). */
const ACTIVE_STATUSES: readonly AppointmentStatus[] = ['arrived', 'in_consultation'];
/** Statuts « clôturés » (atténués, sans disparaître). */
const DONE_STATUSES: readonly AppointmentStatus[] = ['completed', 'absent', 'cancelled'];

/** Action secondaire (menu ⋯). */
interface FlowMenuAction {
  status: UpdateAppointmentStatusPayload['status'];
  label: string;
  icon: string;
}

/** Ligne prête à l'affichage (view model dérivé d'un `AppointmentFlowItem`). */
export interface FlowRow {
  readonly item: AppointmentFlowItem;
  readonly time: string;
  readonly patient: string;
  readonly meta: string;
  readonly chip: ReturnType<typeof appointmentStatusChip>;
  readonly nextStatus: UpdateAppointmentStatusPayload['status'] | null;
  readonly nextLabel: string;
  readonly menuActions: readonly FlowMenuAction[];
  readonly cancellable: boolean;
  readonly pending: boolean;
}

/** Formate un horaire ISO en « 09 h 30 » (convention FR-CA de l'app). */
function frTime(iso: string | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh} h ${mm}`;
}

/**
 * Flux clinique du jour (redesign MediPlan.dc.html §flux).
 *
 * File du jour groupée par état : **En cours** (mis en avant), **À venir** et
 * **Clôturés** (atténués, non-disparus). Un clic sur le bouton d'avancement =
 * une transition (spinner par ligne) ; les statuts terminaux (Terminé/Absent)
 * demandent confirmation. Les autres actions (annuler, marquer absent) sont dans
 * le menu ⋯. Logique métier inchangée : transitions, annulation, notifications.
 */
@Component({
  selector: 'app-clinic-flow-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NgTemplateOutlet,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatMenuModule,
    StatusChip,
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
  readonly refreshing = signal(false);
  readonly exporting = signal(false);
  readonly updatingId = signal<string | null>(null);
  /** Ligne à surligner brièvement après une transition réussie (flash de succès). */
  readonly flashId = signal<string | null>(null);
  readonly error = signal<string | null>(null);
  readonly appointments = signal<readonly AppointmentFlowItem[]>([]);
  private readonly lastSync = signal<Date | null>(null);
  readonly exportForm = this.fb.group({
    from: [this.todayInputValue(), [Validators.required]],
    to: [this.todayInputValue(), [Validators.required]],
  });

  /** L'annulation est une action de réception (clinic_admin/super_admin). */
  readonly canCancel = computed(() => {
    const role = this.auth.currentUser()?.role;
    return role === 'clinic_admin' || role === 'super_admin';
  });

  /** L'export CSV est lui aussi une action de réception. */
  readonly canExport = computed(() => {
    const role = this.auth.currentUser()?.role;
    return role === 'clinic_admin' || role === 'super_admin';
  });

  /** Squelettes de chargement initial. */
  protected readonly skeletonRows = Array.from({ length: 5 });

  private readonly rows = computed<readonly FlowRow[]>(() => {
    const pending = this.updatingId();
    return this.appointments()
      .map((item) => this.toRow(item, item.id === pending))
      .sort((a, b) => (a.item.startAt ?? '').localeCompare(b.item.startAt ?? ''));
  });

  readonly activeRows = computed(() =>
    this.rows().filter((r) => ACTIVE_STATUSES.includes(r.item.status)),
  );
  readonly upcomingRows = computed(() => this.rows().filter((r) => r.item.status === 'booked'));
  readonly doneRows = computed(() =>
    this.rows().filter((r) => DONE_STATUSES.includes(r.item.status)),
  );

  readonly hasAny = computed(() => this.rows().length > 0);
  readonly isEmpty = computed(() => !this.loading() && this.error() === null && !this.hasAny());

  /** Libellé de synchronisation (« à l'instant » / « à 10 h 41 »). */
  readonly syncLabel = computed(() => {
    const at = this.lastSync();
    if (!at) return '';
    return `à ${frTime(at.toISOString())}`;
  });

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.fetch();
  }

  /** Ré-synchronise sans vider l'écran (spinner discret dans l'en-tête). */
  refresh(): void {
    if (this.refreshing()) return;
    this.refreshing.set(true);
    this.error.set(null);
    this.fetch();
  }

  private fetch(): void {
    this.flowService.listToday().subscribe({
      next: (appointments) => {
        this.appointments.set(appointments);
        this.lastSync.set(new Date());
        this.loading.set(false);
        this.refreshing.set(false);
      },
      error: (err: unknown) => {
        this.error.set(authErrorMessage(err));
        this.loading.set(false);
        this.refreshing.set(false);
      },
    });
  }

  /** Avance le rendez-vous d'une étape (bouton principal de la ligne). */
  advance(row: FlowRow): void {
    if (row.nextStatus) {
      this.updateStatus(row.item, row.nextStatus);
    }
  }

  /** Surligne brièvement une ligne après une transition réussie (retour de succès). */
  private flashSuccess(id: string): void {
    this.flashId.set(id);
    setTimeout(() => {
      if (this.flashId() === id) this.flashId.set(null);
    }, 900);
  }

  /** Télécharge l'export CSV de la période saisie (MEDIPLAN-27). */
  exportCsv(): void {
    if (this.exportForm.invalid) {
      this.exportForm.markAllAsTouched();
      return;
    }

    const { from, to } = this.exportForm.getRawValue();
    if (from > to) {
      this.notifications.error('La date de début doit être avant la date de fin.');
      return;
    }

    this.exporting.set(true);
    this.flowService.exportCsv(from, to).subscribe({
      next: (blob) => {
        this.exporting.set(false);
        this.downloadBlob(blob, `mediplan-rendez-vous-${from}-${to}.csv`);
        this.notifications.success('Export CSV téléchargé.');
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
    if (!this.canSetStatus(appointment.status, status) || this.updatingId() === appointment.id) {
      return;
    }

    // Étapes intermédiaires : appliquées directement. Statuts terminaux
    // (Terminé / Absent) : confirmation explicite au préalable.
    if (!CONFIRM_STATUSES.includes(status)) {
      this.applyStatus(appointment, status);
      return;
    }

    const label = status === 'completed' ? 'Terminé' : 'Absent';
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
        this.updatingId.set(null);
        this.flashSuccess(updated.id);
        this.notifications.success('Statut du rendez-vous mis à jour.');
      },
      error: (err: unknown) => {
        this.updatingId.set(null);
        this.notifications.error(authErrorMessage(err));
      },
    });
  }

  /** Ouvre le dialogue de motif puis annule le rendez-vous (libère le créneau). */
  cancel(appointment: AppointmentFlowItem): void {
    const data: CancelDialogData = { patientName: this.patientLabel(appointment) };
    this.dialog
      .open(CancelAppointmentDialog, { data })
      .afterClosed()
      .subscribe((reason?: string) => {
        if (!reason) return;
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

  /** Construit le view model d'une ligne. */
  private toRow(item: AppointmentFlowItem, pending: boolean): FlowRow {
    const nextStatus = FORWARD[item.status] ?? null;
    const menuActions = this.menuActions(item, nextStatus);
    const doctor = this.doctorLabel(item);
    const reason = item.reason?.trim() ? item.reason : 'Consultation';
    return {
      item,
      time: frTime(item.startAt),
      patient: this.patientLabel(item),
      meta: `${doctor} · ${reason}`,
      chip: appointmentStatusChip(item.status),
      nextStatus,
      nextLabel: nextStatus ? STATUS_ACTION_LABEL[nextStatus] : '',
      menuActions,
      cancellable: this.canCancel() && CANCELLABLE_STATUSES.includes(item.status),
      pending,
    };
  }

  /** Actions secondaires (menu ⋯) : transitions valides hors avancement principal. */
  private menuActions(
    item: AppointmentFlowItem,
    primary: UpdateAppointmentStatusPayload['status'] | null,
  ): FlowMenuAction[] {
    const actions: FlowMenuAction[] = [];
    if (item.status !== 'completed' && item.status !== 'cancelled' && item.status !== 'absent') {
      if (primary !== 'absent' && this.canSetStatus(item.status, 'absent')) {
        actions.push({ status: 'absent', label: 'Marquer absent', icon: 'person_off' });
      }
    }
    return actions;
  }

  private canSetStatus(current: AppointmentStatus, next: AppointmentStatus): boolean {
    if (current === next) return false;
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

  private patientLabel(appointment: AppointmentFlowItem): string {
    return appointment.patientName || `Patient ${appointment.patientId.slice(0, 8)}`;
  }

  private doctorLabel(appointment: AppointmentFlowItem): string {
    return appointment.doctorName || `Médecin ${appointment.doctorId.slice(0, 8)}`;
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

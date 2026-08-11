import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

import { AppointmentFlowItem } from '@features/clinic-flow/appointment-flow.models';
import { appointmentStatusChip } from '@features/clinic-flow/appointment-status-chip';
import { authErrorMessage } from '@shared/http/http-error-message';
import { Alert, EmptyState, StatusChip, StatusChipModel } from '@shared/ui';
import { BookSelfDialog } from './book-self-dialog';
import { PatientAppointmentsService } from './patient-appointments.service';

/** Ligne prête à l'affichage. */
interface MyAppointmentRow {
  readonly id: string;
  readonly date: string;
  readonly time: string;
  readonly doctor: string;
  readonly reason: string;
  readonly reasonMuted: boolean;
  readonly chip: StatusChipModel;
  readonly cancellationReason: string | null;
}

const DATE_FMT = new Intl.DateTimeFormat('fr-CA', { dateStyle: 'full' });
const TIME_FMT = new Intl.DateTimeFormat('fr-CA', { timeStyle: 'short' });

/** Statuts qui ne comptent plus comme « à venir », même si la date l'est. */
const CLOSED_STATUSES: readonly AppointmentFlowItem['status'][] = [
  'cancelled',
  'completed',
  'absent',
];

/**
 * Espace patient : « Mes rendez-vous » (MEDIPLAN-21).
 *
 * Répond au cas d'utilisation UC-03 côté acteur Patient : consulter ses
 * rendez-vous et en prendre un sans passer par la réception.
 *
 * Le tri sépare **à venir** et **passés** plutôt que d'offrir des filtres : un
 * patient a typiquement deux ou trois rendez-vous, la seule question qu'il se
 * pose est « c'est quand, le prochain ». L'annulation en autonomie n'est pas
 * proposée — elle suppose la règle de délai minimum d'UC-07, hors périmètre.
 */
@Component({
  selector: 'app-my-appointments-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, MatIconModule, Alert, EmptyState, StatusChip],
  templateUrl: './my-appointments-page.html',
  styleUrl: './my-appointments-page.scss',
})
export class MyAppointmentsPage {
  private readonly patientService = inject(PatientAppointmentsService);
  private readonly dialog = inject(MatDialog);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly appointments = signal<readonly AppointmentFlowItem[]>([]);

  protected readonly skeletonRows = Array.from({ length: 3 });

  /** Rendez-vous encore à venir, du plus proche au plus lointain. */
  readonly upcoming = computed<readonly MyAppointmentRow[]>(() => {
    const now = Date.now();
    return this.appointments()
      .filter((item) => !CLOSED_STATUSES.includes(item.status))
      .filter((item) => this.startTime(item) >= now)
      .sort((a, b) => this.startTime(a) - this.startTime(b))
      .map((item) => this.toRow(item));
  });

  /** Tout le reste : passés, terminés, annulés — du plus récent au plus ancien. */
  readonly past = computed<readonly MyAppointmentRow[]>(() => {
    const now = Date.now();
    return this.appointments()
      .filter((item) => CLOSED_STATUSES.includes(item.status) || this.startTime(item) < now)
      .sort((a, b) => this.startTime(b) - this.startTime(a))
      .map((item) => this.toRow(item));
  });

  readonly isEmpty = computed(
    () => !this.loading() && this.error() === null && this.appointments().length === 0,
  );

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.patientService.listMine().subscribe({
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

  /** Ouvre la réservation ; recharge la liste si un rendez-vous a été créé. */
  openBooking(): void {
    this.dialog
      .open(BookSelfDialog, { autoFocus: 'dialog', restoreFocus: true, width: '520px' })
      .afterClosed()
      .subscribe((created?: boolean) => {
        if (created) {
          this.load();
        }
      });
  }

  private startTime(item: AppointmentFlowItem): number {
    const time = item.startAt ? new Date(item.startAt).getTime() : NaN;
    // Un rendez-vous sans créneau lisible est repoussé dans le passé plutôt que
    // de remonter en tête de la liste « à venir » par accident.
    return Number.isNaN(time) ? 0 : time;
  }

  private toRow(item: AppointmentFlowItem): MyAppointmentRow {
    const start = item.startAt ? new Date(item.startAt) : null;
    const end = item.endAt ? new Date(item.endAt) : null;
    const reason = item.reason?.trim();
    return {
      id: item.id,
      date: start ? DATE_FMT.format(start) : '—',
      time: start && end ? `${TIME_FMT.format(start)} – ${TIME_FMT.format(end)}` : '',
      doctor: item.doctorName ?? 'Médecin',
      reason: reason || 'Consultation',
      reasonMuted: !reason,
      chip: appointmentStatusChip(item.status),
      cancellationReason: item.status === 'cancelled' ? item.cancellationReason : null,
    };
  }
}

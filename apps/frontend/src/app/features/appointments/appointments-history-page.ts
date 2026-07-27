import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  computed,
  inject,
  signal,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

import { authErrorMessage } from '@shared/http/http-error-message';
import { StatusChip, StatusChipModel } from '@shared/ui';
import { appointmentStatusChip } from '@features/clinic-flow/appointment-status-chip';
import {
  AppointmentFlowItem,
  AppointmentStatus,
} from '@features/clinic-flow/appointment-flow.models';
import { AppointmentFlowService } from '@features/clinic-flow/appointment-flow.service';
import { BookAppointmentDialog } from './book-appointment-dialog';

/** Nombre de lignes par page (pagination client). */
const PAGE_SIZE = 15;

/** Ordre d'affichage des filtres de statut. */
const FILTER_STATUSES: readonly AppointmentStatus[] = [
  'booked',
  'arrived',
  'in_consultation',
  'completed',
  'absent',
  'cancelled',
];

/** Ligne prête à l'affichage. */
interface RdvRow {
  readonly item: AppointmentFlowItem;
  readonly date: string;
  readonly time: string;
  readonly patient: string;
  readonly patientPlaceholder: boolean;
  readonly doctor: string;
  readonly chip: StatusChipModel;
  readonly motif: string;
  readonly motifMuted: boolean;
}

/** Chip de filtre de statut. */
interface StatusFilterChip {
  readonly status: AppointmentStatus;
  readonly label: string;
  readonly chip: StatusChipModel;
}

const DATE_FMT = new Intl.DateTimeFormat('fr-CA', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

function frDate(iso: string | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '—' : DATE_FMT.format(d);
}

function frTime(iso: string | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/**
 * Historique des rendez-vous du périmètre (onglet « Rendez-vous »).
 *
 * Table de référence (redesign MediPlan.dc.html §rdv) : recherche + filtres de
 * statut en chips, lignes cliquables ouvrant un panneau de détail. Quatre états
 * (chargement, erreur+reprise, vide, succès) + pagination client. Le bouton
 * « Ajouter » ouvre la réservation en modale ; au succès, la liste est rechargée.
 */
@Component({
  selector: 'app-appointments-history-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule, StatusChip],
  templateUrl: './appointments-history-page.html',
  styleUrl: './appointments-history-page.scss',
})
export class AppointmentsHistoryPage {
  private readonly flowService = inject(AppointmentFlowService);
  private readonly dialog = inject(MatDialog);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly appointments = signal<readonly AppointmentFlowItem[]>([]);

  readonly search = signal('');
  /** Statuts sélectionnés (vide = tous). */
  private readonly statusFilter = signal<ReadonlySet<AppointmentStatus>>(new Set());
  private readonly page = signal(0);

  /** Ligne ouverte dans le panneau de détail, ou `null`. */
  readonly selected = signal<AppointmentFlowItem | null>(null);

  protected readonly skeletonRows = Array.from({ length: 6 });
  protected readonly pageSize = PAGE_SIZE;

  /** Chips de filtre de statut (avec état sélectionné). */
  readonly statusChips = computed<readonly StatusFilterChip[]>(() =>
    FILTER_STATUSES.map((status) => {
      const chip = appointmentStatusChip(status);
      return { status, label: chip.label, chip };
    }),
  );

  /** Vrai si un statut donné est actif dans le filtre. */
  isStatusSelected(status: AppointmentStatus): boolean {
    return this.statusFilter().has(status);
  }

  readonly hasActiveFilters = computed(
    () => this.statusFilter().size > 0 || this.search().trim().length > 0,
  );

  /** Toutes les lignes filtrées (recherche + statut), en view model. */
  private readonly filtered = computed<readonly RdvRow[]>(() => {
    const term = this.search().trim().toLowerCase();
    const statuses = this.statusFilter();
    return this.appointments()
      .filter((item) => statuses.size === 0 || statuses.has(item.status))
      .filter((item) => {
        if (!term) return true;
        return [this.patientLabel(item), this.doctorLabel(item), item.reason ?? '']
          .join(' ')
          .toLowerCase()
          .includes(term);
      })
      .map((item) => this.toRow(item));
  });

  readonly totalCount = computed(() => this.filtered().length);

  /** Lignes de la page courante. */
  readonly pagedRows = computed<readonly RdvRow[]>(() => {
    const start = this.page() * PAGE_SIZE;
    return this.filtered().slice(start, start + PAGE_SIZE);
  });

  /** Intervalle affiché « 1 – 15 sur 42 ». */
  readonly rangeLabel = computed(() => {
    const total = this.totalCount();
    if (total === 0) return '0';
    const start = this.page() * PAGE_SIZE + 1;
    const end = Math.min(start + PAGE_SIZE - 1, total);
    return `${start} – ${end} sur ${total}`;
  });

  readonly canPrev = computed(() => this.page() > 0);
  readonly canNext = computed(() => (this.page() + 1) * PAGE_SIZE < this.totalCount());

  readonly isEmptyAll = computed(
    () => !this.loading() && this.error() === null && this.appointments().length === 0,
  );
  readonly isEmptyFiltered = computed(
    () =>
      !this.loading() &&
      this.error() === null &&
      this.appointments().length > 0 &&
      this.filtered().length === 0,
  );
  readonly hasRows = computed(() => !this.loading() && !this.error() && this.filtered().length > 0);

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.flowService.listAll().subscribe({
      next: (appointments) => {
        this.appointments.set(appointments);
        this.page.set(0);
        this.loading.set(false);
      },
      error: (err: unknown) => {
        this.error.set(authErrorMessage(err));
        this.loading.set(false);
      },
    });
  }

  onSearch(value: string): void {
    this.search.set(value);
    this.page.set(0);
  }

  /** Bascule un statut dans le filtre (multi-sélection). */
  toggleStatus(status: AppointmentStatus): void {
    const next = new Set(this.statusFilter());
    if (next.has(status)) next.delete(status);
    else next.add(status);
    this.statusFilter.set(next);
    this.page.set(0);
  }

  clearFilters(): void {
    this.statusFilter.set(new Set());
    this.search.set('');
    this.page.set(0);
  }

  prevPage(): void {
    if (this.canPrev()) this.page.update((p) => p - 1);
  }

  nextPage(): void {
    if (this.canNext()) this.page.update((p) => p + 1);
  }

  open(item: AppointmentFlowItem): void {
    this.selected.set(item);
  }

  closeDetail(): void {
    this.selected.set(null);
  }

  /** Échap ferme le panneau de détail (convention modale + accessibilité). */
  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.selected()) this.closeDetail();
  }

  /** Détail (champs réels) du rendez-vous sélectionné. */
  readonly detailFields = computed(() => {
    const item = this.selected();
    if (!item) return [];
    // Le statut n'est pas répété ici : il est déjà porté par le chip (`detailChip`)
    // en tête du panneau (évite la redondance chip + ligne « Statut »).
    const fields: { k: string; v: string; muted?: boolean }[] = [
      { k: 'Date', v: `${frDate(item.startAt)} · ${frTime(item.startAt)} – ${frTime(item.endAt)}` },
      { k: 'Médecin', v: this.doctorLabel(item) },
      { k: 'Motif', v: item.reason?.trim() ? item.reason : '—', muted: !item.reason },
    ];
    if (item.status === 'cancelled' && item.cancellationReason) {
      fields.push({ k: 'Annulation', v: item.cancellationReason });
    }
    return fields;
  });

  readonly detailChip = computed(() => {
    const item = this.selected();
    return item ? appointmentStatusChip(item.status) : null;
  });

  /** Ouvre la réservation en modale ; recharge la liste si un RDV a été créé. */
  openBooking(): void {
    this.dialog
      .open(BookAppointmentDialog, { autoFocus: 'dialog', restoreFocus: true })
      .afterClosed()
      .subscribe((created?: boolean) => {
        if (created) this.load();
      });
  }

  private toRow(item: AppointmentFlowItem): RdvRow {
    const placeholder = !item.patientName;
    // Pour un RDV annulé, on affiche la raison telle quelle : le préfixe « Annulé : »
    // est redondant avec le chip de statut « Annulé » déjà présent sur la ligne.
    const cancelled = item.status === 'cancelled' && item.cancellationReason;
    const motif = cancelled
      ? (item.cancellationReason as string)
      : item.reason?.trim()
        ? item.reason
        : '—';
    return {
      item,
      date: frDate(item.startAt),
      time: `${frTime(item.startAt)} – ${frTime(item.endAt)}`,
      patient: this.patientLabel(item),
      patientPlaceholder: placeholder,
      doctor: this.doctorLabel(item),
      chip: appointmentStatusChip(item.status),
      motif,
      motifMuted: motif === '—',
    };
  }

  private patientLabel(appointment: AppointmentFlowItem): string {
    return appointment.patientName || `Patient ${appointment.patientId.slice(0, 8)}`;
  }

  private doctorLabel(appointment: AppointmentFlowItem): string {
    return appointment.doctorName || `Médecin ${appointment.doctorId.slice(0, 8)}`;
  }
}

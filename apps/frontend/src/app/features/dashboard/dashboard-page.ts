import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

import { AuthFacade, UserRole } from '@core/auth';
import { appointmentStatusChip } from '@features/clinic-flow/appointment-status-chip';
import { AppointmentFlowItem } from '@features/clinic-flow/appointment-flow.models';
import { AppointmentFlowService } from '@features/clinic-flow/appointment-flow.service';
import { StatisticsResponse } from '@features/admin/statistics/statistics.models';
import { StatisticsService } from '@features/admin/statistics/statistics.service';
import { PatientAppointmentsService } from '@features/patient/patient-appointments.service';
import { Avatar, EmptyState, RoleBadge, StatusChip, StatusChipModel, roleLabel } from '@shared/ui';
import { resolveDisplayName } from '@shared/user/display-name';

/**
 * Carte de KPI du dashboard (redesign MediPlan.dc.html §dashboard).
 *
 * `accent: 'teal'` = filet supérieur teal (carte « vivante ») ; `route` rend la
 * carte cliquable (ex. « RDV du jour » → Flux). `live: 'today'` reçoit le comptage
 * réel des RDV du jour ; `soon` marque un KPI encore sans source (« bientôt »).
 */
interface KpiCard {
  readonly icon: string;
  readonly label: string;
  readonly value?: string;
  readonly route?: string;
  readonly routeLabel?: string;
  readonly accent: 'teal' | 'neutral';
  readonly live?:
    | 'today'
    | 'mineUpcoming'
    | 'minePast'
    | 'doctorsActive'
    | 'occupancy'
    | 'doneToday'
    | 'remainingToday';
  readonly soon?: boolean;
}

/**
 * Accès rapide (lien actif si `route`, sinon « bientôt »). Filtré par RBAC
 * d'affichage comme la sidenav.
 */
interface QuickAction {
  readonly icon: string;
  readonly label: string;
  readonly route?: string;
  readonly roles?: readonly UserRole[];
}

/** Vue « prochain rendez-vous » dérivée de la file du jour. */
interface NextAppointmentView {
  readonly time: string;
  readonly patient: string;
  readonly meta: string;
  readonly chip: StatusChipModel;
}

/** Statuts considérés « à venir / en cours » pour le prochain RDV. */
const UPCOMING_STATUSES: readonly AppointmentFlowItem['status'][] = [
  'booked',
  'arrived',
  'in_consultation',
];

/** KPI du patient, calculés sur ses propres rendez-vous (MEDIPLAN-21). */
const PATIENT_STATS: readonly KpiCard[] = [
  {
    icon: 'event_upcoming',
    label: 'Rendez-vous à venir',
    accent: 'teal',
    live: 'mineUpcoming',
    route: '/my-appointments',
    routeLabel: 'Mes rendez-vous',
  },
  { icon: 'event_available', label: 'Rendez-vous passés', accent: 'neutral', live: 'minePast' },
];

/**
 * KPI de l'administration — les trois portent sur **la journée en cours**.
 *
 * « Médecins actifs » compte les médecins qui ont réellement des créneaux
 * aujourd'hui, pas les comptes existants : un médecin en congé n'est pas actif.
 * « Taux de remplissage » est le taux d'occupation des créneaux du jour.
 */
const ADMIN_STATS: readonly KpiCard[] = [
  {
    icon: 'today',
    label: 'RDV du jour',
    accent: 'teal',
    live: 'today',
    route: '/clinic-flow/today',
    routeLabel: 'Flux du jour',
  },
  { icon: 'stethoscope', label: 'Médecins actifs', accent: 'teal', live: 'doctorsActive' },
  {
    icon: 'donut_large',
    label: 'Taux de remplissage',
    accent: 'neutral',
    live: 'occupancy',
    route: '/admin/statistics',
    routeLabel: 'Statistiques',
  },
];

/**
 * KPI du médecin, calculés sur **sa** journée.
 *
 * Il ne voit pas les indicateurs de clinique : l'écran Statistiques lui est
 * fermé côté serveur, et le nombre de médecins actifs ne le concerne pas. Ses
 * trois chiffres viennent de sa propre file du jour.
 */
const DOCTOR_STATS: readonly KpiCard[] = [
  {
    icon: 'today',
    label: 'RDV du jour',
    accent: 'teal',
    live: 'today',
    route: '/clinic-flow/today',
    routeLabel: 'Flux du jour',
  },
  { icon: 'task_alt', label: 'Consultations terminées', accent: 'teal', live: 'doneToday' },
  // « Restants » et non « à venir » : le compte inclut le patient déjà arrivé et
  // celui en consultation. Ils ne sont plus à venir, mais ils restent à voir.
  { icon: 'pending_actions', label: 'Patients restants', accent: 'neutral', live: 'remainingToday' },
];

/**
 * Accès rapides du patient.
 *
 * Les deux mènent au même écran : « Prendre un rendez-vous » est le geste, « Mes
 * rendez-vous » est la consultation. Les deux formulations existent parce que
 * les deux intentions existent. « Mon profil » a été retiré : afficher un lien
 * mort est pire que ne rien afficher.
 */
const PATIENT_ACTIONS: readonly QuickAction[] = [
  { icon: 'add_circle', label: 'Prendre un rendez-vous', route: '/my-appointments' },
  { icon: 'calendar_month', label: 'Mes rendez-vous', route: '/my-appointments' },
];

/** Accès rapides de l'administration et du médecin. */
const ADMIN_ACTIONS: readonly QuickAction[] = [
  { icon: 'group', label: 'Utilisateurs', route: '/admin/users', roles: ['clinic_admin', 'super_admin'] },
  { icon: 'event_note', label: 'Disponibilités', route: '/availabilities' },
  { icon: 'medical_services', label: 'Médecins' },
];

/**
 * Date du jour **à l'heure de la clinique**, au format `AAAA-MM-JJ`.
 *
 * Le poste qui consulte n'est pas forcément dans le fuseau de la clinique ; on
 * ne se fie donc pas à la date locale du navigateur pour borner « aujourd'hui ».
 */
const JOUR_CLINIQUE_FMT = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Toronto',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

function clinicToday(): string {
  return JOUR_CLINIQUE_FMT.format(new Date());
}

const DATE_FMT = new Intl.DateTimeFormat('fr-CA', { day: '2-digit', month: 'long' });

/** Formate une date ISO en « 12 août » (le patient voit au-delà d'aujourd'hui). */
function frDate(iso: string | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : DATE_FMT.format(d);
}

/** Formate un horaire ISO en « 14 h 30 » (convention FR-CA de l'app). */
function frTime(iso: string | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh} h ${mm}`;
}

/**
 * Tableau de bord (écran protégé par `authGuard`, rendu dans le shell).
 *
 * Point de situation par rôle : accueil (avatar + salutation + badge), KPI à
 * filet teal (« RDV du jour » réel et cliquable vers le Flux), « prochain
 * rendez-vous » dérivé de la file du jour (sinon état vide), accès rapides et
 * carte « Mon compte ».
 */
@Component({
  selector: 'app-dashboard-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet, MatIconModule, RouterLink, Avatar, RoleBadge, StatusChip, EmptyState],
  templateUrl: './dashboard-page.html',
  styleUrl: './dashboard-page.scss',
})
export class DashboardPage {
  private readonly auth = inject(AuthFacade);
  private readonly appointmentFlow = inject(AppointmentFlowService);
  private readonly patientService = inject(PatientAppointmentsService);
  private readonly statistics = inject(StatisticsService);

  /** Utilisateur connecté (signal en lecture seule). */
  readonly user = this.auth.currentUser;

  /** File du jour (`null` tant que non chargée / indisponible). */
  private readonly todayItems = signal<readonly AppointmentFlowItem[] | null>(null);

  /** Rendez-vous du patient connecté (`null` tant que non chargés). */
  private readonly myItems = signal<readonly AppointmentFlowItem[] | null>(null);

  /**
   * Activité de la clinique **du jour** (`null` tant que non chargée).
   *
   * Réservée aux rôles d'administration : la route serveur leur est limitée.
   */
  private readonly todayActivity = signal<StatisticsResponse | null>(null);

  constructor() {
    // Deux sources selon le rôle : le patient lit ses propres rendez-vous, la
    // réception et le médecin lisent la file du jour de la clinique. Dans les
    // deux cas, une erreur retombe sur le placeholder plutôt que sur un écran
    // cassé. Le patient n'a pas accès à la file du jour, et réciproquement.
    const role = this.user()?.role;
    if (role === 'patient') {
      this.patientService.listMine().subscribe({
        next: (items) => this.myItems.set(items),
        error: () => this.myItems.set(null),
      });
    } else if (role) {
      this.appointmentFlow.listToday().subscribe({
        next: (items) => this.todayItems.set(items),
        error: () => this.todayItems.set(null),
      });
    }

    // Indicateurs de clinique : uniquement pour qui a le droit de les lire.
    // Un médecin recevrait un 403 — on ne lance pas l'appel.
    if (role === 'clinic_admin' || role === 'super_admin') {
      const today = clinicToday();
      this.statistics.getActivity({ startDate: today, endDate: today }).subscribe({
        next: (activity) => this.todayActivity.set(activity),
        error: () => this.todayActivity.set(null),
      });
    }
  }

  /** Nom affichable : prénom/nom si présents, sinon la partie locale de l'e-mail. */
  readonly displayName = computed(() => resolveDisplayName(this.user()));

  /** Salutation complète : « Bonjour, {nom} » ou « Bonjour 👋 » à défaut. */
  readonly greeting = computed(() => {
    const name = this.displayName();
    return name ? `Bonjour, ${name}` : 'Bonjour 👋';
  });

  /** Libellé français du rôle de l'utilisateur courant. */
  readonly roleLabel = computed(() => roleLabel(this.user()?.role));

  /** Vrai pour un patient (oriente le contenu vers « ses » rendez-vous). */
  private readonly isPatient = computed(() => this.user()?.role === 'patient');

  /** Vrai pour un médecin : ses indicateurs portent sur sa journée, pas la clinique. */
  private readonly isDoctor = computed(() => this.user()?.role === 'doctor');

  /** Phrase d'accroche sous la salutation, adaptée au rôle. */
  readonly subtitle = computed(() =>
    this.isPatient()
      ? 'Voici un aperçu de vos rendez-vous.'
      : 'Voici un aperçu de l’activité de votre clinique.',
  );

  /** Vrai tant que la source du rôle courant n'est pas chargée (skeletons). */
  readonly isLoading = computed(() => {
    if (this.isPatient()) return this.myItems() === null;
    if (this.isDoctor()) return this.todayItems() === null;
    // Côté administration, deux sources alimentent les trois tuiles : on attend
    // les deux plutôt que d'afficher une ligne à moitié remplie.
    return this.todayItems() === null || this.todayActivity() === null;
  });

  /** Répartition des rendez-vous du patient entre à venir et passés. */
  private readonly mineCounts = computed(() => {
    const items = this.myItems();
    if (items === null) return null;
    const now = Date.now();
    let upcoming = 0;
    for (const item of items) {
      const closed =
        item.status === 'cancelled' || item.status === 'completed' || item.status === 'absent';
      const start = item.startAt ? new Date(item.startAt).getTime() : NaN;
      if (!closed && !Number.isNaN(start) && start >= now) upcoming += 1;
    }
    return { upcoming, past: items.length - upcoming };
  });

  /** KPI visibles selon le rôle ; les cartes `live` reçoivent le comptage réel. */
  readonly stats = computed<readonly KpiCard[]>(() => {
    if (this.isPatient()) {
      const counts = this.mineCounts();
      if (counts === null) return PATIENT_STATS;
      return PATIENT_STATS.map((stat) => {
        if (stat.live === 'mineUpcoming') return { ...stat, value: String(counts.upcoming) };
        if (stat.live === 'minePast') return { ...stat, value: String(counts.past) };
        return stat;
      });
    }

    const items = this.todayItems();
    const base = this.isDoctor() ? DOCTOR_STATS : ADMIN_STATS;
    const activity = this.todayActivity();

    return base.map((stat) => {
      switch (stat.live) {
        case 'today':
          return items === null ? stat : { ...stat, value: String(items.length) };
        case 'doneToday':
          return items === null
            ? stat
            : { ...stat, value: String(items.filter((it) => it.status === 'completed').length) };
        case 'remainingToday':
          return items === null
            ? stat
            : {
                ...stat,
                value: String(items.filter((it) => UPCOMING_STATUSES.includes(it.status)).length),
              };
        case 'doctorsActive':
          return activity === null ? stat : { ...stat, value: String(activity.byDoctor.length) };
        case 'occupancy':
          return activity === null
            ? stat
            : { ...stat, value: `${Math.round(activity.summary.occupancyRate)} %` };
        default:
          return stat;
      }
    });
  });

  /**
   * Prochain rendez-vous.
   *
   * Deux lectures du même concept : la réception voit le prochain patient
   * attendu aujourd'hui, le patient voit son propre prochain rendez-vous —
   * qui peut être dans plusieurs jours, d'où la date en plus de l'heure.
   */
  readonly nextAppointment = computed<NextAppointmentView | null>(() => {
    if (this.isPatient()) {
      const items = this.myItems();
      if (!items || items.length === 0) return null;
      const now = Date.now();
      const next = items
        .filter((it) => UPCOMING_STATUSES.includes(it.status))
        .filter((it) => it.startAt && new Date(it.startAt).getTime() >= now)
        .sort((a, b) => (a.startAt ?? '').localeCompare(b.startAt ?? ''))[0];
      if (!next) return null;
      const reason = next.reason?.trim() ? next.reason : 'Consultation';
      return {
        time: frTime(next.startAt),
        patient: next.doctorName ?? 'Médecin',
        meta: `${frDate(next.startAt)} · ${reason}`,
        chip: appointmentStatusChip(next.status),
      };
    }

    const items = this.todayItems();
    if (!items || items.length === 0) return null;
    const upcoming = items
      .filter((it) => UPCOMING_STATUSES.includes(it.status))
      .sort((a, b) => (a.startAt ?? '').localeCompare(b.startAt ?? ''));
    const next = upcoming[0];
    if (!next) return null;
    const doctor = next.doctorName ?? 'Médecin';
    const reason = next.reason?.trim() ? next.reason : 'Consultation';
    return {
      time: frTime(next.startAt),
      patient: next.patientName ?? 'Patient',
      meta: `${doctor} · ${reason}`,
      chip: appointmentStatusChip(next.status),
    };
  });

  /** Accès rapides selon le rôle, filtrés par RBAC d'affichage (comme la sidenav). */
  readonly quickActions = computed<readonly QuickAction[]>(() => {
    const base = this.isPatient() ? PATIENT_ACTIONS : ADMIN_ACTIONS;
    const role = this.user()?.role ?? null;
    return base.filter((action) => !action.roles || (role !== null && action.roles.includes(role)));
  });
}

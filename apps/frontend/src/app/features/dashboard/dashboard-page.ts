import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

import { AuthFacade, UserRole } from '@core/auth';
import { appointmentStatusChip } from '@features/clinic-flow/appointment-status-chip';
import { AppointmentFlowItem } from '@features/clinic-flow/appointment-flow.models';
import { AppointmentFlowService } from '@features/clinic-flow/appointment-flow.service';
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
  readonly live?: 'today';
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

/** KPI du patient (encore sans source de données → placeholder « bientôt »). */
const PATIENT_STATS: readonly KpiCard[] = [
  { icon: 'event_upcoming', label: 'Rendez-vous à venir', accent: 'teal', soon: true },
  { icon: 'event_available', label: 'Rendez-vous passés', accent: 'neutral', soon: true },
];

/** KPI de l'administration/médecin. « RDV du jour » réel + cliquable vers le Flux. */
const ADMIN_STATS: readonly KpiCard[] = [
  {
    icon: 'today',
    label: 'RDV du jour',
    accent: 'teal',
    live: 'today',
    route: '/clinic-flow/today',
    routeLabel: 'Flux du jour',
  },
  { icon: 'stethoscope', label: 'Médecins actifs', accent: 'teal', soon: true },
  { icon: 'donut_large', label: 'Taux de remplissage', accent: 'neutral', soon: true },
];

/** Accès rapides du patient. */
const PATIENT_ACTIONS: readonly QuickAction[] = [
  { icon: 'add_circle', label: 'Prendre un rendez-vous' },
  { icon: 'calendar_month', label: 'Mes rendez-vous' },
  { icon: 'person', label: 'Mon profil' },
];

/** Accès rapides de l'administration et du médecin. */
const ADMIN_ACTIONS: readonly QuickAction[] = [
  { icon: 'group', label: 'Utilisateurs', route: '/admin/users', roles: ['clinic_admin', 'super_admin'] },
  { icon: 'event_note', label: 'Disponibilités', route: '/availabilities' },
  { icon: 'medical_services', label: 'Médecins' },
];

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

  /** Utilisateur connecté (signal en lecture seule). */
  readonly user = this.auth.currentUser;

  /** File du jour (`null` tant que non chargée / indisponible). */
  private readonly todayItems = signal<readonly AppointmentFlowItem[] | null>(null);

  constructor() {
    // Le patient n'a pas accès à la file du jour ; pour la réception/médecin, on
    // charge la liste réelle (KPI + prochain RDV). Résilient : erreur → placeholder.
    const role = this.user()?.role;
    if (role && role !== 'patient') {
      this.appointmentFlow.listToday().subscribe({
        next: (items) => this.todayItems.set(items),
        error: () => this.todayItems.set(null),
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

  /** Phrase d'accroche sous la salutation, adaptée au rôle. */
  readonly subtitle = computed(() =>
    this.isPatient()
      ? 'Voici un aperçu de vos rendez-vous.'
      : 'Voici un aperçu de l’activité de votre clinique.',
  );

  /** Vrai tant que la file du jour n'est pas chargée (skeletons). */
  readonly isLoading = computed(() => !this.isPatient() && this.todayItems() === null);

  /** KPI visibles selon le rôle ; la carte `live` reçoit le comptage réel. */
  readonly stats = computed<readonly KpiCard[]>(() => {
    const base = this.isPatient() ? PATIENT_STATS : ADMIN_STATS;
    const items = this.todayItems();
    if (items === null) return base;
    return base.map((stat) =>
      stat.live === 'today' ? { ...stat, value: String(items.length), soon: false } : stat,
    );
  });

  /** Prochain rendez-vous (le plus tôt, non clôturé) dérivé de la file du jour. */
  readonly nextAppointment = computed<NextAppointmentView | null>(() => {
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

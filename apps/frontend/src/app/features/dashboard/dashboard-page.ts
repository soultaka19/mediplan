import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

import { AuthFacade } from '@core/auth';
import { AppointmentFlowService } from '@features/clinic-flow/appointment-flow.service';
import { Avatar, EmptyState, RoleBadge, StatCard, roleLabel } from '@shared/ui';
import { resolveDisplayName } from '@shared/user/display-name';

/**
 * Description d'une carte de statistique (par rôle).
 *
 * `value`/`hint` sont optionnels : une carte alimentée par une donnée réelle
 * (ex. « RDV du jour ») les reçoit dynamiquement ; une carte encore sans source
 * garde `hint: 'bientôt'` et la valeur placeholder « — ». `live` marque la carte
 * branchée sur une vraie donnée.
 */
interface StatSpec {
  readonly icon: string;
  readonly label: string;
  readonly value?: string;
  readonly hint?: string;
  readonly live?: 'today';
}

/**
 * Description d'un accès rapide.
 *
 * Si `route` est défini, l'action est rendue comme un lien actif (`routerLink`).
 * Sinon, elle reste un bouton désactivé « bientôt » tant que l'écran manque.
 */
interface QuickAction {
  readonly icon: string;
  readonly label: string;
  readonly route?: string;
}

/** KPI du patient (encore sans source de données → placeholder « bientôt »). */
const PATIENT_STATS: readonly StatSpec[] = [
  { icon: 'event_upcoming', label: 'Rendez-vous à venir', hint: 'bientôt' },
  { icon: 'event_available', label: 'Rendez-vous passés', hint: 'bientôt' },
];

/**
 * KPI de l'administration (clinique / super admin) et du médecin.
 *
 * « RDV du jour » est alimenté en direct par `GET /appointments/today`. Les deux
 * autres restent en placeholder tant qu'aucun endpoint ne les fournit.
 */
const ADMIN_STATS: readonly StatSpec[] = [
  { icon: 'today', label: 'RDV du jour', live: 'today' },
  { icon: 'stethoscope', label: 'Médecins actifs', hint: 'bientôt' },
  { icon: 'donut_large', label: 'Taux de remplissage', hint: 'bientôt' },
];

/** Accès rapides du patient. */
const PATIENT_ACTIONS: readonly QuickAction[] = [
  { icon: 'add_circle', label: 'Prendre un rendez-vous' },
  { icon: 'calendar_month', label: 'Mes rendez-vous' },
  { icon: 'person', label: 'Mon profil' },
];

/** Accès rapides de l'administration. */
const ADMIN_ACTIONS: readonly QuickAction[] = [
  // L'écran de gestion des utilisateurs existe (/admin/users) → lien actif.
  { icon: 'group', label: 'Utilisateurs', route: '/admin/users' },
  { icon: 'medical_services', label: 'Médecins' },
  { icon: 'event_note', label: 'Disponibilités', route: '/availabilities' },
];

/**
 * Tableau de bord (écran protégé par `authGuard`, rendu dans le shell).
 *
 * Cible de redirection après connexion/inscription. Affiche un vrai tableau de
 * bord par rôle (cf. roadmap UX §3.8) : zone d'accueil (avatar + salutation +
 * badge), grille de KPI **placeholder**, zone « prochain RDV » en EmptyState,
 * accès rapides (liens actifs si l'écran existe, sinon « bientôt »), et carte
 * « Mon compte » secondaire.
 *
 * Le KPI « RDV du jour » est réel (`GET /appointments/today`, comptage) pour la
 * réception et le médecin ; les autres KPI restent des placeholders tant qu'un
 * endpoint ne les fournit pas. Seuls les accès rapides dont l'écran est déjà
 * livré (ex. « Utilisateurs » → /admin/users) sont actifs.
 */
@Component({
  selector: 'app-dashboard-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatCardModule, MatIconModule, RouterLink, Avatar, RoleBadge, StatCard, EmptyState],
  templateUrl: './dashboard-page.html',
  styleUrl: './dashboard-page.scss',
})
export class DashboardPage {
  private readonly auth = inject(AuthFacade);
  private readonly appointmentFlow = inject(AppointmentFlowService);

  /** Utilisateur connecté (signal en lecture seule). */
  readonly user = this.auth.currentUser;

  /**
   * Nombre de RDV du jour (`null` tant que non chargé ou indisponible → le KPI
   * reste alors un placeholder « — »).
   */
  private readonly todayCount = signal<number | null>(null);

  constructor() {
    // KPI « RDV du jour » réel pour la réception/médecin (le patient n'a pas
    // accès à la file du jour). Résilient : en cas d'erreur, on garde le
    // placeholder plutôt que d'inventer une valeur.
    const role = this.user()?.role;
    if (role && role !== 'patient') {
      this.appointmentFlow.listToday().subscribe({
        next: (items) => this.todayCount.set(items.length),
        error: () => this.todayCount.set(null),
      });
    }
  }

  /** Nom affichable : prénom/nom si présents, sinon la partie locale de l'e-mail. */
  readonly displayName = computed(() => resolveDisplayName(this.user()));

  /**
   * Nom de salutation pour le grand titre : prénom/nom si présents, sinon la
   * partie locale de l'e-mail (avant `@`). On ne déverse jamais un e-mail
   * complet dans le `<h1>` (cf. audit visuel — salutation « gracieuse »).
   */
  readonly greetingName = computed(() => resolveDisplayName(this.user()));

  /** Salutation complète : « Bonjour, {nom} » ou « Bonjour 👋 » à défaut. */
  readonly greeting = computed(() => {
    const name = this.greetingName();
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

  /**
   * KPI visibles selon le rôle. La carte `live: 'today'` reçoit le comptage réel
   * des RDV du jour dès qu'il est chargé ; sinon elle reste en placeholder.
   */
  readonly stats = computed<readonly StatSpec[]>(() => {
    const base = this.isPatient() ? PATIENT_STATS : ADMIN_STATS;
    const count = this.todayCount();
    if (count === null) {
      return base;
    }
    return base.map((stat) =>
      stat.live === 'today' ? { ...stat, value: String(count), hint: '' } : stat,
    );
  });

  /** Accès rapides selon le rôle (lien actif si `route`, sinon « bientôt »). */
  readonly quickActions = computed<readonly QuickAction[]>(() =>
    this.isPatient() ? PATIENT_ACTIONS : ADMIN_ACTIONS,
  );
}

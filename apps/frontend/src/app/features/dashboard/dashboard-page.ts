import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

import { AuthFacade } from '@core/auth';
import { Avatar, EmptyState, RoleBadge, StatCard, roleLabel } from '@shared/ui';

/** Description d'une carte de statistique placeholder (par rôle). */
interface StatSpec {
  readonly icon: string;
  readonly label: string;
}

/** Description d'un accès rapide (désactivé « bientôt » tant que l'écran manque). */
interface QuickAction {
  readonly icon: string;
  readonly label: string;
}

/** KPI placeholder du patient. */
const PATIENT_STATS: readonly StatSpec[] = [
  { icon: 'event_upcoming', label: 'Rendez-vous à venir' },
  { icon: 'event_available', label: 'Rendez-vous passés' },
];

/** KPI placeholder de l'administration (clinique / super admin). */
const ADMIN_STATS: readonly StatSpec[] = [
  { icon: 'today', label: 'RDV du jour' },
  { icon: 'stethoscope', label: 'Médecins actifs' },
  { icon: 'donut_large', label: 'Taux de remplissage' },
];

/** Accès rapides du patient. */
const PATIENT_ACTIONS: readonly QuickAction[] = [
  { icon: 'add_circle', label: 'Prendre un rendez-vous' },
  { icon: 'calendar_month', label: 'Mes rendez-vous' },
  { icon: 'person', label: 'Mon profil' },
];

/** Accès rapides de l'administration. */
const ADMIN_ACTIONS: readonly QuickAction[] = [
  { icon: 'group', label: 'Utilisateurs' },
  { icon: 'medical_services', label: 'Médecins' },
  { icon: 'event_note', label: 'Disponibilités' },
];

/**
 * Tableau de bord (écran protégé par `authGuard`, rendu dans le shell).
 *
 * Cible de redirection après connexion/inscription. Affiche un vrai tableau de
 * bord par rôle (cf. roadmap UX §3.8) : zone d'accueil (avatar + salutation +
 * badge), grille de KPI **placeholder**, zone « prochain RDV » en EmptyState,
 * accès rapides désactivés « bientôt », et carte « Mon compte » secondaire.
 *
 * ⚠️ UI pure : le backend RDV/stats n'existe pas encore. Aucune donnée n'est
 * inventée — les valeurs de KPI restent « — » et les actions sont inertes.
 * Aucun appel HTTP : tout passe par la façade.
 */
@Component({
  selector: 'app-dashboard-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatCardModule, MatIconModule, Avatar, RoleBadge, StatCard, EmptyState],
  templateUrl: './dashboard-page.html',
  styleUrl: './dashboard-page.scss',
})
export class DashboardPage {
  private readonly auth = inject(AuthFacade);

  /** Utilisateur connecté (signal en lecture seule). */
  readonly user = this.auth.currentUser;

  /** Nom affichable : prénom/nom si présents, sinon l'e-mail. */
  readonly displayName = computed(() => {
    const current = this.user();
    if (!current) {
      return '';
    }
    const fullName = [current.firstName, current.lastName].filter(Boolean).join(' ').trim();
    return fullName || current.email || '';
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

  /** KPI placeholder visibles selon le rôle. */
  readonly stats = computed<readonly StatSpec[]>(() =>
    this.isPatient() ? PATIENT_STATS : ADMIN_STATS,
  );

  /** Accès rapides (désactivés « bientôt ») selon le rôle. */
  readonly quickActions = computed<readonly QuickAction[]>(() =>
    this.isPatient() ? PATIENT_ACTIONS : ADMIN_ACTIONS,
  );
}

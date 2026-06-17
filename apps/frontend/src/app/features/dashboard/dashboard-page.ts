import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';

import { AuthFacade, UserRole } from '@core/auth';

/** Libellés français des rôles applicatifs (affichage). */
const ROLE_LABELS: Record<UserRole, string> = {
  patient: 'Patient',
  doctor: 'Médecin',
  clinic_admin: 'Administrateur de clinique',
  super_admin: 'Super administrateur',
};

/**
 * Tableau de bord (écran protégé par `authGuard`).
 *
 * Cible de redirection après connexion/inscription. Affiche l'utilisateur
 * courant exposé par l'AuthFacade et permet de se déconnecter. Aucun appel HTTP
 * direct : tout passe par la façade.
 */
@Component({
  selector: 'app-dashboard-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dashboard-page.html',
  styleUrl: './dashboard-page.scss',
})
export class DashboardPage {
  private readonly auth = inject(AuthFacade);
  private readonly router = inject(Router);

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
  readonly roleLabel = computed(() => {
    const role = this.user()?.role;
    return role ? ROLE_LABELS[role] : '';
  });

  /** Déconnecte l'utilisateur et le renvoie vers l'écran de connexion. */
  logout(): void {
    this.auth.logout();
    void this.router.navigate(['/login']);
  }
}

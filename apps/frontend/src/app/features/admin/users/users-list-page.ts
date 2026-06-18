import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MatTableModule } from '@angular/material/table';

import { PublicUser } from '@core/auth';
import { Alert, EmptyState, RoleBadge, Skeleton } from '@shared/ui';
import { authErrorMessage } from '@shared/http/http-error-message';
import { UserService } from './user.service';

/**
 * Liste des utilisateurs (écran d'administration, MEDIPLAN-48).
 *
 * Écran PROTÉGÉ rendu dans le shell : visible des `clinic_admin` / `super_admin`
 * (route gardée par `roleGuard`, autorisation faisant foi côté serveur via le
 * scope `clinic_id`). Consomme l'endpoint EXISTANT `GET /api/v1/users` qui
 * renvoie un tableau simple `PublicUser[]` (pas de pagination).
 *
 * Périmètre KISS volontaire : pas de tri / filtre / pagination (YAGNI tant que
 * l'API n'en expose pas). États gérés en signals : `loading` (skeleton),
 * succès (table Material), vide (EmptyState), erreur (Alert).
 */
@Component({
  selector: 'app-users-list-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatTableModule, RoleBadge, Skeleton, EmptyState, Alert],
  templateUrl: './users-list-page.html',
  styleUrl: './users-list-page.scss',
})
export class UsersListPage {
  private readonly userService = inject(UserService);

  /** Chargement en cours (affiche les squelettes). */
  readonly loading = signal(true);
  /** Message d'erreur utilisateur (null si aucune erreur). */
  readonly error = signal<string | null>(null);
  /** Utilisateurs chargés. */
  readonly users = signal<readonly PublicUser[]>([]);

  /** Vrai quand le chargement a réussi mais la liste est vide. */
  readonly isEmpty = computed(
    () => !this.loading() && this.error() === null && this.users().length === 0,
  );

  /** Colonnes affichées par `mat-table`. */
  protected readonly displayedColumns = ['name', 'email', 'role', 'status'] as const;

  /** Lignes squelette affichées pendant le chargement (placeholder visuel). */
  protected readonly skeletonRows = Array.from({ length: 5 });

  constructor() {
    this.load();
  }

  /** Charge (ou recharge) la liste des utilisateurs. */
  load(): void {
    this.loading.set(true);
    this.error.set(null);

    this.userService.listUsers().subscribe({
      next: (users) => {
        this.users.set(users);
        this.loading.set(false);
      },
      error: (err: unknown) => {
        this.error.set(authErrorMessage(err));
        this.loading.set(false);
      },
    });
  }

  /** Nom affichable : « Prénom Nom » si présent, repli sur l'e-mail. */
  protected displayName(user: PublicUser): string {
    const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
    return fullName || user.email || '—';
  }
}

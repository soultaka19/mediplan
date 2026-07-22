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
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';

import { PublicUser } from '@core/auth';
import { EmptyState, ErrorState, RoleBadge, roleLabel, Skeleton } from '@shared/ui';
import { authErrorMessage } from '@shared/http/http-error-message';
import { UserService } from './user.service';

/**
 * Liste des utilisateurs (écran d'administration, MEDIPLAN-48).
 *
 * Écran PROTÉGÉ rendu dans le shell : visible des `clinic_admin` / `super_admin`
 * (route gardée par `roleGuard`, autorisation faisant foi côté serveur via le
 * scope `clinic_id`). Consomme l'endpoint EXISTANT `GET /api/v1/users` qui
 * renvoie un tableau simple `PublicUser[]` (pas de pagination serveur).
 *
 * États gérés en signals : `loading` (skeleton), succès (table Material avec
 * recherche + pagination côté client), vide (EmptyState), erreur (ErrorState
 * avec reprise). La recherche et la pagination sont client-side car l'API ne les
 * expose pas encore (YAGNI) — suffisant à ce volume.
 */
@Component({
  selector: 'app-users-list-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatPaginatorModule,
    MatTableModule,
    RoleBadge,
    Skeleton,
    EmptyState,
    ErrorState,
  ],
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
  /** Terme de recherche courant. */
  readonly searchTerm = signal('');
  /** Nombre de lignes après filtre (0 = aucun résultat pour la recherche). */
  readonly filteredCount = signal(0);

  /** Source Material : filtre + pagination côté client. */
  readonly dataSource = new MatTableDataSource<PublicUser>([]);
  private readonly paginator = viewChild(MatPaginator);

  /** Vrai quand le chargement a réussi mais la liste est vide. */
  readonly isEmpty = computed(
    () => !this.loading() && this.error() === null && this.users().length === 0,
  );

  /** Colonnes affichées par `mat-table`. */
  protected readonly displayedColumns = ['name', 'email', 'role', 'status'] as const;

  /** Lignes squelette affichées pendant le chargement (placeholder visuel). */
  protected readonly skeletonRows = Array.from({ length: 5 });

  constructor() {
    // Recherche « humaine » : nom, e-mail et rôle (libellé + code).
    this.dataSource.filterPredicate = (user, filter) => {
      const haystack = [this.displayName(user), user.email ?? '', roleLabel(user.role), user.role]
        .join(' ')
        .toLowerCase();
      return haystack.includes(filter);
    };

    effect(() => {
      this.dataSource.paginator = this.paginator() ?? null;
    });

    this.load();
  }

  /** Charge (ou recharge) la liste des utilisateurs. */
  load(): void {
    this.loading.set(true);
    this.error.set(null);

    this.userService.listUsers().subscribe({
      next: (users) => {
        this.users.set(users);
        this.dataSource.data = [...users];
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

  /** Nom affichable : « Prénom Nom » si présent, repli sur l'e-mail. */
  protected displayName(user: PublicUser): string {
    const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
    return fullName || user.email || '—';
  }
}

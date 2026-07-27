import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

import { PublicUser, UserRole } from '@core/auth';
import { Avatar, EmptyState, ErrorState, StatusChip, StatusChipModel, roleLabel } from '@shared/ui';
import { authErrorMessage } from '@shared/http/http-error-message';
import { UserService } from './user.service';

/** Lignes par page (pagination client). */
const PAGE_SIZE = 10;

/** Rôles proposés en filtre (chips). */
const FILTER_ROLES: readonly UserRole[] = ['patient', 'doctor', 'clinic_admin', 'super_admin'];

/** Ligne utilisateur prête à l'affichage. */
interface UserRow {
  readonly user: PublicUser;
  readonly name: string;
  readonly namePlaceholder: boolean;
  readonly email: string;
  readonly emailPlaceholder: boolean;
  readonly role: string;
  readonly status: StatusChipModel;
}

/**
 * Liste des utilisateurs (écran d'administration, MEDIPLAN-48).
 *
 * Redesign MediPlan.dc.html §users : recherche + filtres de rôle en chips, table
 * en grille (avatar + nom, e-mail, rôle en badge rectangulaire, statut en
 * `StatusChip`), pagination client. Quatre états (chargement, erreur+reprise,
 * vide, succès). Consomme `GET /api/v1/users` (PublicUser[], pas de pagination
 * serveur). Autorisation réelle côté serveur (scope clinic_id).
 */
@Component({
  selector: 'app-users-list-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule, Avatar, StatusChip, EmptyState, ErrorState],
  templateUrl: './users-list-page.html',
  styleUrl: './users-list-page.scss',
})
export class UsersListPage {
  private readonly userService = inject(UserService);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly users = signal<readonly PublicUser[]>([]);

  readonly search = signal('');
  private readonly roleFilter = signal<ReadonlySet<UserRole>>(new Set());
  private readonly page = signal(0);

  protected readonly skeletonRows = Array.from({ length: 6 });
  protected readonly pageSize = PAGE_SIZE;

  /** Vrai quand le chargement a réussi mais la liste est vide. */
  readonly isEmpty = computed(
    () => !this.loading() && this.error() === null && this.users().length === 0,
  );

  /** Chips de filtre de rôle (avec état sélectionné). */
  readonly roleChips = computed(() =>
    FILTER_ROLES.map((role) => ({ role, label: roleLabel(role) })),
  );

  isRoleSelected(role: UserRole): boolean {
    return this.roleFilter().has(role);
  }

  readonly hasActiveFilters = computed(
    () => this.roleFilter().size > 0 || this.search().trim().length > 0,
  );

  private readonly filtered = computed<readonly UserRow[]>(() => {
    const term = this.search().trim().toLowerCase();
    const roles = this.roleFilter();
    return this.users()
      .filter((u) => roles.size === 0 || roles.has(u.role))
      .filter((u) => {
        if (!term) return true;
        return [this.displayName(u), u.email ?? '', roleLabel(u.role), u.role]
          .join(' ')
          .toLowerCase()
          .includes(term);
      })
      .map((u) => this.toRow(u));
  });

  readonly totalCount = computed(() => this.filtered().length);

  readonly pagedRows = computed<readonly UserRow[]>(() => {
    const start = this.page() * PAGE_SIZE;
    return this.filtered().slice(start, start + PAGE_SIZE);
  });

  readonly rangeLabel = computed(() => {
    const total = this.totalCount();
    if (total === 0) return '0';
    const start = this.page() * PAGE_SIZE + 1;
    const end = Math.min(start + PAGE_SIZE - 1, total);
    return `${start} – ${end} sur ${total}`;
  });

  readonly canPrev = computed(() => this.page() > 0);
  readonly canNext = computed(() => (this.page() + 1) * PAGE_SIZE < this.totalCount());

  readonly isEmptyFiltered = computed(
    () => !this.loading() && !this.error() && this.users().length > 0 && this.filtered().length === 0,
  );
  readonly hasRows = computed(() => !this.loading() && !this.error() && this.filtered().length > 0);

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.userService.listUsers().subscribe({
      next: (users) => {
        this.users.set(users);
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

  toggleRole(role: UserRole): void {
    const next = new Set(this.roleFilter());
    if (next.has(role)) next.delete(role);
    else next.add(role);
    this.roleFilter.set(next);
    this.page.set(0);
  }

  clearFilters(): void {
    this.roleFilter.set(new Set());
    this.search.set('');
    this.page.set(0);
  }

  prevPage(): void {
    if (this.canPrev()) this.page.update((p) => p - 1);
  }

  nextPage(): void {
    if (this.canNext()) this.page.update((p) => p + 1);
  }

  /** Nom affichable : « Prénom Nom » si présent, repli sur l'e-mail. */
  protected displayName(user: PublicUser): string {
    const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
    return fullName || user.email || '—';
  }

  private toRow(user: PublicUser): UserRow {
    const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
    return {
      user,
      name: this.displayName(user),
      namePlaceholder: !fullName,
      email: user.email || '—',
      emailPlaceholder: !user.email,
      role: roleLabel(user.role),
      status: {
        tone: user.isActive ? 'done' : 'cancelled',
        label: user.isActive ? 'Actif' : 'Inactif',
      },
    };
  }
}

import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { Router } from '@angular/router';

import { PublicUser } from '@core/auth';
import { authErrorMessage } from '@shared/http/http-error-message';
import { Alert, EmptyState, NotificationService, RoleBadge, Skeleton } from '@shared/ui';
import { UserService } from './user.service';

@Component({
  selector: 'app-users-list-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    RoleBadge,
    Skeleton,
    EmptyState,
    Alert,
  ],
  templateUrl: './users-list-page.html',
  styleUrl: './users-list-page.scss',
})
export class UsersListPage {
  private readonly userService = inject(UserService);
  private readonly notifications = inject(NotificationService);
  private readonly router = inject(Router);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly users = signal<readonly PublicUser[]>([]);

  readonly isEmpty = computed(
    () => !this.loading() && this.error() === null && this.users().length === 0,
  );

  protected readonly displayedColumns = ['name', 'email', 'role', 'status', 'actions'] as const;
  protected readonly skeletonRows = Array.from({ length: 5 });

  constructor() {
    this.load();
  }

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

  protected displayName(user: PublicUser): string {
    const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
    return fullName || user.email || '-';
  }

  protected canManagePatient(user: PublicUser): boolean {
    return user.role === 'patient';
  }

  protected editPatient(user: PublicUser): void {
    if (!this.canManagePatient(user)) {
      return;
    }

    void this.router.navigate(['/admin/users', user.id, 'edit']);
  }

  protected deletePatient(user: PublicUser): void {
    if (!this.canManagePatient(user)) {
      return;
    }

    if (!window.confirm(`Supprimer le patient ${this.displayName(user)} ?`)) {
      return;
    }

    this.userService.deletePatient(user.id).subscribe({
      next: () => {
        this.users.update((users) => users.filter((item) => item.id !== user.id));
        this.notifications.success('Patient supprime.');
      },
      error: (err: unknown) => {
        this.notifications.error(authErrorMessage(err));
      },
    });
  }
}

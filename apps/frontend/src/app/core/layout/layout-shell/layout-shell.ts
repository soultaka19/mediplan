import { BreakpointObserver } from '@angular/cdk/layout';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';

import { AuthFacade } from '@core/auth';
import { ThemeService } from '@core/theme';
import { BookAppointmentDialog } from '@features/appointments/book-appointment-dialog';
import { Avatar } from '@shared/ui';
import { resolveDisplayName } from '@shared/user/display-name';
import { NAV_ITEMS, visibleNavItems } from '../nav-items';

/** Rôles autorisés à réserver un rendez-vous depuis la topbar (comme l'onglet dédié). */
const BOOKING_ROLES = ['clinic_admin', 'super_admin'] as const;

/** Largeur max au-delà de laquelle le sidenav est en mode `side` (pivot md). */
const MOBILE_QUERY = '(max-width: 959.98px)';

/**
 * Shell applicatif : header (toolbar) + sidenav responsive + zone de contenu.
 *
 * Enveloppe les écrans protégés (cf. design-system §3 et §7.2). Gère :
 * - le mode responsive via `BreakpointObserver` (signal `isMobile`) : `over`
 *   (overlay + backdrop) sous 960px, `side` (pousse le contenu) au-dessus ;
 * - l'état ouvert/fermé du sidenav (repli complet sur desktop, décision client) ;
 * - la fermeture auto à la navigation en mode `over` ;
 * - le menu utilisateur (nom/email + déconnexion) lisant `AuthFacade`.
 *
 * Aucune logique métier ici : l'auth passe par la façade.
 */
@Component({
  selector: 'app-layout-shell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatToolbarModule,
    MatSidenavModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatDividerModule,
    Avatar,
  ],
  templateUrl: './layout-shell.html',
  styleUrl: './layout-shell.scss',
})
export class LayoutShell {
  private readonly breakpointObserver = inject(BreakpointObserver);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthFacade);
  private readonly themeService = inject(ThemeService);
  private readonly dialog = inject(MatDialog);

  /** Utilisateur courant (signal lecture seule) pour le menu utilisateur. */
  readonly user = this.auth.currentUser;

  /** Thème courant (clair/sombre) pour le bouton de bascule de la toolbar. */
  readonly theme = this.themeService.theme;

  /** Vrai si le thème sombre est actif (pour `aria-pressed`). */
  readonly isDarkTheme = computed(() => this.theme() === 'dark');

  /** Libellé accessible dynamique du bouton de thème. */
  readonly themeToggleLabel = computed(() =>
    this.isDarkTheme() ? 'Activer le thème clair' : 'Activer le thème sombre',
  );

  /**
   * Items de navigation visibles selon le rôle courant (réactif au changement
   * d'utilisateur). Les items réservés (ex. « Utilisateurs ») n'apparaissent que
   * pour les rôles autorisés.
   */
  protected readonly navItems = computed(() =>
    visibleNavItems(NAV_ITEMS, this.user()?.role ?? null),
  );

  /** Vrai sous le pivot md (mode overlay). Initialisé à l'état courant. */
  readonly isMobile = toSignal(
    this.breakpointObserver.observe(MOBILE_QUERY).pipe(map((state) => state.matches)),
    { initialValue: this.breakpointObserver.isMatched(MOBILE_QUERY) },
  );

  /** Mode du sidenav dérivé du responsive. */
  readonly sidenavMode = computed<'over' | 'side'>(() => (this.isMobile() ? 'over' : 'side'));

  /** État ouvert/fermé du sidenav. Ouvert par défaut sur desktop, fermé mobile. */
  private readonly openedState = signal(!this.breakpointObserver.isMatched(MOBILE_QUERY));
  readonly opened = this.openedState.asReadonly();

  /** Libellé accessible dynamique du burger selon l'état. */
  readonly toggleLabel = computed(() => (this.opened() ? 'Fermer le menu' : 'Ouvrir le menu'));

  /** Nom affichable : prénom/nom si présents, sinon la partie locale de l'e-mail. */
  readonly displayName = computed(() => resolveDisplayName(this.user()));

  /**
   * Vrai si le rôle courant peut réserver un rendez-vous (raccourci topbar).
   * Aligné sur le `roleGuard` de la route `/appointments`.
   */
  readonly canBookAppointment = computed(() => {
    const role = this.user()?.role;
    return role != null && (BOOKING_ROLES as readonly string[]).includes(role);
  });

  constructor() {
    // En mode overlay, refermer le sidenav à chaque navigation (item cliqué).
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => {
        if (this.isMobile()) {
          this.openedState.set(false);
        }
      });
  }

  /** Bascule l'ouverture du sidenav (burger). */
  toggleSidenav(): void {
    this.openedState.update((value) => !value);
  }

  /** Bascule le thème clair/sombre. */
  toggleTheme(): void {
    this.themeService.toggle();
  }

  /**
   * Ouvre la prise de rendez-vous en modale depuis la topbar. Au succès, redirige
   * vers l'historique des rendez-vous pour que l'utilisateur voie l'ajout.
   */
  openBooking(): void {
    this.dialog
      .open(BookAppointmentDialog, { autoFocus: 'dialog', restoreFocus: true })
      .afterClosed()
      .subscribe((created?: boolean) => {
        if (created) {
          void this.router.navigate(['/appointments']);
        }
      });
  }

  /** Synchronise l'état quand l'utilisateur ferme via backdrop/Échap. */
  onOpenedChange(opened: boolean): void {
    this.openedState.set(opened);
  }

  /** Déconnecte l'utilisateur et le renvoie vers l'écran de connexion. */
  logout(): void {
    this.auth.logout();
    void this.router.navigate(['/login']);
  }
}

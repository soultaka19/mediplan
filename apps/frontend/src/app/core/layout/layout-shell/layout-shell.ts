import { BreakpointObserver } from '@angular/cdk/layout';
import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDialog } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  NavigationCancel,
  NavigationEnd,
  NavigationError,
  NavigationStart,
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';
import { filter, map } from 'rxjs';

import { AuthFacade } from '@core/auth';
import { ThemeService } from '@core/theme';
import { BookAppointmentDialog } from '@features/appointments/book-appointment-dialog';
import { InternalNotification } from '@features/notifications/notification.models';
import { NotificationCenterService } from '@features/notifications/notification-center.service';
import { Avatar, roleLabel } from '@shared/ui';
import { resolveDisplayName } from '@shared/user/display-name';
import { NAV_ITEMS, visibleNavItems } from '../nav-items';
import { DemoBanner } from '../demo-banner/demo-banner';

/** Rôles autorisés à réserver un rendez-vous depuis la topbar (comme l'onglet dédié). */
const BOOKING_ROLES = ['clinic_admin', 'super_admin'] as const;

/** Largeur max au-delà de laquelle le rail est en mode desktop (pivot md). */
const MOBILE_QUERY = '(max-width: 959.98px)';

/** Clé de persistance de l'état réduit/étendu du rail (préférence utilisateur). */
const RAIL_STORAGE_KEY = 'mp-rail-collapsed';

/**
 * Shell applicatif : topbar + rail de navigation rétractable + zone de contenu
 * (redesign MediPlan.dc.html §shell).
 *
 * - Desktop : rail en flux, largeur animée 256px ↔ 72px (icônes seules) ;
 *   préférence persistée. Mobile : rail en overlay + backdrop.
 * - CTA « Nouveau rendez-vous » (admins) avec raccourci clavier global « N ».
 * - Menu utilisateur custom (nom + rôle, bascule de thème, déconnexion).
 *
 * Aucune logique métier ici : auth via la façade, thème via `ThemeService`.
 */
@Component({
  selector: 'app-layout-shell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    DatePipe,
    MatIconModule,
    MatTooltipModule,
    MatBadgeModule,
    MatMenuModule,
    MatDividerModule,
    Avatar,
    DemoBanner,
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
  private readonly notificationCenter = inject(NotificationCenterService);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

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

  /** Items de navigation visibles selon le rôle courant (réactif au rôle). */
  protected readonly navItems = computed(() =>
    visibleNavItems(NAV_ITEMS, this.user()?.role ?? null),
  );

  /** Vrai sous le pivot md (mode overlay). Initialisé à l'état courant. */
  readonly isMobile = toSignal(
    this.breakpointObserver.observe(MOBILE_QUERY).pipe(map((state) => state.matches)),
    { initialValue: this.breakpointObserver.isMatched(MOBILE_QUERY) },
  );

  /** Rail réduit (desktop) : préférence persistée. */
  private readonly railCollapsedState = signal(this.readRailPreference());
  readonly railCollapsed = this.railCollapsedState.asReadonly();

  /** Overlay de navigation ouvert (mobile uniquement). */
  private readonly mobileNavState = signal(false);
  readonly mobileNavOpen = this.mobileNavState.asReadonly();

  /** Menu utilisateur (dropdown) ouvert. */
  private readonly userMenuState = signal(false);
  readonly userMenuOpen = this.userMenuState.asReadonly();

  /**
   * Navigation en cours : alimente la barre de progression de la topbar.
   *
   * Les écrans sont chargés paresseusement ; au premier accès à une route, le
   * temps de récupération du chunk se traduisait par une interface immobile,
   * sans indication que quelque chose se passait. La barre couvre cette
   * fenêtre, tandis que les View Transitions gèrent le fondu du contenu.
   */
  private readonly navigatingState = signal(false);
  readonly navigating = this.navigatingState.asReadonly();

  /** Vrai si les libellés de nav sont visibles (masqués quand rail réduit desktop). */
  readonly showLabels = computed(() => this.isMobile() || !this.railCollapsed());

  /** Libellé accessible du bouton de repli du rail. */
  readonly railToggleLabel = computed(() =>
    this.railCollapsed() ? 'Étendre le menu' : 'Réduire le menu',
  );

  /**
   * Libellé accessible du burger selon le contexte. Sur desktop, il est distinct
   * de celui du chevron du rail (`railToggleLabel`) pour éviter deux contrôles au
   * nom accessible identique (les deux replient pourtant le rail).
   */
  readonly burgerLabel = computed(() => {
    if (this.isMobile()) return this.mobileNavOpen() ? 'Fermer le menu' : 'Ouvrir le menu';
    return 'Afficher ou masquer le menu latéral';
  });

  /** Nom affichable : prénom/nom si présents, sinon la partie locale de l'e-mail. */
  readonly displayName = computed(() => resolveDisplayName(this.user()));
  readonly notifications = signal<readonly InternalNotification[]>([]);
  readonly unreadCount = signal(0);
  readonly notificationsLoading = signal(false);

  /** Libellé français du rôle courant. */
  readonly userRoleLabel = computed(() => roleLabel(this.user()?.role));

  /**
   * Vrai si le rôle courant peut réserver un rendez-vous (raccourci topbar + « N »).
   * Aligné sur le `roleGuard` de la route `/appointments`.
   */
  readonly canBookAppointment = computed(() => {
    const role = this.user()?.role;
    return role != null && (BOOKING_ROLES as readonly string[]).includes(role);
  });

  constructor() {
    this.refreshNotifications();

    // En mode overlay, refermer la nav mobile à chaque navigation (item cliqué).
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.mobileNavState.set(false));

    // Progression de navigation. `NavigationCancel` et `NavigationError` sont
    // traités comme des fins : un guard qui refuse l'accès ou un chunk qui
    // échoue doit éteindre la barre, pas la laisser tourner indéfiniment.
    this.router.events.pipe(takeUntilDestroyed()).subscribe((event) => {
      if (event instanceof NavigationStart) {
        this.navigatingState.set(true);
      } else if (
        event instanceof NavigationEnd ||
        event instanceof NavigationCancel ||
        event instanceof NavigationError
      ) {
        this.navigatingState.set(false);
      }
    });
  }

  /** Burger : bascule le rail (desktop) ou l'overlay (mobile). */
  onBurger(): void {
    if (this.isMobile()) {
      this.mobileNavState.update((open) => !open);
    } else {
      this.toggleRail();
    }
  }

  /** Bascule l'état réduit/étendu du rail et persiste la préférence. */
  toggleRail(): void {
    this.railCollapsedState.update((collapsed) => {
      const next = !collapsed;
      this.writeRailPreference(next);
      return next;
    });
  }

  /** Ferme l'overlay de navigation mobile (clic backdrop / Échap). */
  closeMobileNav(): void {
    this.mobileNavState.set(false);
  }

  /** Bascule le menu utilisateur (stoppe la propagation pour ne pas se refermer). */
  toggleUserMenu(event: Event): void {
    event.stopPropagation();
    this.userMenuState.update((open) => !open);
  }

  /** Ferme le menu utilisateur (clic extérieur / navigation). */
  closeUserMenu(): void {
    this.userMenuState.set(false);
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
    this.closeUserMenu();
    this.dialog
      .open(BookAppointmentDialog, { autoFocus: 'dialog', restoreFocus: true })
      .afterClosed()
      .subscribe((created?: boolean) => {
        if (created) {
          void this.router.navigate(['/appointments']);
        }
      });
  }

  /** Recharge le centre de notifications (au démarrage et à l'ouverture du menu). */
  refreshNotifications(): void {
    if (!this.auth.isAuthenticated()) {
      return;
    }

    this.notificationsLoading.set(true);
    this.notificationCenter.list().subscribe({
      next: (notifications) => {
        this.notifications.set(notifications);
        this.unreadCount.set(notifications.filter((notification) => !notification.readAt).length);
        this.notificationsLoading.set(false);
      },
      error: () => this.notificationsLoading.set(false),
    });
  }

  markNotificationAsRead(notification: InternalNotification): void {
    const goToAction = () => {
      if (notification.actionUrl) {
        void this.router.navigateByUrl(notification.actionUrl);
      }
    };

    if (notification.readAt) {
      goToAction();
      return;
    }

    this.notificationCenter.markAsRead(notification.id).subscribe({
      next: (updated) => {
        this.notifications.update((items) =>
          items.map((item) => (item.id === updated.id ? updated : item)),
        );
        this.unreadCount.update((count) => Math.max(0, count - 1));
        goToAction();
      },
      error: () => goToAction(),
    });
  }

  /** Déconnecte l'utilisateur et le renvoie vers l'écran de connexion. */
  logout(): void {
    this.closeUserMenu();
    this.auth.logout();
    this.notifications.set([]);
    this.unreadCount.set(0);
    void this.router.navigate(['/login']);
  }

  /**
   * Ferme le menu utilisateur sur tout clic hors de son conteneur.
   *
   * La fermeture est décidée ici par un test de contenance, et non par un
   * `stopPropagation` posé sur le panneau : ce dernier obligeait à déclarer un
   * gestionnaire de clic sur un `<div role="menu">` non focalisable, que les
   * règles d'accessibilité signalaient à juste titre. Le panneau redevient un
   * conteneur passif, et tout élément interactif ajouté à l'intérieur continue
   * de fonctionner sans avoir à penser à la propagation.
   */
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.userMenuOpen()) return;

    const target = event.target;
    if (
      target instanceof Node &&
      this.host.nativeElement.querySelector('.mp-usermenu')?.contains(target)
    ) {
      return;
    }

    this.closeUserMenu();
  }

  /**
   * Raccourcis clavier globaux : « N » ouvre la réservation (admins) hors champ
   * de saisie ; « Échap » ferme les menus ouverts.
   */
  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.closeUserMenu();
      this.closeMobileNav();
      return;
    }
    if ((event.key === 'n' || event.key === 'N') && !this.isTypingContext(event)) {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (!this.canBookAppointment()) return;
      event.preventDefault();
      this.openBooking();
    }
  }

  /** Vrai si le focus est dans un champ de saisie (ne pas capter « N »). */
  private isTypingContext(event: KeyboardEvent): boolean {
    const target = event.target as HTMLElement | null;
    if (!target) return false;
    const tag = target.tagName;
    return (
      tag === 'INPUT' ||
      tag === 'TEXTAREA' ||
      tag === 'SELECT' ||
      target.isContentEditable ||
      target.closest('[role="dialog"]') !== null
    );
  }

  private readRailPreference(): boolean {
    try {
      return localStorage.getItem(RAIL_STORAGE_KEY) === '1';
    } catch {
      return false;
    }
  }

  private writeRailPreference(collapsed: boolean): void {
    try {
      localStorage.setItem(RAIL_STORAGE_KEY, collapsed ? '1' : '0');
    } catch {
      // Stockage indisponible (mode privé) : préférence non persistée, sans impact.
    }
  }
}

import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { of } from 'rxjs';

import { AuthFacade, PublicUser } from '@core/auth';
import { ThemeService } from '@core/theme';
import { InternalNotification } from '@features/notifications/notification.models';
import { NotificationCenterService } from '@features/notifications/notification-center.service';
import { LayoutShell } from './layout-shell';

function patient(overrides: Partial<PublicUser> = {}): PublicUser {
  return {
    id: 'u1',
    email: 'patient@example.com',
    firstName: null,
    lastName: null,
    role: 'patient',
    clinicId: null,
    isActive: true,
    createdAt: '',
    ...overrides,
  };
}

/** Fake d'AuthFacade : utilisateur courant contrôlable + logout espionné. */
function createFakeFacade(user: PublicUser | null) {
  const currentUser = signal(user);
  return {
    currentUser,
    isAuthenticated: () => currentUser() !== null,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(() => currentUser.set(null)),
  };
}

function createFakeNotificationCenter() {
  const notification: InternalNotification = {
    id: 'notification-1',
    type: 'appointment_booked',
    title: 'Nouveau rendez-vous',
    message: 'Un rendez-vous a ete reserve.',
    actionUrl: null,
    readAt: null,
    createdAt: '2026-07-05T13:00:00.000Z',
  };

  return {
    list: vi.fn(() => of([notification])),
    unreadCount: vi.fn(() => of({ unreadCount: 1 })),
    markAsRead: vi.fn(() => of({ ...notification, readAt: '2026-07-05T13:05:00.000Z' })),
  };
}

function createFakeThemeService() {
  const theme = signal<'light' | 'dark'>('light');

  return {
    theme: theme.asReadonly(),
    toggle: vi.fn(() => theme.update((value) => (value === 'light' ? 'dark' : 'light'))),
  };
}

function byTestId<T extends HTMLElement>(root: ParentNode, id: string): T {
  return root.querySelector(`[data-testid="${id}"]`) as T;
}

/** Le contenu du mat-menu est rendu dans l'overlay CDK (hors du composant). */
function overlay(): HTMLElement {
  return document.querySelector('.cdk-overlay-container') as HTMLElement;
}

describe('LayoutShell', () => {
  let facade: ReturnType<typeof createFakeFacade>;
  let notificationCenter: ReturnType<typeof createFakeNotificationCenter>;
  let themeService: ReturnType<typeof createFakeThemeService>;

  function setup(user: PublicUser | null = patient()) {
    facade = createFakeFacade(user);
    notificationCenter = createFakeNotificationCenter();
    themeService = createFakeThemeService();
    TestBed.configureTestingModule({
      imports: [LayoutShell],
      providers: [
        provideRouter([]),
        provideNoopAnimations(),
        { provide: AuthFacade, useValue: facade },
        { provide: ThemeService, useValue: themeService },
        { provide: NotificationCenterService, useValue: notificationCenter },
      ],
    });
    const fixture = TestBed.createComponent(LayoutShell);
    fixture.detectChanges();
    return fixture;
  }

  it('rend le header (burger + logo) et la navigation', () => {
    const fixture = setup();
    const root = fixture.nativeElement as HTMLElement;

    expect(byTestId(root, 'shell-burger')).not.toBeNull();
    expect(root.textContent).toContain('MediPlan');
    // 1 seul item actif (Tableau de bord) ; « Rendez-vous » est réservé aux
    // admins, donc masqué au patient. Aucun item désactivé (« Profil » retiré
    // tant que son écran n'existe pas).
    expect(root.querySelectorAll('[data-testid="shell-nav-item"]').length).toBe(1);
    expect(root.querySelectorAll('[data-testid="shell-nav-item-disabled"]').length).toBe(0);
  });

  it("le menu utilisateur affiche le nom et l'e-mail", () => {
    const fixture = setup(patient({ firstName: 'Ada', lastName: 'Lovelace' }));
    const root = fixture.nativeElement as HTMLElement;

    byTestId<HTMLButtonElement>(root, 'shell-user-menu-trigger').click();
    fixture.detectChanges();

    expect(byTestId(overlay(), 'shell-user-name').textContent).toContain('Ada Lovelace');
    expect(byTestId(overlay(), 'shell-user-email').textContent).toContain('patient@example.com');
  });

  it('clic « Se déconnecter » appelle logout() puis navigue vers /login', () => {
    const fixture = setup();
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const root = fixture.nativeElement as HTMLElement;

    byTestId<HTMLButtonElement>(root, 'shell-user-menu-trigger').click();
    fixture.detectChanges();

    byTestId<HTMLButtonElement>(overlay(), 'shell-logout').click();

    expect(facade.logout).toHaveBeenCalled();
    expect(navigateSpy).toHaveBeenCalledWith(['/login']);
  });

  it('masque l’item « Utilisateurs » pour un patient', () => {
    const fixture = setup(patient({ role: 'patient' }));
    const root = fixture.nativeElement as HTMLElement;

    expect(root.textContent).not.toContain('Utilisateurs');
    // Seul « Tableau de bord » est actif ; « Utilisateurs » et « Rendez-vous »
    // (réservés admins) sont masqués au patient, et aucun item désactivé.
    expect(root.querySelectorAll('[data-testid="shell-nav-item-disabled"]').length).toBe(0);
  });

  it('masque l’item « Utilisateurs » pour un médecin', () => {
    const fixture = setup(patient({ role: 'doctor' }));
    const root = fixture.nativeElement as HTMLElement;

    expect(root.textContent).not.toContain('Utilisateurs');
    // Actifs : Tableau de bord + Disponibilités + Flux du jour = 3 ;
    // « Rendez-vous » réservé aux admins ; aucun item désactivé.
    expect(root.querySelectorAll('[data-testid="shell-nav-item"]').length).toBe(3);
    expect(root.querySelectorAll('[data-testid="shell-nav-item-disabled"]').length).toBe(0);
  });

  it('affiche l’item « Utilisateurs » pour un administrateur de clinique', () => {
    const fixture = setup(patient({ role: 'clinic_admin' }));
    const root = fixture.nativeElement as HTMLElement;

    expect(root.textContent).toContain('Utilisateurs');
    // Liens actifs : Tableau de bord + Disponibilités + Rendez-vous + Flux du
    // jour + Utilisateurs = 5 ; aucun item désactivé.
    expect(root.querySelectorAll('[data-testid="shell-nav-item"]').length).toBe(5);
    expect(root.querySelectorAll('[data-testid="shell-nav-item-disabled"]').length).toBe(0);
  });

  it('affiche l’item « Utilisateurs » pour un super administrateur', () => {
    const fixture = setup(patient({ role: 'super_admin' }));
    const root = fixture.nativeElement as HTMLElement;

    expect(root.textContent).toContain('Utilisateurs');
    expect(root.querySelectorAll('[data-testid="shell-nav-item"]').length).toBe(5);
    expect(root.querySelectorAll('[data-testid="shell-nav-item-disabled"]').length).toBe(0);
  });

  it('le burger bascule l’ouverture du sidenav', () => {
    const fixture = setup();
    const component = fixture.componentInstance;
    const initial = component.opened();

    component.toggleSidenav();

    expect(component.opened()).toBe(!initial);
  });

  it('le bouton de thème bascule clair/sombre et reflète aria-pressed', () => {
    const fixture = setup();
    const root = fixture.nativeElement as HTMLElement;
    const toggle = byTestId<HTMLButtonElement>(root, 'shell-theme-toggle');
    const initialDark = fixture.componentInstance.isDarkTheme();

    expect(toggle.getAttribute('aria-pressed')).toBe(String(initialDark));

    toggle.click();
    fixture.detectChanges();

    expect(fixture.componentInstance.isDarkTheme()).toBe(!initialDark);
    expect(toggle.getAttribute('aria-pressed')).toBe(String(!initialDark));
  });
  it('affiche les notifications non lues dans la cloche', () => {
    const fixture = setup(patient({ role: 'doctor' }));
    const root = fixture.nativeElement as HTMLElement;

    byTestId<HTMLButtonElement>(root, 'shell-notifications-trigger').click();
    fixture.detectChanges();

    expect(notificationCenter.list).toHaveBeenCalled();
    expect(overlay().textContent).toContain('1 non lue(s)');
    expect(overlay().textContent).toContain('Nouveau rendez-vous');
  });

  it('marque une notification comme lue au clic', () => {
    const fixture = setup(patient({ role: 'doctor' }));
    const root = fixture.nativeElement as HTMLElement;

    byTestId<HTMLButtonElement>(root, 'shell-notifications-trigger').click();
    fixture.detectChanges();

    byTestId<HTMLButtonElement>(overlay(), 'shell-notification-item').click();

    expect(notificationCenter.markAsRead).toHaveBeenCalledWith('notification-1');
  });
});

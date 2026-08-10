import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { AuthFacade, PublicUser } from '@core/auth';
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

function byTestId<T extends HTMLElement>(root: ParentNode, id: string): T {
  return root.querySelector(`[data-testid="${id}"]`) as T;
}

/** Le contenu du mat-menu est rendu dans l'overlay CDK (hors du composant). */
function overlay(): HTMLElement {
  return document.querySelector('.cdk-overlay-container') as HTMLElement;
}

describe('LayoutShell', () => {
  let facade: ReturnType<typeof createFakeFacade>;

  function setup(user: PublicUser | null = patient()) {
    facade = createFakeFacade(user);
    TestBed.configureTestingModule({
      imports: [LayoutShell],
      providers: [
        provideRouter([]),
        provideNoopAnimations(),
        { provide: AuthFacade, useValue: facade },
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

    // Le menu utilisateur est un dropdown inline (plus un overlay CDK).
    expect(byTestId(root, 'shell-user-name').textContent).toContain('Ada Lovelace');
    expect(byTestId(root, 'shell-user-email').textContent).toContain('patient@example.com');
  });

  it('clic « Se déconnecter » appelle logout() puis navigue vers /login', () => {
    const fixture = setup();
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const root = fixture.nativeElement as HTMLElement;

    byTestId<HTMLButtonElement>(root, 'shell-user-menu-trigger').click();
    fixture.detectChanges();

    byTestId<HTMLButtonElement>(root, 'shell-logout').click();

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
    // jour + Statistiques + Utilisateurs = 6 ; aucun item désactivé.
    expect(root.querySelectorAll('[data-testid="shell-nav-item"]').length).toBe(6);
    expect(root.querySelectorAll('[data-testid="shell-nav-item-disabled"]').length).toBe(0);
  });

  it('affiche l’item « Utilisateurs » pour un super administrateur', () => {
    const fixture = setup(patient({ role: 'super_admin' }));
    const root = fixture.nativeElement as HTMLElement;

    expect(root.textContent).toContain('Utilisateurs');
    expect(root.querySelectorAll('[data-testid="shell-nav-item"]').length).toBe(6);
    expect(root.querySelectorAll('[data-testid="shell-nav-item-disabled"]').length).toBe(0);
  });

  it('le repli du rail bascule l’état réduit/étendu', () => {
    const fixture = setup();
    const component = fixture.componentInstance;
    const initial = component.railCollapsed();

    component.toggleRail();

    expect(component.railCollapsed()).toBe(!initial);
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
});

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
    // 1 item actif (Tableau de bord) + 2 désactivés (Rendez-vous, Profil).
    expect(root.querySelectorAll('[data-testid="shell-nav-item"]').length).toBe(1);
    expect(root.querySelectorAll('[data-testid="shell-nav-item-disabled"]').length).toBe(2);
  });

  it('affiche les items désactivés avec la mention « bientôt » et non cliquables', () => {
    const fixture = setup();
    const root = fixture.nativeElement as HTMLElement;
    const disabled = root.querySelectorAll('[data-testid="shell-nav-item-disabled"]');

    expect(disabled.length).toBe(2);
    disabled.forEach((item) => {
      expect(item.getAttribute('aria-disabled')).toBe('true');
      // Pas de routerLink → pas de href de navigation.
      expect(item.getAttribute('href')).toBeNull();
    });
    expect(root.textContent).toContain('bientôt');
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

  it('le burger bascule l’ouverture du sidenav', () => {
    const fixture = setup();
    const component = fixture.componentInstance;
    const initial = component.opened();

    component.toggleSidenav();

    expect(component.opened()).toBe(!initial);
  });
});

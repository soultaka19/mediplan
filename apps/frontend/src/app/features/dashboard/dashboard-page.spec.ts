import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { AuthFacade, PublicUser, UserRole } from '@core/auth';
import { DashboardPage } from './dashboard-page';

function makeUser(overrides: Partial<PublicUser> = {}): PublicUser {
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

/**
 * Fake d'AuthFacade : utilisateur courant contrôlable.
 *
 * Note : la déconnexion a migré vers le menu utilisateur du header
 * (LayoutShell) ; elle n'est donc plus testée ici (voir layout-shell.spec.ts).
 */
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

function byTestId<T extends HTMLElement>(root: HTMLElement, id: string): T {
  return root.querySelector(`[data-testid="${id}"]`) as T;
}

function allByTestId<T extends HTMLElement>(root: HTMLElement, id: string): T[] {
  return Array.from(root.querySelectorAll<T>(`[data-testid="${id}"]`));
}

describe('DashboardPage', () => {
  function setup(user: PublicUser | null) {
    const facade = createFakeFacade(user);
    TestBed.configureTestingModule({
      imports: [DashboardPage],
      providers: [{ provide: AuthFacade, useValue: facade }],
    });
    const fixture = TestBed.createComponent(DashboardPage);
    fixture.detectChanges();
    return { fixture, facade };
  }

  it('affiche l’e-mail et le rôle de l’utilisateur connecté', () => {
    const { fixture } = setup(makeUser());
    const root = fixture.nativeElement as HTMLElement;

    expect(byTestId(root, 'dashboard-email').textContent).toContain('patient@example.com');
    expect(byTestId(root, 'dashboard-role').textContent).toContain('Patient');
  });

  it('affiche le nom complet dans la salutation quand il est disponible', () => {
    const { fixture } = setup(makeUser({ firstName: 'Ada', lastName: 'Lovelace' }));
    const root = fixture.nativeElement as HTMLElement;

    expect(byTestId(root, 'dashboard-welcome').textContent).toContain('Ada Lovelace');
  });

  it('ne contient plus de bouton de déconnexion (migré vers le header)', () => {
    const { fixture } = setup(makeUser());
    const root = fixture.nativeElement as HTMLElement;

    expect(root.querySelector('[data-testid="dashboard-logout"]')).toBeNull();
  });

  it('expose un seul <h1> (la salutation)', () => {
    const { fixture } = setup(makeUser());
    const root = fixture.nativeElement as HTMLElement;

    expect(root.querySelectorAll('h1').length).toBe(1);
  });

  it('affiche les KPI et accès rapides du patient', () => {
    const { fixture } = setup(makeUser({ role: 'patient' }));
    const root = fixture.nativeElement as HTMLElement;

    expect(root.textContent).toContain('Rendez-vous à venir');
    expect(root.textContent).toContain('Rendez-vous passés');
    expect(allByTestId(root, 'dashboard-quick-action').length).toBe(3);
    expect(root.textContent).toContain('Prendre un rendez-vous');
  });

  it.each<UserRole>(['clinic_admin', 'super_admin'])(
    'affiche les KPI d’administration pour %s',
    (role) => {
      const { fixture } = setup(makeUser({ role, email: 'admin@example.com' }));
      const root = fixture.nativeElement as HTMLElement;

      expect(root.textContent).toContain('RDV du jour');
      expect(root.textContent).toContain('Médecins actifs');
      expect(root.textContent).toContain('Taux de remplissage');
      expect(root.textContent).toContain('Utilisateurs');
    },
  );

  it('n’invente aucune donnée : les KPI restent en placeholder « — »', () => {
    const { fixture } = setup(makeUser());
    const root = fixture.nativeElement as HTMLElement;
    const numbers = Array.from(root.querySelectorAll('.mp-stat__number'));

    expect(numbers.length).toBeGreaterThan(0);
    expect(numbers.every((n) => n.textContent?.trim() === '—')).toBe(true);
  });

  it('rend les accès rapides désactivés (aucune navigation réelle)', () => {
    const { fixture } = setup(makeUser());
    const root = fixture.nativeElement as HTMLElement;
    const actions = allByTestId<HTMLButtonElement>(root, 'dashboard-quick-action');

    expect(actions.every((btn) => btn.disabled)).toBe(true);
  });
});

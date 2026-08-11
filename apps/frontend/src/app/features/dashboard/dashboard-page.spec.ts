import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { AuthFacade, PublicUser, UserRole } from '@core/auth';
import { AppointmentFlowService } from '@features/clinic-flow/appointment-flow.service';
import { PatientAppointmentsService } from '@features/patient/patient-appointments.service';
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
  // Faux service de flux : file du jour vide et synchrone (aucun HttpClient,
  // `isLoading` déterministe pour l'assertion des KPI/labels).
  const fakeFlow = { listToday: () => of([]) };
  // Idem côté patient : aucun rendez-vous, réponse synchrone, aucun HttpClient.
  const fakePatient = { listMine: () => of([]) };

  function setup(user: PublicUser | null) {
    const facade = createFakeFacade(user);
    TestBed.configureTestingModule({
      imports: [DashboardPage],
      providers: [
        provideRouter([]),
        { provide: AuthFacade, useValue: facade },
        { provide: AppointmentFlowService, useValue: fakeFlow },
        { provide: PatientAppointmentsService, useValue: fakePatient },
      ],
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

  it('ne déverse pas l’e-mail complet dans le grand titre sans nom (partie locale)', () => {
    const { fixture } = setup(makeUser({ firstName: null, lastName: null, email: 'admin@clinique.ca' }));
    const root = fixture.nativeElement as HTMLElement;
    const welcome = byTestId(root, 'dashboard-welcome').textContent ?? '';

    expect(welcome).toContain('Bonjour, admin');
    expect(welcome).not.toContain('@clinique.ca');
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
    expect(root.textContent).toContain('Prendre un rendez-vous');
    // MEDIPLAN-21 : les deux accès rapides du patient mènent désormais quelque
    // part. Plus aucun « bientôt » sur cet écran — c'était le cul-de-sac.
    expect(allByTestId(root, 'dashboard-quick-action-link').length).toBe(2);
    expect(allByTestId(root, 'dashboard-quick-action').length).toBe(0);
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

  it.each<UserRole>(['clinic_admin', 'super_admin'])(
    'rend l’accès rapide « Utilisateurs » comme lien actif vers /admin/users pour %s',
    (role) => {
      const { fixture } = setup(makeUser({ role, email: 'admin@example.com' }));
      const root = fixture.nativeElement as HTMLElement;

      const link = byTestId<HTMLAnchorElement>(root, 'dashboard-quick-action-link');
      expect(link).not.toBeNull();
      expect(link.getAttribute('href')).toContain('/admin/users');
      expect(link.textContent).toContain('Utilisateurs');
      // « Disponibilités » est désormais un lien actif (/availabilities) ;
      // seul « Médecins » reste désactivé « bientôt ».
      expect(allByTestId(root, 'dashboard-quick-action').length).toBe(1);
    },
  );

  // MEDIPLAN-21 : les compteurs du patient sont calculés sur ses propres
  // rendez-vous. Le faux service n'en renvoie aucun, donc « 0 » — et « 0 » est
  // une information, contrairement au « — » d'avant.
  it('affiche les compteurs réels du patient plutôt qu’un placeholder', () => {
    const { fixture } = setup(makeUser({ role: 'patient' }));
    const root = fixture.nativeElement as HTMLElement;
    const numbers = Array.from(root.querySelectorAll('.dash-kpi__value'));

    expect(numbers.map((n) => n.textContent?.trim())).toEqual(['0', '0']);
  });

  it('n’invente aucune donnée : les KPI encore sans source restent en « — »', () => {
    const { fixture } = setup(makeUser({ role: 'clinic_admin', email: 'admin@example.com' }));
    const root = fixture.nativeElement as HTMLElement;
    const values = Array.from(root.querySelectorAll('.dash-kpi__value')).map((n) =>
      n.textContent?.trim(),
    );

    // « RDV du jour » est réel (file vide → 0) ; « Médecins actifs » et « Taux
    // de remplissage » n'ont toujours pas de source et l'assument.
    expect(values).toContain('0');
    expect(values.filter((v) => v === '—').length).toBe(2);
  });

  it('rend les accès rapides « bientôt » non navigables (aria-disabled, pas de lien)', () => {
    // Testé sur un rôle qui en a encore un : côté admin, « Médecins » n'a pas
    // d'écran. Le patient, lui, n'a plus aucun accès rapide désactivé.
    const { fixture } = setup(makeUser({ role: 'clinic_admin', email: 'admin@example.com' }));
    const root = fixture.nativeElement as HTMLElement;
    const actions = allByTestId<HTMLElement>(root, 'dashboard-quick-action');

    expect(actions.length).toBeGreaterThan(0);
    expect(actions.every((el) => el.getAttribute('aria-disabled') === 'true')).toBe(true);
    expect(actions.every((el) => el.tagName !== 'A')).toBe(true);
  });
});

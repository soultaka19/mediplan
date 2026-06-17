import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { AuthFacade, PublicUser } from '@core/auth';
import { DashboardPage } from './dashboard-page';

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

function byTestId<T extends HTMLElement>(root: HTMLElement, id: string): T {
  return root.querySelector(`[data-testid="${id}"]`) as T;
}

describe('DashboardPage', () => {
  function setup(user: PublicUser | null) {
    const facade = createFakeFacade(user);
    TestBed.configureTestingModule({
      imports: [DashboardPage],
      providers: [provideRouter([]), { provide: AuthFacade, useValue: facade }],
    });
    const fixture = TestBed.createComponent(DashboardPage);
    fixture.detectChanges();
    return { fixture, facade };
  }

  it('affiche l’e-mail et le rôle de l’utilisateur connecté', () => {
    const { fixture } = setup(patient());
    const root = fixture.nativeElement as HTMLElement;

    expect(byTestId(root, 'dashboard-email').textContent).toContain('patient@example.com');
    expect(byTestId(root, 'dashboard-role').textContent).toContain('Patient');
  });

  it('affiche le nom complet quand il est disponible', () => {
    const { fixture } = setup(patient({ firstName: 'Ada', lastName: 'Lovelace' }));
    const root = fixture.nativeElement as HTMLElement;

    expect(byTestId(root, 'dashboard-welcome').textContent).toContain('Ada Lovelace');
  });

  it('déconnecte et redirige vers /login', () => {
    const { fixture, facade } = setup(patient());
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const root = fixture.nativeElement as HTMLElement;

    byTestId<HTMLButtonElement>(root, 'dashboard-logout').click();

    expect(facade.logout).toHaveBeenCalled();
    expect(navigateSpy).toHaveBeenCalledWith(['/login']);
  });
});

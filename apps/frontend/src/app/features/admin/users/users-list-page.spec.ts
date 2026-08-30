import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { PublicUser } from '@core/auth';
import { UserService } from './user.service';
import { UsersListPage } from './users-list-page';

function makeUser(overrides: Partial<PublicUser> = {}): PublicUser {
  return {
    id: 'u1',
    email: 'admin@example.com',
    firstName: 'Ada',
    lastName: 'Lovelace',
    role: 'clinic_admin',
    clinicId: 'c1',
    isActive: true,
    createdAt: '2026-06-17T00:00:00.000Z',
    ...overrides,
  };
}

/** Fake d'UserService : `listUsers` contrôlable par test. */
function createFakeService(listUsers: ReturnType<typeof vi.fn>) {
  return { listUsers } as unknown as UserService;
}

function byTestId<T extends HTMLElement>(root: HTMLElement, id: string): T | null {
  return root.querySelector<T>(`[data-testid="${id}"]`);
}

function allByTestId<T extends HTMLElement>(root: HTMLElement, id: string): T[] {
  return Array.from(root.querySelectorAll<T>(`[data-testid="${id}"]`));
}

describe('UsersListPage', () => {
  function setup(listUsers: ReturnType<typeof vi.fn>) {
    const service = createFakeService(listUsers);
    TestBed.configureTestingModule({
      imports: [UsersListPage],
      providers: [{ provide: UserService, useValue: service }],
    });
    const fixture = TestBed.createComponent(UsersListPage);
    fixture.detectChanges();
    return { fixture };
  }

  it('affiche un seul <h1>', () => {
    const { fixture } = setup(vi.fn(() => of([makeUser()])));
    const root = fixture.nativeElement as HTMLElement;

    expect(root.querySelectorAll('h1').length).toBe(1);
  });

  it('rend le tableau et une ligne par utilisateur en cas de succès', () => {
    const users = [
      makeUser(),
      makeUser({
        id: 'u2',
        email: 'doc@example.com',
        firstName: 'Alan',
        lastName: 'Turing',
        role: 'doctor',
      }),
    ];
    const { fixture } = setup(vi.fn(() => of(users)));
    const root = fixture.nativeElement as HTMLElement;

    expect(byTestId(root, 'users-table')).not.toBeNull();
    expect(allByTestId(root, 'users-row').length).toBe(2);
    expect(root.textContent).toContain('Ada Lovelace');
    expect(root.textContent).toContain('doc@example.com');
  });

  it('affiche le statut en texte (pas uniquement la couleur)', () => {
    const { fixture } = setup(vi.fn(() => of([makeUser({ isActive: false })])));
    const root = fixture.nativeElement as HTMLElement;

    expect(root.textContent).toContain('Inactif');
  });

  it('affiche l’EmptyState quand la liste est vide', () => {
    const { fixture } = setup(vi.fn(() => of([])));
    const root = fixture.nativeElement as HTMLElement;

    expect(byTestId(root, 'users-empty')).not.toBeNull();
    expect(byTestId(root, 'users-table')).toBeNull();
    expect(root.textContent).toContain('Aucun utilisateur');
  });

  it('affiche l’Alert d’erreur en cas d’échec du chargement', () => {
    const error = new HttpErrorResponse({ status: 500, statusText: 'Server Error' });
    const { fixture } = setup(vi.fn(() => throwError(() => error)));
    const root = fixture.nativeElement as HTMLElement;

    expect(byTestId(root, 'users-error')).not.toBeNull();
    expect(byTestId(root, 'users-table')).toBeNull();
  });
});

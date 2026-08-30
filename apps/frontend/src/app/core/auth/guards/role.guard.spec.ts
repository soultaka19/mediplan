import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree } from '@angular/router';

import { AuthFacade } from '../auth.facade';
import { PublicUser } from '../models/auth.models';
import { UserRole } from '../models/user-role';
import { roleGuard } from './role.guard';

function user(role: UserRole): PublicUser {
  return {
    id: 'u1',
    email: 'user@example.com',
    firstName: null,
    lastName: null,
    role,
    clinicId: null,
    isActive: true,
    createdAt: '',
  };
}

/** Fake d'AuthFacade : authentification + utilisateur courant contrôlables. */
function createFakeFacade(current: PublicUser | null) {
  const currentUser = signal(current);
  return {
    currentUser,
    isAuthenticated: () => currentUser() !== null,
  };
}

/** Exécute le guard dans un contexte d'injection (résout les `inject(...)`). */
function runGuard(guard: ReturnType<typeof roleGuard>): boolean | UrlTree {
  return TestBed.runInInjectionContext(() =>
    guard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
  ) as boolean | UrlTree;
}

describe('roleGuard', () => {
  function setup(current: PublicUser | null) {
    TestBed.configureTestingModule({
      providers: [{ provide: AuthFacade, useValue: createFakeFacade(current) }],
    });
  }

  it('laisse passer un rôle autorisé', () => {
    setup(user('clinic_admin'));
    const result = runGuard(roleGuard('clinic_admin', 'super_admin'));
    expect(result).toBe(true);
  });

  it('redirige vers /dashboard un utilisateur authentifié mais non autorisé', () => {
    setup(user('patient'));
    const router = TestBed.inject(Router);
    const result = runGuard(roleGuard('clinic_admin', 'super_admin'));
    expect(result).toEqual(router.createUrlTree(['/dashboard']));
  });

  it('redirige vers /login un utilisateur non authentifié', () => {
    setup(null);
    const router = TestBed.inject(Router);
    const result = runGuard(roleGuard('clinic_admin', 'super_admin'));
    expect(result).toEqual(router.createUrlTree(['/login']));
  });
});

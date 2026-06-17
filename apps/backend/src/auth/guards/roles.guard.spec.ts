import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthenticatedUser } from '../auth.types';
import { UserRole } from '../../user/user-role.enum';
import { RolesGuard } from './roles.guard';

/**
 * Tests unitaires du RolesGuard (Reflector et ExecutionContext mockés).
 * Couvre : pas de métadonnée -> autorise ; rôle correspond -> autorise ;
 * rôle non correspondant -> 403 ; request.user absent -> 403.
 */
describe('RolesGuard', () => {
  let reflector: jest.Mocked<Pick<Reflector, 'getAllAndOverride'>>;
  let guard: RolesGuard;

  // Fabrique un ExecutionContext minimal portant un `request.user` donné.
  const buildContext = (user?: AuthenticatedUser): ExecutionContext =>
    ({
      switchToHttp: () => ({ getRequest: () => ({ user }) }),
      getHandler: () => undefined,
      getClass: () => undefined,
    }) as unknown as ExecutionContext;

  const adminUser: AuthenticatedUser = {
    id: 'user-1',
    role: UserRole.CLINIC_ADMIN,
    clinicId: 'clinic-1',
    email: 'admin@example.com',
  };

  beforeEach(() => {
    reflector = { getAllAndOverride: jest.fn() };
    guard = new RolesGuard(reflector as unknown as Reflector);
  });

  it('aucune métadonnée de rôle -> autorise', () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);
    expect(guard.canActivate(buildContext(adminUser))).toBe(true);
  });

  it('liste de rôles vide -> autorise', () => {
    reflector.getAllAndOverride.mockReturnValue([]);
    expect(guard.canActivate(buildContext(adminUser))).toBe(true);
  });

  it('rôle de l’utilisateur correspond -> autorise', () => {
    reflector.getAllAndOverride.mockReturnValue([UserRole.CLINIC_ADMIN, UserRole.SUPER_ADMIN]);
    expect(guard.canActivate(buildContext(adminUser))).toBe(true);
  });

  it('rôle de l’utilisateur non autorisé -> ForbiddenException', () => {
    reflector.getAllAndOverride.mockReturnValue([UserRole.SUPER_ADMIN]);
    const patient: AuthenticatedUser = { ...adminUser, role: UserRole.PATIENT };
    expect(() => guard.canActivate(buildContext(patient))).toThrow(ForbiddenException);
  });

  it('request.user absent -> ForbiddenException', () => {
    reflector.getAllAndOverride.mockReturnValue([UserRole.SUPER_ADMIN]);
    expect(() => guard.canActivate(buildContext(undefined))).toThrow(ForbiddenException);
  });
});

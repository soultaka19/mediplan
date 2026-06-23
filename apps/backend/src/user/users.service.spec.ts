import { ConfigService } from '@nestjs/config';
import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthenticatedUser } from '../auth/auth.types';
import { UserRole } from './user-role.enum';
import { User } from './user.entity';
import { UsersService } from './users.service';

/**
 * Tests unitaires du UsersService (repository mocké).
 * Couvre le scope clinic_id du RBAC et l'absence de fuite de champs sensibles.
 */
describe('UsersService', () => {
  let service: UsersService;
  let repo: jest.Mocked<Repository<User>>;

  const buildUser = (overrides: Partial<User> = {}): User => ({
    id: 'user-1',
    email: 'user@example.com',
    passwordHash: 'secret-hash',
    firstName: 'Jane',
    lastName: 'Doe',
    role: UserRole.PATIENT,
    clinicId: null,
    isSelfRegistered: true,
    isActive: true,
    failedLoginAttempts: 3,
    lockedUntil: new Date('2026-01-01T00:00:00Z'),
    passwordResetTokenHash: 'reset-hash',
    passwordResetExpiresAt: null,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    clinic: null,
    ...overrides,
  });

  const authUser = (overrides: Partial<AuthenticatedUser> = {}): AuthenticatedUser => ({
    id: 'admin-1',
    role: UserRole.CLINIC_ADMIN,
    clinicId: 'clinic-1',
    email: 'admin@example.com',
    ...overrides,
  });

  beforeEach(async () => {
    const repoMock: Partial<jest.Mocked<Repository<User>>> = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn((entity: Partial<User>) => entity as User),
      save: jest.fn(async (entity: User) => buildUser(entity)),
      update: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: repoMock },
        { provide: ConfigService, useValue: { get: jest.fn(() => undefined) } },
      ],
    }).compile();

    service = module.get(UsersService);
    repo = module.get(getRepositoryToken(User));
  });

  describe('findOneById', () => {
    it('renvoie la vue publique sans champ sensible', async () => {
      repo.findOne.mockResolvedValue(buildUser());

      const result = await service.findOneById('user-1');

      expect(result.id).toBe('user-1');
      expect(result).not.toHaveProperty('passwordHash');
      expect(result).not.toHaveProperty('failedLoginAttempts');
      expect(result).not.toHaveProperty('lockedUntil');
      expect(result).not.toHaveProperty('passwordResetTokenHash');
    });

    it('utilisateur introuvable -> NotFoundException', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.findOneById('ghost')).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('findAllScoped', () => {
    it('super_admin -> liste complète, find() sans filtre clinique', async () => {
      repo.find.mockResolvedValue([buildUser({ id: 'a' }), buildUser({ id: 'b' })]);

      const result = await service.findAllScoped(authUser({ role: UserRole.SUPER_ADMIN }));

      // super_admin : find() appelé sans filtre clinique.
      expect(repo.find.mock.calls[0]).toEqual([]);
      expect(result).toHaveLength(2);
    });

    it('clinic_admin -> filtre clinicId = sa clinique', async () => {
      repo.find.mockResolvedValue([buildUser({ id: 'a', clinicId: 'clinic-1' })]);

      const result = await service.findAllScoped(
        authUser({ role: UserRole.CLINIC_ADMIN, clinicId: 'clinic-1' }),
      );

      expect(repo.find.mock.calls[0]).toEqual([{ where: { clinicId: 'clinic-1' } }]);
      expect(result).toHaveLength(1);
    });

    it('clinic_admin sans clinicId -> liste vide, aucune requête', async () => {
      const result = await service.findAllScoped(
        authUser({ role: UserRole.CLINIC_ADMIN, clinicId: null }),
      );

      expect(result).toEqual([]);
      expect(repo.find.mock.calls.length).toBe(0);
    });

    it('ne renvoie aucun champ sensible (sortie = PublicUser)', async () => {
      repo.find.mockResolvedValue([buildUser({ id: 'a' })]);

      const [first] = await service.findAllScoped(authUser({ role: UserRole.SUPER_ADMIN }));

      expect(first).not.toHaveProperty('passwordHash');
      expect(first).not.toHaveProperty('failedLoginAttempts');
      expect(first).not.toHaveProperty('lockedUntil');
      expect(first).not.toHaveProperty('passwordResetTokenHash');
    });
  });
});

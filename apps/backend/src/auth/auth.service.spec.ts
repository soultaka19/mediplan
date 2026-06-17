import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { UserRole } from '../user/user-role.enum';
import { User } from '../user/user.entity';
import { AuthService } from './auth.service';

// bcrypt v6 expose des propriétés non reconfigurables : `jest.spyOn(bcrypt, ...)`
// échoue avec « Cannot redefine property ». On mocke donc le module entier et
// on pilote `hash`/`compare` via des jest.fn() typés.
jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

// Signatures explicites : restaure le typage des arguments (mock.calls) perdu
// par le cast, pour éviter les accès « unsafe any » signalés par ESLint.
const bcryptHash = bcrypt.hash as unknown as jest.Mock<
  (data: string, rounds: number) => Promise<string>
>;
const bcryptCompare = bcrypt.compare as unknown as jest.Mock<
  (data: string, hash: string) => Promise<boolean>
>;

/**
 * Tests unitaires du service d'authentification (repository mocké).
 * Couvre AC1, AC2, AC3, AC4, AC5 et l'anti-énumération (hash factice).
 */
describe('AuthService', () => {
  let service: AuthService;
  let repo: jest.Mocked<Repository<User>>;

  const config: Record<string, string> = {
    BCRYPT_ROUNDS: '12',
    JWT_EXPIRES_IN: '60m',
    JWT_SECRET: 'test-secret-at-least-32-characters-long-xx',
  };

  beforeEach(async () => {
    bcryptHash.mockReset();
    bcryptCompare.mockReset();

    const repoMock: Partial<jest.Mocked<Repository<User>>> = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      increment: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useValue: repoMock },
        {
          provide: JwtService,
          useValue: { sign: jest.fn().mockReturnValue('signed.jwt.token') },
        },
        {
          provide: ConfigService,
          useValue: { get: (key: string): string | undefined => config[key] },
        },
      ],
    }).compile();

    service = module.get(AuthService);
    repo = module.get(getRepositoryToken(User));
  });

  afterEach(() => jest.restoreAllMocks());

  const buildUser = (overrides: Partial<User> = {}): User => ({
    id: 'user-1',
    email: 'patient@example.com',
    passwordHash: 'hash',
    firstName: null,
    lastName: null,
    role: UserRole.PATIENT,
    clinicId: null,
    isActive: true,
    failedLoginAttempts: 0,
    lockedUntil: null,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    clinic: null,
    ...overrides,
  });

  describe('register', () => {
    it('AC1/AC5 : crée un patient actif avec role=patient et clinicId=null', async () => {
      repo.findOne.mockResolvedValue(null);
      repo.create.mockImplementation((dto) => buildUser(dto as Partial<User>));
      repo.save.mockImplementation((u) => Promise.resolve(buildUser(u as Partial<User>)));
      bcryptHash.mockResolvedValue('hashed-pw');

      const result = await service.register({
        email: 'New@Example.com',
        password: 'Str0ng!pwd',
      });

      expect(bcryptHash).toHaveBeenCalledWith('Str0ng!pwd', 12);
      const createdArg = repo.create.mock.calls[0][0] as Partial<User>;
      expect(createdArg.role).toBe(UserRole.PATIENT);
      expect(createdArg.clinicId).toBeNull();
      expect(createdArg.isActive).toBe(true);
      expect(result.accessToken).toBe('signed.jwt.token');
      expect(result.tokenType).toBe('Bearer');
      // Aucun champ sensible exposé.
      expect(result.user).not.toHaveProperty('passwordHash');
      expect(result.user).not.toHaveProperty('failedLoginAttempts');
      expect(result.user).not.toHaveProperty('lockedUntil');
    });

    it('AC4 : email déjà utilisé -> 409, aucun save', async () => {
      repo.findOne.mockResolvedValue(buildUser());

      await expect(
        service.register({ email: 'patient@example.com', password: 'Str0ng!pwd' }),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(repo.save.mock.calls.length).toBe(0);
    });

    it('AC4 (concurrence) : violation unique 23505 au save -> 409', async () => {
      repo.findOne.mockResolvedValue(null);
      repo.create.mockReturnValue(buildUser());
      bcryptHash.mockResolvedValue('hashed-pw');
      repo.save.mockRejectedValue({ code: '23505' });

      await expect(
        service.register({ email: 'patient@example.com', password: 'Str0ng!pwd' }),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('login', () => {
    it('AC2 : identifiants valides -> JWT signé + failedLoginAttempts remis à 0', async () => {
      repo.findOne.mockResolvedValue(buildUser({ failedLoginAttempts: 3 }));
      bcryptCompare.mockResolvedValue(true);
      repo.update.mockResolvedValue({} as never);

      const result = await service.login({
        email: 'patient@example.com',
        password: 'Str0ng!pwd',
      });

      expect(repo.update.mock.calls[0]).toEqual([
        { id: 'user-1' },
        { failedLoginAttempts: 0, lockedUntil: null },
      ]);
      expect(result.accessToken).toBe('signed.jwt.token');
      expect(result.user.role).toBe(UserRole.PATIENT);
    });

    it('AC3 : mauvais mot de passe -> 401 + incrément des tentatives', async () => {
      repo.findOne.mockResolvedValue(buildUser({ failedLoginAttempts: 1 }));
      bcryptCompare.mockResolvedValue(false);
      repo.increment.mockResolvedValue({} as never);

      await expect(
        service.login({ email: 'patient@example.com', password: 'WrongPwd1!' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
      expect(repo.increment.mock.calls[0]).toEqual([{ id: 'user-1' }, 'failedLoginAttempts', 1]);
    });

    it('AC3 : email inexistant -> 401 générique + hash factice comparé (anti-énumération)', async () => {
      repo.findOne.mockResolvedValue(null);
      bcryptCompare.mockResolvedValue(false);

      await expect(
        service.login({ email: 'ghost@example.com', password: 'Whatever1!' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);

      // Le hash factice DOIT être invoqué pour égaliser le temps de réponse.
      expect(bcryptCompare.mock.calls.length).toBe(1);
      const [, dummyHashArg] = bcryptCompare.mock.calls[0] as [string, string];
      expect(dummyHashArg).toMatch(/^\$2b\$12\$/);
      expect(repo.increment.mock.calls.length).toBe(0);
    });

    it('compte désactivé -> 401 sans émettre de token', async () => {
      repo.findOne.mockResolvedValue(buildUser({ isActive: false }));
      bcryptCompare.mockResolvedValue(true);

      await expect(
        service.login({ email: 'patient@example.com', password: 'Str0ng!pwd' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });
});

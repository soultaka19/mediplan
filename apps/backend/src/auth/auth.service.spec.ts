import {
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { ClinicsService } from '../clinic/clinics.service';
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
  /** Annuaire des cliniques : par défaut, toute clinique demandée existe. */
  let clinicsMock: { existsActive: jest.Mock<Promise<boolean>, [string]> };

  const config: Record<string, string> = {
    BCRYPT_ROUNDS: '12',
    JWT_EXPIRES_IN: '60m',
    JWT_SECRET: 'test-secret-at-least-32-characters-long-xx',
    LOGIN_MAX_ATTEMPTS: '5',
    LOGIN_LOCK_DURATION_MINUTES: '15',
    PASSWORD_RESET_TOKEN_TTL_MINUTES: '30',
    NODE_ENV: 'test',
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

    clinicsMock = { existsActive: jest.fn().mockResolvedValue(true) };

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
        {
          provide: ClinicsService,
          useValue: clinicsMock,
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
    isSelfRegistered: true,
    isActive: true,
    failedLoginAttempts: 0,
    lockedUntil: null,
    passwordResetTokenHash: null,
    passwordResetExpiresAt: null,
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

    // MEDIPLAN-21 : le patient choisit sa clinique, mais ce choix est vérifié.
    it('rattache le patient à la clinique choisie après vérification en base', async () => {
      repo.findOne.mockResolvedValue(null);
      repo.create.mockImplementation((dto) => buildUser(dto as Partial<User>));
      repo.save.mockImplementation((u) => Promise.resolve(buildUser(u as Partial<User>)));
      bcryptHash.mockResolvedValue('hashed-pw');

      await service.register({
        email: 'julie@example.com',
        password: 'Str0ng!pwd',
        clinicId: 'clinic-1',
      });

      expect(clinicsMock.existsActive).toHaveBeenCalledWith('clinic-1');
      const createdArg = repo.create.mock.calls[0][0] as Partial<User>;
      expect(createdArg.clinicId).toBe('clinic-1');
      // Le rôle reste forcé : choisir sa clinique n'est pas choisir son rôle.
      expect(createdArg.role).toBe(UserRole.PATIENT);
    });

    it('clinique inconnue ou désactivée -> 400, aucun compte créé', async () => {
      repo.findOne.mockResolvedValue(null);
      clinicsMock.existsActive.mockResolvedValue(false);

      await expect(
        service.register({
          email: 'julie@example.com',
          password: 'Str0ng!pwd',
          clinicId: 'clinic-inconnue',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(repo.save.mock.calls.length).toBe(0);
    });

    it("sans clinique, le compte est créé mais n'est rattaché à rien", async () => {
      repo.findOne.mockResolvedValue(null);
      repo.create.mockImplementation((dto) => buildUser(dto as Partial<User>));
      repo.save.mockImplementation((u) => Promise.resolve(buildUser(u as Partial<User>)));
      bcryptHash.mockResolvedValue('hashed-pw');

      await service.register({ email: 'sans@example.com', password: 'Str0ng!pwd' });

      expect(clinicsMock.existsActive.mock.calls.length).toBe(0);
      expect((repo.create.mock.calls[0][0] as Partial<User>).clinicId).toBeNull();
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

    it('AC3 : mauvais mot de passe -> 401 + incrément des tentatives (compteur 1 -> 2)', async () => {
      repo.findOne.mockResolvedValue(buildUser({ failedLoginAttempts: 1 }));
      bcryptCompare.mockResolvedValue(false);
      repo.update.mockResolvedValue({} as never);

      await expect(
        service.login({ email: 'patient@example.com', password: 'WrongPwd1!' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
      // Compteur passé de 1 à 2, sans verrou (seuil 5 non atteint).
      expect(repo.update.mock.calls[0]).toEqual([
        { id: 'user-1' },
        { failedLoginAttempts: 2, lockedUntil: null },
      ]);
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
      // Aucune écriture pour un compte inexistant.
      expect(repo.update.mock.calls.length).toBe(0);
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

  describe('login — verrouillage de compte (MEDIPLAN-16 Partie A)', () => {
    // Vérifie qu'une promesse rejette avec une HttpException de statut 423.
    const expectLocked = async (promise: Promise<unknown>): Promise<void> => {
      let caught: unknown;
      try {
        await promise;
      } catch (e) {
        caught = e;
      }
      expect(caught).toBeInstanceOf(HttpException);
      expect((caught as HttpException).getStatus()).toBe(HttpStatus.LOCKED);
    };

    it('au seuil atteint (5e mauvais essai), pose lockedUntil et renvoie 423', async () => {
      // 4 tentatives déjà comptées ; ce 5e échec atteint le seuil.
      repo.findOne.mockResolvedValue(buildUser({ failedLoginAttempts: 4 }));
      bcryptCompare.mockResolvedValue(false);
      repo.update.mockResolvedValue({} as never);

      await expectLocked(service.login({ email: 'patient@example.com', password: 'WrongPwd1!' }));

      const [criteria, patch] = repo.update.mock.calls[0] as [
        { id: string },
        { failedLoginAttempts: number; lockedUntil: Date },
      ];
      expect(criteria).toEqual({ id: 'user-1' });
      expect(patch.failedLoginAttempts).toBe(0);
      expect(patch.lockedUntil).toBeInstanceOf(Date);
      // Verrou ~15 min dans le futur.
      expect(patch.lockedUntil.getTime()).toBeGreaterThan(Date.now() + 14 * 60_000);
    });

    it('compte verrouillé (lockedUntil futur) -> 423 même avec le bon mot de passe', async () => {
      const lockedUntil = new Date(Date.now() + 10 * 60_000);
      repo.findOne.mockResolvedValue(buildUser({ failedLoginAttempts: 0, lockedUntil }));
      bcryptCompare.mockResolvedValue(true);

      await expectLocked(service.login({ email: 'patient@example.com', password: 'Str0ng!pwd' }));
      // Le mot de passe n'est même pas comparé : rejet avant.
      expect(bcryptCompare.mock.calls.length).toBe(0);
      expect(repo.update.mock.calls.length).toBe(0);
    });

    it('verrou expiré (lockedUntil passé) + bon mdp -> login OK, compteur/verrou réinitialisés', async () => {
      const lockedUntil = new Date(Date.now() - 60_000);
      repo.findOne.mockResolvedValue(buildUser({ failedLoginAttempts: 5, lockedUntil }));
      bcryptCompare.mockResolvedValue(true);
      repo.update.mockResolvedValue({} as never);

      const result = await service.login({
        email: 'patient@example.com',
        password: 'Str0ng!pwd',
      });

      expect(result.accessToken).toBe('signed.jwt.token');
      // Compteur + verrou purgés au succès.
      expect(repo.update.mock.calls[0]).toEqual([
        { id: 'user-1' },
        { failedLoginAttempts: 0, lockedUntil: null },
      ]);
    });

    it('verrou expiré + mauvais mdp -> repart à 1 (compteur propre)', async () => {
      const lockedUntil = new Date(Date.now() - 60_000);
      repo.findOne.mockResolvedValue(buildUser({ failedLoginAttempts: 5, lockedUntil }));
      bcryptCompare.mockResolvedValue(false);
      repo.update.mockResolvedValue({} as never);

      await expect(
        service.login({ email: 'patient@example.com', password: 'WrongPwd1!' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
      // Verrou expiré ignoré : on repart de 0 puis +1 = 1.
      expect(repo.update.mock.calls[0]).toEqual([
        { id: 'user-1' },
        { failedLoginAttempts: 1, lockedUntil: null },
      ]);
    });
  });

  describe('forgotPassword (MEDIPLAN-16 Partie B)', () => {
    it('compte existant -> stocke hash du jeton + expiration, message neutre', async () => {
      repo.findOne.mockResolvedValue(buildUser({ id: 'user-1', isActive: true }));
      repo.update.mockResolvedValue({} as never);

      const result = await service.forgotPassword({ email: 'patient@example.com' });

      expect(result.message).toMatch(/Si un compte existe/i);
      const [criteria, patch] = repo.update.mock.calls[0] as [
        { id: string },
        { passwordResetTokenHash: string; passwordResetExpiresAt: Date },
      ];
      expect(criteria).toEqual({ id: 'user-1' });
      // Un hash sha256 (64 hex), jamais le jeton en clair.
      expect(patch.passwordResetTokenHash).toMatch(/^[a-f0-9]{64}$/);
      expect(patch.passwordResetExpiresAt).toBeInstanceOf(Date);
      expect(patch.passwordResetExpiresAt.getTime()).toBeGreaterThan(Date.now());
    });

    it('compte inexistant -> même message neutre, aucune écriture', async () => {
      repo.findOne.mockResolvedValue(null);

      const result = await service.forgotPassword({ email: 'ghost@example.com' });

      expect(result.message).toMatch(/Si un compte existe/i);
      expect(repo.update.mock.calls.length).toBe(0);
    });

    it('compte désactivé -> message neutre, aucun jeton généré', async () => {
      repo.findOne.mockResolvedValue(buildUser({ isActive: false }));

      const result = await service.forgotPassword({ email: 'patient@example.com' });

      expect(result.message).toMatch(/Si un compte existe/i);
      expect(repo.update.mock.calls.length).toBe(0);
    });
  });

  describe('resetPassword (MEDIPLAN-16 Partie B)', () => {
    const sha256 = (v: string): string => crypto.createHash('sha256').update(v).digest('hex');

    it('jeton valide -> mdp changé, jeton invalidé, verrou purgé', async () => {
      repo.findOne.mockResolvedValue(buildUser({ id: 'user-1' }));
      bcryptHash.mockResolvedValue('new-hash');
      repo.update.mockResolvedValue({} as never);

      const result = await service.resetPassword({
        token: 'plain-token-123',
        newPassword: 'Str0ng!pwd',
      });

      expect(result.message).toMatch(/réinitialisé/i);
      expect(bcryptHash).toHaveBeenCalledWith('Str0ng!pwd', 12);
      // La recherche se fait sur le HASH du jeton, pas le jeton brut.
      const findArg = repo.findOne.mock.calls[0][0] as {
        where: { passwordResetTokenHash: string };
      };
      expect(findArg.where.passwordResetTokenHash).toBe(sha256('plain-token-123'));
      // Jeton invalidé + verrou purgé.
      expect(repo.update.mock.calls[0][1]).toEqual({
        passwordHash: 'new-hash',
        passwordResetTokenHash: null,
        passwordResetExpiresAt: null,
        failedLoginAttempts: 0,
        lockedUntil: null,
      });
    });

    it('jeton invalide/expiré -> 400', async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(
        service.resetPassword({ token: 'bad-token', newPassword: 'Str0ng!pwd' }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(repo.update.mock.calls.length).toBe(0);
    });

    it('jeton à usage unique : 2e usage -> 400 (déjà invalidé)', async () => {
      // 1er usage : trouvé.
      repo.findOne.mockResolvedValueOnce(buildUser({ id: 'user-1' }));
      bcryptHash.mockResolvedValue('new-hash');
      repo.update.mockResolvedValue({} as never);

      await service.resetPassword({ token: 'tok', newPassword: 'Str0ng!pwd' });

      // 2e usage : le hash a été mis à null -> findOne ne retourne plus rien.
      repo.findOne.mockResolvedValueOnce(null);
      await expect(
        service.resetPassword({ token: 'tok', newPassword: 'Str0ng!pwd' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });
});

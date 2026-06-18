import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import request from 'supertest';
import { App } from 'supertest/types';
import { Repository } from 'typeorm';
import { AppModule } from './../src/app.module';
import { HttpExceptionFilter } from './../src/common/filters/http-exception.filter';
import { User } from './../src/user/user.entity';
import { UserRole } from './../src/user/user-role.enum';

/**
 * Tests e2e du module d'authentification (MEDIPLAN-15) contre la vraie base.
 *
 * Pré-requis : Postgres local démarré et migré (`pnpm --filter backend migration:run`).
 * Les emails sont rendus uniques par exécution et nettoyés en fin de suite.
 */
describe('Auth (e2e)', () => {
  let app: INestApplication<App>;
  let userRepo: Repository<User>;
  let jwtService: JwtService;

  // Suffixe unique pour isoler chaque exécution et éviter les collisions.
  const unique = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
  const email = `e2e.patient.${unique}@example.com`;
  const password = 'Str0ng!Pwd1';
  const createdEmails: string[] = [];

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    // Réplique exactement la config de main.ts.
    app.setGlobalPrefix('api/v1', { exclude: ['health'] });
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();

    userRepo = moduleFixture.get(getRepositoryToken(User));
    jwtService = moduleFixture.get(JwtService);
  });

  afterAll(async () => {
    if (userRepo && createdEmails.length > 0) {
      await userRepo.delete({ email: createdEmails as never });
    }
    await app?.close();
  });

  const url = (path: string): string => `/api/v1${path}`;

  interface PublicUserBody {
    id: string;
    email: string | null;
    role: string;
    clinicId: string | null;
    isActive: boolean;
    passwordHash?: unknown;
    failedLoginAttempts?: unknown;
    lockedUntil?: unknown;
  }
  interface AuthBody {
    accessToken: string;
    tokenType: string;
    expiresIn: string;
    user: PublicUserBody;
  }
  interface ErrorBody {
    statusCode: number;
    error: string;
    message: string | string[];
  }

  describe('POST /auth/register', () => {
    it('AC1 : inscription patient -> 201, role=patient, isActive, sans secret', async () => {
      createdEmails.push(email);
      const res = await request(app.getHttpServer())
        .post(url('/auth/register'))
        .send({ email, password, firstName: 'Eve', lastName: 'E2E' })
        .expect(201);

      const body = res.body as AuthBody;
      expect(body.user.role).toBe(UserRole.PATIENT);
      expect(body.user.clinicId).toBeNull();
      expect(body.user.isActive).toBe(true);
      expect(body.user.passwordHash).toBeUndefined();
      expect(body.user.failedLoginAttempts).toBeUndefined();
      expect(body.user.lockedUntil).toBeUndefined();
      expect(typeof body.accessToken).toBe('string');
      expect(body.tokenType).toBe('Bearer');
    });

    it('rejette une politique de mot de passe trop faible -> 400', async () => {
      await request(app.getHttpServer())
        .post(url('/auth/register'))
        .send({ email: `weak.${unique}@example.com`, password: 'weak' })
        .expect(400);
    });

    it('AC5 : un body contenant role/clinicId est rejeté -> 400', async () => {
      await request(app.getHttpServer())
        .post(url('/auth/register'))
        .send({
          email: `attacker.${unique}@example.com`,
          password,
          role: 'super_admin',
          clinicId: '00000000-0000-0000-0000-000000000000',
        })
        .expect(400);
    });

    it('AC4 : email déjà utilisé (casse différente) -> 409', async () => {
      await request(app.getHttpServer())
        .post(url('/auth/register'))
        .send({ email: email.toUpperCase(), password })
        .expect(409);
    });
  });

  describe('POST /auth/login', () => {
    it('AC2 : identifiants valides -> 200 + JWT décodable (claims attendus)', async () => {
      const res = await request(app.getHttpServer())
        .post(url('/auth/login'))
        .send({ email, password })
        .expect(200);

      const body = res.body as AuthBody;
      expect(body.tokenType).toBe('Bearer');
      const decoded = jwtService.verify<{
        sub: string;
        role: string;
        clinic_id: string | null;
        email: string;
      }>(body.accessToken);
      expect(decoded.role).toBe(UserRole.PATIENT);
      expect(decoded.clinic_id).toBeNull();
      expect(decoded.sub).toBe(body.user.id);

      // AC2 : compteur d'échecs remis à 0 en base.
      const persisted = await userRepo.findOne({ where: { email } });
      expect(persisted?.failedLoginAttempts).toBe(0);
    });

    it('AC3 : mauvais mot de passe -> 401 générique + incrément', async () => {
      const res = await request(app.getHttpServer())
        .post(url('/auth/login'))
        .send({ email, password: 'WrongPwd1!' })
        .expect(401);
      expect((res.body as ErrorBody).message).toBe('Identifiants invalides.');

      const persisted = await userRepo.findOne({ where: { email } });
      expect(persisted?.failedLoginAttempts ?? 0).toBeGreaterThanOrEqual(1);
    });

    it('AC3 : email inexistant -> 401 avec le même message générique', async () => {
      const res = await request(app.getHttpServer())
        .post(url('/auth/login'))
        .send({ email: `ghost.${unique}@example.com`, password })
        .expect(401);
      expect((res.body as ErrorBody).message).toBe('Identifiants invalides.');
    });
  });
});

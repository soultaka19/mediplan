import { ConflictException, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { UserRole } from '../user/user-role.enum';
import { User } from '../user/user.entity';
import { AuthResponse, PublicUser, toPublicUser } from './dto/auth-response.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtPayload } from './auth.types';

const DEFAULT_BCRYPT_ROUNDS = 12;

/**
 * Hash bcrypt factice pré-calculé (coût 12) sur une valeur arbitraire.
 *
 * ANTI-ÉNUMÉRATION (décision sécurité Phase 2) : au login, si l'email n'existe
 * pas (ou si le compte n'a pas de hash), on compare quand même le mot de passe
 * fourni contre ce hash constant. Cela aligne le temps de réponse sur le cas
 * « compte existant » et évite de révéler l'existence d'un compte par timing.
 * Le hash ne correspond à aucun mot de passe réel utilisé en clair.
 */
const DUMMY_BCRYPT_HASH = '$2b$12$fz30zU4HrDA.eS3H8yzsH.xpeM8BYFVrsj9VqNwSsIJAgkKNmWODK';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly bcryptRounds: number;
  private readonly jwtExpiresIn: string;

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.bcryptRounds = Number(
      this.configService.get<string>('BCRYPT_ROUNDS') ?? DEFAULT_BCRYPT_ROUNDS,
    );
    this.jwtExpiresIn = this.configService.get<string>('JWT_EXPIRES_IN') ?? '60m';
  }

  /**
   * Inscription d'un patient (AC1, AC4, AC5).
   *
   * - force `role = patient` et `clinicId = null` côté serveur (jamais du body) ;
   * - email unique insensible à la casse (citext) → conflit en 409 (AC4) ;
   * - compte actif et immédiatement connectable.
   */
  async register(dto: RegisterDto): Promise<AuthResponse> {
    const existing = await this.userRepository.findOne({
      where: { email: dto.email },
      select: { id: true },
    });
    if (existing) {
      // AC4 : aucun compte créé, conflit explicite. citext gère la casse.
      throw new ConflictException('Cette adresse e-mail est déjà utilisée.');
    }

    const passwordHash = await bcrypt.hash(dto.password, this.bcryptRounds);

    const user = this.userRepository.create({
      email: dto.email,
      passwordHash,
      firstName: dto.firstName ?? null,
      lastName: dto.lastName ?? null,
      // SÉCURITÉ AC5 : rôle/clinique forcés, jamais issus du client.
      role: UserRole.PATIENT,
      clinicId: null,
      isActive: true,
      failedLoginAttempts: 0,
      lockedUntil: null,
    });

    let saved: User;
    try {
      saved = await this.userRepository.save(user);
    } catch (error) {
      // Filet anti-concurrence : si deux inscriptions simultanées passent le
      // findOne, l'index unique de la base lèvera une violation (code 23505).
      if (this.isUniqueViolation(error)) {
        throw new ConflictException('Cette adresse e-mail est déjà utilisée.');
      }
      throw error;
    }

    return this.buildAuthResponse(saved);
  }

  /**
   * Connexion (AC2, AC3).
   *
   * - identifiants valides → JWT signé + `failedLoginAttempts` remis à 0 ;
   * - identifiants invalides → 401 générique + incrément des tentatives si le
   *   compte existe ; comparaison contre un hash factice si le compte est absent
   *   (anti-énumération par timing).
   */
  async login(dto: LoginDto): Promise<AuthResponse> {
    // passwordHash a `select: false` : on le ré-inclut explicitement ici.
    const user = await this.userRepository.findOne({
      where: { email: dto.email },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        clinicId: true,
        isActive: true,
        passwordHash: true,
        failedLoginAttempts: true,
        createdAt: true,
      },
    });

    if (!user || !user.passwordHash) {
      // Anti-énumération : on dépense le même temps CPU que pour un vrai compte,
      // puis on renvoie une erreur générique identique au cas « mauvais mdp ».
      await bcrypt.compare(dto.password, DUMMY_BCRYPT_HASH);
      throw new UnauthorizedException('Identifiants invalides.');
    }

    const passwordMatches = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordMatches) {
      // AC3 : incrémente le compteur (le rejet 423 et la fenêtre de blocage sont
      // implémentés en MEDIPLAN-16). Réponse générique, ne révèle rien.
      await this.userRepository.increment({ id: user.id }, 'failedLoginAttempts', 1);
      throw new UnauthorizedException('Identifiants invalides.');
    }

    if (!user.isActive) {
      // Compte désactivé : on n'émet pas de token. Message volontairement neutre.
      throw new UnauthorizedException('Identifiants invalides.');
    }

    // AC2 : succès → remise à zéro des tentatives (et du verrou éventuel).
    if (user.failedLoginAttempts !== 0) {
      await this.userRepository.update(
        { id: user.id },
        { failedLoginAttempts: 0, lockedUntil: null },
      );
      user.failedLoginAttempts = 0;
    }

    return this.buildAuthResponse(user);
  }

  /** Signe un JWT HS256 et compose la réponse publique. */
  private buildAuthResponse(user: User): AuthResponse {
    const publicUser: PublicUser = toPublicUser(user);
    const payload: JwtPayload = {
      sub: user.id,
      role: user.role,
      clinic_id: user.clinicId,
      email: user.email,
    };
    const accessToken = this.jwtService.sign(payload);
    return {
      accessToken,
      tokenType: 'Bearer',
      expiresIn: this.jwtExpiresIn,
      user: publicUser,
    };
  }

  /** Détecte une violation de contrainte unique PostgreSQL (code 23505). */
  private isUniqueViolation(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code?: unknown }).code === '23505'
    );
  }
}

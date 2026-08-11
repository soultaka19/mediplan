import {
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { MoreThan, Repository } from 'typeorm';
import { ClinicsService } from '../clinic/clinics.service';
import { UserRole } from '../user/user-role.enum';
import { User } from '../user/user.entity';
import { AuthResponse, PublicUser, toPublicUser } from './dto/auth-response.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { JwtPayload } from './auth.types';

const DEFAULT_BCRYPT_ROUNDS = 12;

/** Verrouillage de compte (MEDIPLAN-16, Partie A) — défauts si config absente/invalide. */
const DEFAULT_LOGIN_MAX_ATTEMPTS = 5;
const DEFAULT_LOGIN_LOCK_DURATION_MINUTES = 15;

/** Réinitialisation de mot de passe (MEDIPLAN-16, Partie B). */
const DEFAULT_PASSWORD_RESET_TOKEN_TTL_MINUTES = 30;
const PASSWORD_RESET_TOKEN_BYTES = 32;

/** Réponse neutre de demande de réinitialisation (anti-énumération). */
const FORGOT_PASSWORD_NEUTRAL_MESSAGE =
  'Si un compte existe pour cette adresse, un lien de réinitialisation a été envoyé.';

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
  private readonly loginMaxAttempts: number;
  private readonly loginLockDurationMinutes: number;
  private readonly passwordResetTtlMinutes: number;

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly clinicsService: ClinicsService,
  ) {
    // Garde défensive : une valeur absente, non numérique ("douze") ou trop
    // basse retombe sur le coût 12 (décision Phase 2) au lieu de produire un
    // NaN (500 au premier hash) ou d'affaiblir silencieusement le hachage.
    const configuredRounds = Number(this.configService.get<string>('BCRYPT_ROUNDS'));
    this.bcryptRounds =
      Number.isInteger(configuredRounds) && configuredRounds >= 10
        ? configuredRounds
        : DEFAULT_BCRYPT_ROUNDS;
    this.jwtExpiresIn = this.configService.get<string>('JWT_EXPIRES_IN') ?? '60m';

    // Verrouillage de compte (MEDIPLAN-16) : mêmes gardes défensives que BCRYPT_ROUNDS.
    // Toute valeur absente/non entière/non positive retombe sur le défaut.
    this.loginMaxAttempts = this.readPositiveInt('LOGIN_MAX_ATTEMPTS', DEFAULT_LOGIN_MAX_ATTEMPTS);
    this.loginLockDurationMinutes = this.readPositiveInt(
      'LOGIN_LOCK_DURATION_MINUTES',
      DEFAULT_LOGIN_LOCK_DURATION_MINUTES,
    );
    this.passwordResetTtlMinutes = this.readPositiveInt(
      'PASSWORD_RESET_TOKEN_TTL_MINUTES',
      DEFAULT_PASSWORD_RESET_TOKEN_TTL_MINUTES,
    );
  }

  /**
   * Lit un paramètre numérique entier strictement positif depuis la config.
   * Garde défensive : valeur absente, non numérique ou <= 0 → `fallback`.
   */
  private readPositiveInt(key: string, fallback: number): number {
    const value = Number(this.configService.get<string>(key));
    return Number.isInteger(value) && value > 0 ? value : fallback;
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

    // MEDIPLAN-21 : la clinique vient du client, elle est donc confrontée à la
    // base avant toute écriture. Un identifiant inconnu ou une clinique
    // désactivée est un 400, pas un rattachement silencieusement ignoré.
    if (dto.clinicId && !(await this.clinicsService.existsActive(dto.clinicId))) {
      throw new BadRequestException('Clinique introuvable.');
    }

    const passwordHash = await bcrypt.hash(dto.password, this.bcryptRounds);

    const user = this.userRepository.create({
      email: dto.email,
      passwordHash,
      firstName: dto.firstName ?? null,
      lastName: dto.lastName ?? null,
      // SÉCURITÉ AC5 : le rôle reste forcé, jamais issu du client. Seul le
      // rattachement à une clinique est choisi par le patient (et validé
      // ci-dessus) : sans lui, le compte ne donne accès à aucun créneau.
      role: UserRole.PATIENT,
      clinicId: dto.clinicId ?? null,
      isSelfRegistered: true,
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
   * Connexion (AC2, AC3) + verrouillage de compte (MEDIPLAN-16, Partie A).
   *
   * - compte verrouillé (lockedUntil futur) → 423 AVANT toute vérification de mdp ;
   * - identifiants valides → JWT signé + compteur/verrou remis à 0 ;
   * - mauvais mdp → 401 générique + incrément ; au seuil atteint, pose du verrou ;
   * - compte inexistant → 401 générique + hash factice (anti-énumération par timing).
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
        isSelfRegistered: true,
        isActive: true,
        passwordHash: true,
        failedLoginAttempts: true,
        lockedUntil: true,
        createdAt: true,
      },
    });

    if (!user || !user.passwordHash) {
      // Anti-énumération : on dépense le même temps CPU que pour un vrai compte,
      // puis on renvoie une erreur générique identique au cas « mauvais mdp ».
      // Le 423 ne concerne JAMAIS un compte inexistant (ne pas révéler l'existence).
      await bcrypt.compare(dto.password, DUMMY_BCRYPT_HASH);
      throw new UnauthorizedException('Identifiants invalides.');
    }

    const now = new Date();

    // Partie A : verrou actif (lockedUntil dans le futur) → 423 avant tout test de mdp.
    if (user.lockedUntil && user.lockedUntil.getTime() > now.getTime()) {
      throw new HttpException(
        'Compte temporairement verrouillé suite à trop de tentatives. Réessayez plus tard.',
        HttpStatus.LOCKED,
      );
    }

    // Verrou expiré (lockedUntil dans le passé) → compte déverrouillé : on repart
    // d'un compteur propre pour la tentative courante.
    let attempts = user.failedLoginAttempts;
    if (user.lockedUntil && user.lockedUntil.getTime() <= now.getTime()) {
      attempts = 0;
      user.lockedUntil = null;
    }

    const passwordMatches = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordMatches) {
      // AC3 : tentative échouée → incrément. Au seuil, on pose le verrou (et on
      // remet le compteur à 0 au moment du verrou). Réponse générique tant que non
      // verrouillé (401) ; 423 une fois le verrou posé.
      const nextAttempts = attempts + 1;
      if (nextAttempts >= this.loginMaxAttempts) {
        const lockedUntil = new Date(now.getTime() + this.loginLockDurationMinutes * 60_000);
        await this.userRepository.update({ id: user.id }, { failedLoginAttempts: 0, lockedUntil });
        throw new HttpException(
          'Compte temporairement verrouillé suite à trop de tentatives. Réessayez plus tard.',
          HttpStatus.LOCKED,
        );
      }
      await this.userRepository.update(
        { id: user.id },
        { failedLoginAttempts: nextAttempts, lockedUntil: null },
      );
      throw new UnauthorizedException('Identifiants invalides.');
    }

    if (!user.isActive) {
      // Compte désactivé : on n'émet pas de token. Message volontairement neutre.
      throw new UnauthorizedException('Identifiants invalides.');
    }

    // AC2 : succès → remise à zéro des tentatives (et du verrou éventuel).
    if (user.failedLoginAttempts !== 0 || user.lockedUntil !== null) {
      await this.userRepository.update(
        { id: user.id },
        { failedLoginAttempts: 0, lockedUntil: null },
      );
      user.failedLoginAttempts = 0;
      user.lockedUntil = null;
    }

    return this.buildAuthResponse(user);
  }

  /**
   * Demande de réinitialisation de mot de passe (MEDIPLAN-16, Partie B).
   *
   * Renvoie TOUJOURS un message neutre (anti-énumération) : le client ne peut
   * pas déduire si le compte existe. Si le compte existe, on génère un jeton
   * aléatoire fort, on stocke SON HASH (sha256) + une expiration, et — en dev
   * uniquement — on journalise le jeton/lien en clair (aucun envoi d'e-mail).
   */
  async forgotPassword(dto: ForgotPasswordDto): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({
      where: { email: dto.email },
      select: { id: true, isActive: true },
    });

    // Compte actif uniquement : on ne réinitialise pas un compte désactivé.
    if (user && user.isActive) {
      // Jeton url-safe (base64url) : transmissible tel quel dans une URL.
      const token = crypto.randomBytes(PASSWORD_RESET_TOKEN_BYTES).toString('base64url');
      const tokenHash = this.hashResetToken(token);
      const expiresAt = new Date(Date.now() + this.passwordResetTtlMinutes * 60_000);

      await this.userRepository.update(
        { id: user.id },
        { passwordResetTokenHash: tokenHash, passwordResetExpiresAt: expiresAt },
      );

      // En dev : on logge le jeton/lien (pas d'e-mail). JAMAIS en production.
      // Niveau `log` (et non `debug`) pour être visible avec le logger NestJS
      // par défaut, sinon le jeton serait introuvable côté développeur.
      if (this.configService.get<string>('NODE_ENV') !== 'production') {
        this.logger.log(
          `[DEV] Réinitialisation mot de passe — token=${token} ` +
            `lien=/reset-password?token=${token} (expire le ${expiresAt.toISOString()})`,
        );
      }
    }

    // Réponse identique que le compte existe ou non.
    return { message: FORGOT_PASSWORD_NEUTRAL_MESSAGE };
  }

  /**
   * Réinitialisation effective (MEDIPLAN-16, Partie B).
   *
   * Le jeton reçu est haché (sha256) puis comparé au hash stocké ; il doit être
   * non expiré. Si valide : nouveau hash bcrypt du mot de passe, jeton invalidé
   * (usage unique) et verrou purgé. Sinon : 400 générique (« Jeton invalide ou
   * expiré. ») — ne révèle ni l'existence d'un compte ni la cause exacte.
   */
  async resetPassword(dto: ResetPasswordDto): Promise<{ message: string }> {
    const tokenHash = this.hashResetToken(dto.token);

    // passwordResetTokenHash a `select:false` : ré-inclus explicitement ici.
    const user = await this.userRepository.findOne({
      where: {
        passwordResetTokenHash: tokenHash,
        passwordResetExpiresAt: MoreThan(new Date()),
      },
      select: { id: true },
    });

    if (!user) {
      throw new BadRequestException('Jeton invalide ou expiré.');
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, this.bcryptRounds);

    // Mise à jour atomique : nouveau hash, invalidation du jeton (usage unique),
    // purge du verrou (le légitime propriétaire reprend la main).
    await this.userRepository.update(
      { id: user.id },
      {
        passwordHash,
        passwordResetTokenHash: null,
        passwordResetExpiresAt: null,
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    );

    return { message: 'Votre mot de passe a été réinitialisé.' };
  }

  /** Hash SHA-256 (hex) d'un jeton de réinitialisation. Jamais le jeton en clair en base. */
  private hashResetToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
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

import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { EntityManager, Repository } from 'typeorm';
import { AuthenticatedUser } from '../auth/auth.types';
import { PublicUser, toPublicUser } from '../auth/dto/auth-response.dto';
import { ActivateLightPatientDto } from './dto/activate-light-patient.dto';
import { CreateLightPatientDto } from './dto/create-light-patient.dto';
import { UpdateDoctorPreferencesDto } from './dto/update-doctor-preferences.dto';
import { UserRole } from './user-role.enum';
import { User } from './user.entity';

const DEFAULT_BCRYPT_ROUNDS = 12;

/**
 * Logique métier de consultation des utilisateurs (MEDIPLAN-17 / EF-09).
 *
 * Porte le SCOPE `clinic_id` du RBAC : c'est ici, et non dans le contrôleur, que
 * l'on restreint les données selon le rôle et la clinique de l'appelant. Toutes les
 * sorties passent par `toPublicUser` pour ne jamais exposer de champ sensible
 * (passwordHash, failedLoginAttempts, lockedUntil, passwordResetTokenHash).
 */
@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly configService: ConfigService,
  ) {}

  /** Récupère un utilisateur par son id (vue publique). 404 si introuvable. */
  async findOneById(id: string): Promise<PublicUser> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('Utilisateur introuvable.');
    }
    return toPublicUser(user);
  }

  /**
   * Liste des utilisateurs selon le périmètre de l'appelant :
   * - `super_admin`  → tous les utilisateurs (aucun filtre clinique) ;
   * - `clinic_admin` → uniquement les utilisateurs de SA clinique ;
   *   si son `clinicId` est `null` (cas anormal), renvoie une liste vide (défensif).
   *
   * L'accès lui-même (rôles autorisés) est garanti en amont par `RolesGuard`
   * + `@Roles(...)` ; ce service applique le filtrage des données.
   */
  async findAllScoped(currentUser: AuthenticatedUser): Promise<PublicUser[]> {
    if (currentUser.role === UserRole.SUPER_ADMIN) {
      const users = await this.userRepository.find();
      return users.map(toPublicUser);
    }

    // clinic_admin : restreint à sa propre clinique.
    if (!currentUser.clinicId) {
      // Un clinic_admin sans clinique ne doit voir personne.
      return [];
    }

    const users = await this.userRepository.find({
      where: { clinicId: currentUser.clinicId },
    });
    return users.map(toPublicUser);
  }

  async createLightPatient(
    currentUser: AuthenticatedUser,
    dto: CreateLightPatientDto,
  ): Promise<PublicUser> {
    const clinicId = this.resolveTargetClinicId(currentUser, dto.clinicId);
    const patient = await this.createLightPatientWith(this.userRepository.manager, dto, clinicId);
    return toPublicUser(patient);
  }

  async updateDoctorPreferences(
    currentUser: AuthenticatedUser,
    dto: UpdateDoctorPreferencesDto,
  ): Promise<PublicUser> {
    if (currentUser.role !== UserRole.DOCTOR) {
      throw new ForbiddenException('Réservé aux médecins.');
    }

    await this.userRepository.update(
      { id: currentUser.id },
      { consultationDurationMin: dto.consultationDurationMin },
    );

    return this.findOneById(currentUser.id);
  }

  /**
   * Crée un patient léger (role=patient, passwordHash=NULL) via l'EntityManager
   * fourni. Méthode PARTAGÉE entre l'endpoint dédié (MEDIPLAN-35) et la
   * réservation par la réception (MEDIPLAN-23) : cette dernière l'appelle DANS sa
   * transaction pour rester atomique (patient + rendez-vous créés ensemble ou pas
   * du tout). Le périmètre clinique est résolu par l'appelant.
   */
  async createLightPatientWith(
    manager: EntityManager,
    input: { email?: string | null; firstName?: string | null; lastName?: string | null },
    clinicId: string,
  ): Promise<User> {
    if (input.email) {
      const existing = await manager.findOne(User, {
        where: { email: input.email },
        select: { id: true },
      });
      if (existing) {
        throw new ConflictException('Cette adresse e-mail est déjà utilisée.');
      }
    }

    const patient = manager.create(User, {
      email: input.email ?? null,
      passwordHash: null,
      firstName: input.firstName ?? null,
      lastName: input.lastName ?? null,
      role: UserRole.PATIENT,
      clinicId,
      isSelfRegistered: false,
      isActive: true,
      failedLoginAttempts: 0,
      lockedUntil: null,
      consultationDurationMin: 30,
    });

    try {
      return await manager.save(User, patient);
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        throw new ConflictException('Cette adresse e-mail est déjà utilisée.');
      }
      throw error;
    }
  }

  async activateLightPatient(
    currentUser: AuthenticatedUser,
    patientId: string,
    dto: ActivateLightPatientDto,
  ): Promise<PublicUser> {
    const patient = await this.userRepository.findOne({
      where: { id: patientId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        clinicId: true,
        isSelfRegistered: true,
        isActive: true,
        consultationDurationMin: true,
        createdAt: true,
      },
    });

    if (!patient || patient.role !== UserRole.PATIENT) {
      throw new NotFoundException('Patient introuvable.');
    }
    this.assertCanManageClinic(currentUser, patient.clinicId);

    if (patient.isSelfRegistered) {
      throw new BadRequestException('Ce patient possède déjà un compte libre-service.');
    }

    const existing = await this.userRepository.findOne({
      where: { email: dto.email },
      select: { id: true },
    });
    if (existing && existing.id !== patient.id) {
      throw new ConflictException('Cette adresse e-mail est déjà utilisée.');
    }

    const passwordHash = await bcrypt.hash(dto.password, this.getBcryptRounds());
    await this.userRepository.update(
      { id: patient.id },
      {
        email: dto.email,
        passwordHash,
        isSelfRegistered: true,
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    );

    return toPublicUser({
      ...patient,
      email: dto.email,
      passwordHash,
      isSelfRegistered: true,
      failedLoginAttempts: 0,
      lockedUntil: null,
    });
  }

  private resolveTargetClinicId(
    currentUser: AuthenticatedUser,
    requestedClinicId?: string,
  ): string {
    if (currentUser.role === UserRole.SUPER_ADMIN) {
      if (!requestedClinicId) {
        throw new BadRequestException('clinicId est requis pour créer un patient léger.');
      }
      return requestedClinicId;
    }

    if (!currentUser.clinicId) {
      throw new ForbiddenException('Aucune clinique rattachée à cet utilisateur.');
    }
    return currentUser.clinicId;
  }

  private assertCanManageClinic(currentUser: AuthenticatedUser, clinicId: string | null): void {
    if (currentUser.role === UserRole.SUPER_ADMIN) {
      return;
    }
    if (!clinicId || currentUser.clinicId !== clinicId) {
      throw new ForbiddenException('Patient hors périmètre clinique.');
    }
  }

  private getBcryptRounds(): number {
    const configuredRounds = Number(this.configService.get<string>('BCRYPT_ROUNDS'));
    return Number.isInteger(configuredRounds) && configuredRounds >= 10
      ? configuredRounds
      : DEFAULT_BCRYPT_ROUNDS;
  }

  private isUniqueViolation(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code?: unknown }).code === '23505'
    );
  }
}

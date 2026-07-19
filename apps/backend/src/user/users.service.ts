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
import { AppointmentSlot } from '../appointment/appointment-slot.entity';
import { Appointment } from '../appointment/appointment.entity';
import { AuthenticatedUser } from '../auth/auth.types';
import { PublicUser, toPublicUser } from '../auth/dto/auth-response.dto';
import { ActivateLightPatientDto } from './dto/activate-light-patient.dto';
import { CreateLightPatientDto } from './dto/create-light-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { UserRole } from './user-role.enum';
import { User } from './user.entity';

const DEFAULT_BCRYPT_ROUNDS = 12;

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly configService: ConfigService,
  ) {}

  async findOneById(id: string): Promise<PublicUser> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('Utilisateur introuvable.');
    }
    return toPublicUser(user);
  }

  async findAllScoped(currentUser: AuthenticatedUser): Promise<PublicUser[]> {
    if (currentUser.role === UserRole.SUPER_ADMIN) {
      const users = await this.userRepository.find();
      return users.map(toPublicUser);
    }

    if (!currentUser.clinicId) {
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
        throw new ConflictException('Cette adresse e-mail est deja utilisee.');
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
    });

    try {
      return await manager.save(User, patient);
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        throw new ConflictException('Cette adresse e-mail est deja utilisee.');
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
        createdAt: true,
      },
    });

    if (!patient || patient.role !== UserRole.PATIENT) {
      throw new NotFoundException('Patient introuvable.');
    }
    this.assertCanManageClinic(currentUser, patient.clinicId);

    if (patient.isSelfRegistered) {
      throw new BadRequestException('Ce patient possede deja un compte libre-service.');
    }

    const existing = await this.userRepository.findOne({
      where: { email: dto.email },
      select: { id: true },
    });
    if (existing && existing.id !== patient.id) {
      throw new ConflictException('Cette adresse e-mail est deja utilisee.');
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

  async updatePatient(
    currentUser: AuthenticatedUser,
    patientId: string,
    dto: UpdatePatientDto,
  ): Promise<PublicUser> {
    const patient = await this.findPatientForWrite(currentUser, patientId);
    const email = this.normalizeNullableText(dto.email);

    if (email) {
      const existing = await this.userRepository.findOne({
        where: { email },
        select: { id: true },
      });
      if (existing && existing.id !== patient.id) {
        throw new ConflictException('Cette adresse e-mail est deja utilisee.');
      }
    }

    if (dto.firstName !== undefined) {
      patient.firstName = this.normalizeNullableText(dto.firstName);
    }
    if (dto.lastName !== undefined) {
      patient.lastName = this.normalizeNullableText(dto.lastName);
    }
    if (dto.email !== undefined) {
      patient.email = email;
    }

    try {
      return toPublicUser(await this.userRepository.save(patient));
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        throw new ConflictException('Cette adresse e-mail est deja utilisee.');
      }
      throw error;
    }
  }

  async deletePatient(currentUser: AuthenticatedUser, patientId: string): Promise<void> {
    await this.userRepository.manager.transaction(async (manager) => {
      const patient = await this.findPatientForWrite(currentUser, patientId, manager);
      const appointments = await manager.find(Appointment, {
        where: { patientId: patient.id },
      });
      const slotIds = appointments.map((appointment) => appointment.slotId);

      if (appointments.length > 0) {
        await manager.remove(Appointment, appointments);
      }
      if (slotIds.length > 0) {
        await manager.update(AppointmentSlot, slotIds, { isBooked: false });
      }

      await manager.remove(User, patient);
    });
  }

  private resolveTargetClinicId(
    currentUser: AuthenticatedUser,
    requestedClinicId?: string,
  ): string {
    if (currentUser.role === UserRole.SUPER_ADMIN) {
      if (!requestedClinicId) {
        throw new BadRequestException('clinicId est requis pour creer un patient leger.');
      }
      return requestedClinicId;
    }

    if (!currentUser.clinicId) {
      throw new ForbiddenException('Aucune clinique rattachee a cet utilisateur.');
    }
    return currentUser.clinicId;
  }

  private assertCanManageClinic(currentUser: AuthenticatedUser, clinicId: string | null): void {
    if (currentUser.role === UserRole.SUPER_ADMIN) {
      return;
    }
    if (!clinicId || currentUser.clinicId !== clinicId) {
      throw new ForbiddenException('Patient hors perimetre clinique.');
    }
  }

  private async findPatientForWrite(
    currentUser: AuthenticatedUser,
    patientId: string,
    manager: EntityManager = this.userRepository.manager,
  ): Promise<User> {
    const patient = await manager.findOne(User, {
      where: { id: patientId },
    });

    if (!patient || patient.role !== UserRole.PATIENT) {
      throw new NotFoundException('Patient introuvable.');
    }

    this.assertCanManageClinic(currentUser, patient.clinicId);
    return patient;
  }

  private normalizeNullableText(value: string | null | undefined): string | null {
    if (value === undefined || value === null) {
      return null;
    }
    const trimmed = value.trim();
    return trimmed || null;
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

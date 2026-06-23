import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { AuthenticatedUser } from '../auth/auth.types';
import { UserRole } from '../user/user-role.enum';
import { User } from '../user/user.entity';
import { AppointmentSlot } from './appointment-slot.entity';
import { AppointmentStatus } from './appointment-status.enum';
import { Appointment } from './appointment.entity';
import {
  CreateReceptionAppointmentDto,
  ReceptionPatientInputDto,
} from './dto/create-reception-appointment.dto';
import { AppointmentResponse, toAppointmentResponse } from './dto/appointment-response.dto';

@Injectable()
export class AppointmentsService {
  constructor(private readonly dataSource: DataSource) {}

  async createByReception(
    currentUser: AuthenticatedUser,
    dto: CreateReceptionAppointmentDto,
  ): Promise<AppointmentResponse> {
    if ((dto.patientId && dto.patient) || (!dto.patientId && !dto.patient)) {
      throw new BadRequestException('Fournir soit patientId, soit patient.');
    }

    return this.dataSource.transaction(async (manager) => {
      const slot = await manager.findOne(AppointmentSlot, {
        where: { id: dto.slotId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!slot) {
        throw new NotFoundException('Créneau introuvable.');
      }
      this.assertCanManageClinic(currentUser, slot.clinicId);

      if (slot.isBooked) {
        throw new ConflictException('Ce créneau est déjà réservé.');
      }
      if (slot.startAt.getTime() >= slot.endAt.getTime()) {
        throw new BadRequestException('Créneau invalide.');
      }

      const patient = dto.patientId
        ? await this.findExistingPatient(manager, dto.patientId, slot.clinicId)
        : await this.createLightPatient(manager, dto.patient!, slot.clinicId);

      const appointment = manager.create(Appointment, {
        clinicId: slot.clinicId,
        slotId: slot.id,
        patientId: patient.id,
        doctorId: slot.doctorId,
        createdById: currentUser.id,
        status: AppointmentStatus.BOOKED,
        reason: dto.reason ?? null,
        cancellationReason: null,
      });

      let saved: Appointment;
      try {
        saved = await manager.save(Appointment, appointment);
        slot.isBooked = true;
        await manager.save(AppointmentSlot, slot);
      } catch (error) {
        if (this.isUniqueViolation(error)) {
          throw new ConflictException('Ce créneau est déjà réservé.');
        }
        throw error;
      }

      saved.slot = slot;
      return toAppointmentResponse(saved);
    });
  }

  private async findExistingPatient(
    manager: EntityManager,
    patientId: string,
    clinicId: string,
  ): Promise<User> {
    const patient = await manager.findOne(User, { where: { id: patientId } });
    if (!patient || patient.role !== UserRole.PATIENT) {
      throw new NotFoundException('Patient introuvable.');
    }

    if (patient.clinicId && patient.clinicId !== clinicId) {
      throw new ForbiddenException('Patient hors périmètre clinique.');
    }

    return patient;
  }

  private async createLightPatient(
    manager: EntityManager,
    patientInput: ReceptionPatientInputDto,
    clinicId: string,
  ): Promise<User> {
    if (patientInput.email) {
      const existing = await manager.findOne(User, {
        where: { email: patientInput.email },
        select: { id: true },
      });
      if (existing) {
        throw new ConflictException('Cette adresse e-mail est déjà utilisée.');
      }
    }

    const patient = manager.create(User, {
      email: patientInput.email ?? null,
      passwordHash: null,
      firstName: patientInput.firstName ?? null,
      lastName: patientInput.lastName ?? null,
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
        throw new ConflictException('Cette adresse e-mail est déjà utilisée.');
      }
      throw error;
    }
  }

  private assertCanManageClinic(currentUser: AuthenticatedUser, clinicId: string): void {
    if (currentUser.role === UserRole.SUPER_ADMIN) {
      return;
    }
    if (!currentUser.clinicId || currentUser.clinicId !== clinicId) {
      throw new ForbiddenException('Créneau hors périmètre clinique.');
    }
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

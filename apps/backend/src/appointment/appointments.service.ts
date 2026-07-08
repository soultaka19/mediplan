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
import { UsersService } from '../user/users.service';
import { AppointmentSlot } from './appointment-slot.entity';
import { AppointmentStatus } from './appointment-status.enum';
import { Appointment } from './appointment.entity';
import { CreateReceptionAppointmentDto } from './dto/create-reception-appointment.dto';
import { AppointmentResponse, toAppointmentResponse } from './dto/appointment-response.dto';
import {
  FLOW_APPOINTMENT_STATUSES,
  UpdateAppointmentStatusDto,
} from './dto/update-appointment-status.dto';

@Injectable()
export class AppointmentsService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly usersService: UsersService,
  ) {}

  async findToday(currentUser: AuthenticatedUser): Promise<AppointmentResponse[]> {
    const query = this.dataSource
      .getRepository(Appointment)
      .createQueryBuilder('appointment')
      .innerJoinAndSelect('appointment.slot', 'slot')
      .leftJoinAndSelect('appointment.patient', 'patient')
      .leftJoinAndSelect('appointment.doctor', 'doctor')
      .where("slot.start_at >= (date_trunc('day', now() AT TIME ZONE :tz) AT TIME ZONE :tz)", {
        tz: 'America/Toronto',
      })
      .andWhere(
        "slot.start_at < ((date_trunc('day', now() AT TIME ZONE :tz) + interval '1 day') AT TIME ZONE :tz)",
        { tz: 'America/Toronto' },
      )
      .andWhere('appointment.status != :cancelled', { cancelled: AppointmentStatus.CANCELLED })
      .orderBy('slot.start_at', 'ASC');

    if (currentUser.role === UserRole.DOCTOR) {
      query.andWhere('appointment.doctor_id = :doctorId', { doctorId: currentUser.id });
    } else if (currentUser.role === UserRole.CLINIC_ADMIN) {
      if (!currentUser.clinicId) {
        return [];
      }
      query.andWhere('appointment.clinic_id = :clinicId', { clinicId: currentUser.clinicId });
    }

    const appointments = await query.getMany();
    return appointments.map(toAppointmentResponse);
  }

  async updateStatus(
    currentUser: AuthenticatedUser,
    appointmentId: string,
    dto: UpdateAppointmentStatusDto,
  ): Promise<AppointmentResponse> {
    return this.dataSource.transaction(async (manager) => {
      const appointment = await manager.findOne(Appointment, {
        where: { id: appointmentId },
        relations: { slot: true, patient: true, doctor: true },
        lock: { mode: 'pessimistic_write' },
      });

      if (!appointment) {
        throw new NotFoundException('Rendez-vous introuvable.');
      }
      this.assertCanFollowAppointment(currentUser, appointment);

      if (!FLOW_APPOINTMENT_STATUSES.includes(dto.status)) {
        throw new BadRequestException('Statut de flux clinique invalide.');
      }

      if (!this.canTransition(appointment.status, dto.status)) {
        throw new BadRequestException('Transition de statut invalide.');
      }

      appointment.status = dto.status;
      const saved = await manager.save(Appointment, appointment);
      return toAppointmentResponse(saved);
    });
  }

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
        : await this.usersService.createLightPatientWith(manager, dto.patient!, slot.clinicId);

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

  private assertCanManageClinic(currentUser: AuthenticatedUser, clinicId: string): void {
    if (currentUser.role === UserRole.SUPER_ADMIN) {
      return;
    }
    if (!currentUser.clinicId || currentUser.clinicId !== clinicId) {
      throw new ForbiddenException('Créneau hors périmètre clinique.');
    }
  }

  private assertCanFollowAppointment(
    currentUser: AuthenticatedUser,
    appointment: Appointment,
  ): void {
    if (currentUser.role === UserRole.SUPER_ADMIN) {
      return;
    }

    if (currentUser.role === UserRole.DOCTOR && appointment.doctorId === currentUser.id) {
      return;
    }

    if (
      currentUser.role === UserRole.CLINIC_ADMIN &&
      currentUser.clinicId &&
      appointment.clinicId === currentUser.clinicId
    ) {
      return;
    }

    throw new NotFoundException('Rendez-vous introuvable.');
  }

  private canTransition(from: AppointmentStatus, to: AppointmentStatus): boolean {
    if (from === to) {
      return true;
    }

    const transitions: Record<AppointmentStatus, readonly AppointmentStatus[]> = {
      [AppointmentStatus.BOOKED]: [AppointmentStatus.ARRIVED, AppointmentStatus.ABSENT],
      [AppointmentStatus.ARRIVED]: [AppointmentStatus.IN_CONSULTATION, AppointmentStatus.ABSENT],
      [AppointmentStatus.IN_CONSULTATION]: [AppointmentStatus.COMPLETED, AppointmentStatus.ABSENT],
      [AppointmentStatus.COMPLETED]: [],
      [AppointmentStatus.ABSENT]: [],
      [AppointmentStatus.CANCELLED]: [],
    };

    return transitions[from].includes(to);
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

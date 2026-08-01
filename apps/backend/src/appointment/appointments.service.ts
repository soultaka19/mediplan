import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { AuthenticatedUser } from '../auth/auth.types';
import { NotificationsService } from '../notification/notifications.service';
import { UserRole } from '../user/user-role.enum';
import { User } from '../user/user.entity';
import { UsersService } from '../user/users.service';
import { AppointmentSlot } from './appointment-slot.entity';
import { AppointmentStatus } from './appointment-status.enum';
import { Appointment } from './appointment.entity';
import { CancelAppointmentDto } from './dto/cancel-appointment.dto';
import { CreateReceptionAppointmentDto } from './dto/create-reception-appointment.dto';
import { AppointmentResponse, toAppointmentResponse } from './dto/appointment-response.dto';
import {
  FLOW_APPOINTMENT_STATUSES,
  UpdateAppointmentStatusDto,
} from './dto/update-appointment-status.dto';

/** Statuts depuis lesquels un rendez-vous peut encore être annulé. */
const CANCELLABLE_STATUSES: readonly AppointmentStatus[] = [
  AppointmentStatus.BOOKED,
  AppointmentStatus.ARRIVED,
];

@Injectable()
export class AppointmentsService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly usersService: UsersService,
    private readonly notificationsService: NotificationsService,
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
      const appointment = await this.lockAppointmentRow(manager, appointmentId);

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
      await manager.save(Appointment, appointment);
      const fullAppointment = await this.loadAppointmentWithRelations(manager, appointment.id);
      await this.notificationsService.notifyAppointmentUpdated({
        manager,
        appointment: fullAppointment ?? appointment,
      });
      return this.buildResponse(manager, appointment);
    });
  }

  /**
   * Annule un rendez-vous (motif obligatoire) et **libère le créneau**.
   *
   * Réservé à la réception (garde `@Roles` côté contrôleur). Le créneau redevient
   * réservable (`isBooked = false`) et, l'annulation étant hors de l'index unique
   * partiel `WHERE status <> 'cancelled'`, il peut être re-réservé.
   */
  async cancel(
    currentUser: AuthenticatedUser,
    appointmentId: string,
    dto: CancelAppointmentDto,
  ): Promise<AppointmentResponse> {
    return this.dataSource.transaction(async (manager) => {
      const appointment = await this.lockAppointmentRow(manager, appointmentId);

      if (!appointment) {
        throw new NotFoundException('Rendez-vous introuvable.');
      }
      this.assertCanFollowAppointment(currentUser, appointment);

      if (!CANCELLABLE_STATUSES.includes(appointment.status)) {
        throw new BadRequestException('Ce rendez-vous ne peut plus être annulé.');
      }

      appointment.status = AppointmentStatus.CANCELLED;
      appointment.cancellationReason = dto.cancellationReason.trim();
      await manager.save(Appointment, appointment);

      // Libère le créneau (verrou sur la ligne créneau seule) : redevient réservable.
      const slot = await manager.findOne(AppointmentSlot, {
        where: { id: appointment.slotId },
        lock: { mode: 'pessimistic_write' },
      });
      if (slot) {
        slot.isBooked = false;
        await manager.save(AppointmentSlot, slot);
      }

      const fullAppointment = await this.loadAppointmentWithRelations(manager, appointment.id);
      await this.notificationsService.notifyAppointmentCancelled({
        manager,
        appointment: fullAppointment ?? appointment,
      });

      return this.buildResponse(manager, appointment);
    });
  }

  /**
   * Verrouille la SEULE ligne du rendez-vous (`FOR UPDATE`).
   *
   * On ne charge aucune relation ici : `FOR UPDATE` est interdit sur le côté
   * nullable d'une jointure externe (patient/médecin/créneau sont des jointures
   * LEFT). Les relations sont rechargées après coup pour construire la réponse.
   */
  private lockAppointmentRow(manager: EntityManager, id: string): Promise<Appointment | null> {
    return manager.findOne(Appointment, {
      where: { id },
      lock: { mode: 'pessimistic_write' },
    });
  }

  /** Recharge le rendez-vous avec ses relations (sans verrou) pour la réponse. */
  private async buildResponse(
    manager: EntityManager,
    appointment: Appointment,
  ): Promise<AppointmentResponse> {
    const full = await manager.findOne(Appointment, {
      where: { id: appointment.id },
      relations: { slot: true, patient: true, doctor: true },
    });
    return toAppointmentResponse(full ?? appointment);
  }

  private loadAppointmentWithRelations(
    manager: EntityManager,
    appointmentId: string,
  ): Promise<Appointment | null> {
    return manager.findOne(Appointment, {
      where: { id: appointmentId },
      relations: { slot: true, patient: true, doctor: true },
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
      saved.patient = patient;
      const fullAppointment = await this.loadAppointmentWithRelations(manager, saved.id);
      await this.notificationsService.notifyAppointmentBooked({
        manager,
        appointment: fullAppointment ?? saved,
      });
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

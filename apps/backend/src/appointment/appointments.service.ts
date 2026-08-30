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
import { CreateSelfAppointmentDto } from './dto/create-self-appointment.dto';
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

/** Horizon de proposition des créneaux au patient (MEDIPLAN-21). */
const OPEN_SLOTS_HORIZON_DAYS = 60;

/** Plafond de créneaux renvoyés : la liste est faite pour être parcourue. */
const OPEN_SLOTS_MAX = 300;

interface ExportAppointmentsParams {
  from?: string;
  to?: string;
}

/** Créneau réservable tel que présenté au patient. */
export interface OpenSlotResponse {
  id: string;
  doctorId: string;
  doctorName: string;
  startAt: string;
  endAt: string;
}

/** Nom affichable d'un médecin, avec repli sur l'e-mail si l'état civil manque. */
function formatDoctorName(doctor: User | null | undefined): string {
  if (!doctor) {
    return 'Médecin';
  }
  const name = [doctor.firstName, doctor.lastName].filter(Boolean).join(' ').trim();
  // `email` est nullable (patient léger) ; côté médecin il est toujours présent,
  // mais on ne s'appuie pas sur une garantie que le type ne porte pas.
  return name.length > 0 ? name : (doctor.email ?? 'Médecin');
}

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

  /**
   * Historique des rendez-vous du périmètre (tous statuts, plus récents d'abord).
   *
   * Scope identique à `findToday` : un médecin ne voit que les siens, un
   * `clinic_admin` ceux de sa clinique, un `super_admin` tous. Pas de pagination
   * serveur (volume académique) — le frontend pagine côté client.
   */
  async findAll(currentUser: AuthenticatedUser): Promise<AppointmentResponse[]> {
    const query = this.dataSource
      .getRepository(Appointment)
      .createQueryBuilder('appointment')
      .innerJoinAndSelect('appointment.slot', 'slot')
      .leftJoinAndSelect('appointment.patient', 'patient')
      .leftJoinAndSelect('appointment.doctor', 'doctor')
      .orderBy('slot.start_at', 'DESC');

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

  /**
   * Export CSV des rendez-vous d'une période (MEDIPLAN-27).
   *
   * Réservé aux administrateurs (garde `@Roles` côté contrôleur), d'où l'absence
   * de branche `DOCTOR` ici. Les bornes sont interprétées dans le fuseau de la
   * clinique : `to` est inclusif (borne haute au jour suivant, exclue).
   */
  async exportCsv(
    currentUser: AuthenticatedUser,
    params: ExportAppointmentsParams,
  ): Promise<string> {
    const from = this.parseExportDate(params.from, 'from');
    const to = this.parseExportDate(params.to, 'to');

    if (from > to) {
      throw new BadRequestException('La date de debut doit etre avant la date de fin.');
    }

    const query = this.dataSource
      .getRepository(Appointment)
      .createQueryBuilder('appointment')
      .innerJoinAndSelect('appointment.slot', 'slot')
      .leftJoinAndSelect('appointment.patient', 'patient')
      .leftJoinAndSelect('appointment.doctor', 'doctor')
      .where("slot.start_at >= (CAST(:from AS date) AT TIME ZONE 'America/Toronto')", {
        from,
      })
      .andWhere(
        "slot.start_at < ((CAST(:to AS date) + interval '1 day') AT TIME ZONE 'America/Toronto')",
        { to },
      )
      .orderBy('slot.start_at', 'ASC');

    if (currentUser.role === UserRole.CLINIC_ADMIN) {
      if (!currentUser.clinicId) {
        return this.toCsv([]);
      }
      query.andWhere('appointment.clinic_id = :clinicId', { clinicId: currentUser.clinicId });
    }

    const appointments = await query.getMany();
    return this.toCsv(appointments.map(toAppointmentResponse));
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

  /**
   * Créneaux encore réservables, pour le patient connecté (MEDIPLAN-21).
   *
   * Bornes volontaires :
   * - **la clinique du patient**, lue dans le jeton — jamais dans la requête ;
   * - **à venir uniquement** : proposer un créneau passé n'a aucun sens ;
   * - **horizon de 60 jours**, pour ne pas déverser tout l'agenda futur.
   *
   * Un patient sans clinique de rattachement obtient une liste vide plutôt
   * qu'une erreur : c'est un compte incomplet, pas une tentative illégitime.
   */
  async findOpenSlots(currentUser: AuthenticatedUser): Promise<OpenSlotResponse[]> {
    if (!currentUser.clinicId) {
      return [];
    }

    const horizon = new Date();
    horizon.setDate(horizon.getDate() + OPEN_SLOTS_HORIZON_DAYS);

    const slots = await this.dataSource
      .getRepository(AppointmentSlot)
      .createQueryBuilder('slot')
      .innerJoinAndSelect('slot.doctor', 'doctor')
      .where('slot.clinic_id = :clinicId', { clinicId: currentUser.clinicId })
      .andWhere('slot.is_booked = false')
      .andWhere('slot.start_at > now()')
      .andWhere('slot.start_at <= :horizon', { horizon })
      .orderBy('slot.start_at', 'ASC')
      .take(OPEN_SLOTS_MAX)
      .getMany();

    return slots.map((slot) => ({
      id: slot.id,
      doctorId: slot.doctorId,
      doctorName: formatDoctorName(slot.doctor),
      startAt: slot.startAt.toISOString(),
      endAt: slot.endAt.toISOString(),
    }));
  }

  /**
   * Réservation par le patient lui-même (MEDIPLAN-21).
   *
   * Même transaction, même verrou de ligne et même index unique partiel que la
   * réservation par la réception : la garantie anti-double-réservation ne
   * dépend pas du canal utilisé. Deux différences seulement :
   * - le patient est l'utilisateur du jeton, il ne peut réserver pour personne
   *   d'autre (le DTO n'expose aucun `patientId`) ;
   * - un créneau déjà commencé est refusé, alors que la réception peut encore
   *   enregistrer un patient qui se présente en retard.
   */
  async createBySelf(
    currentUser: AuthenticatedUser,
    dto: CreateSelfAppointmentDto,
  ): Promise<AppointmentResponse> {
    if (!currentUser.clinicId) {
      throw new ForbiddenException(
        "Votre compte n'est rattaché à aucune clinique. Contactez la réception.",
      );
    }

    return this.dataSource.transaction(async (manager) => {
      const slot = await manager.findOne(AppointmentSlot, {
        where: { id: dto.slotId },
        lock: { mode: 'pessimistic_write' },
      });

      // Anti-IDOR (MEDIPLAN-50) : un créneau d'une autre clinique est traité
      // comme inexistant. Un 403 confirmerait au demandeur qu'il existe.
      if (!slot || slot.clinicId !== currentUser.clinicId) {
        throw new NotFoundException('Créneau introuvable.');
      }
      if (slot.isBooked) {
        throw new ConflictException('Ce créneau est déjà réservé.');
      }
      if (slot.startAt.getTime() <= Date.now()) {
        throw new BadRequestException("Ce créneau n'est plus disponible.");
      }

      const appointment = manager.create(Appointment, {
        clinicId: slot.clinicId,
        slotId: slot.id,
        patientId: currentUser.id,
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

      const fullAppointment = await this.loadAppointmentWithRelations(manager, saved.id);
      await this.notificationsService.notifyAppointmentBooked({
        manager,
        appointment: fullAppointment ?? saved,
      });
      return toAppointmentResponse(fullAppointment ?? saved);
    });
  }

  /**
   * Rendez-vous du patient connecté, plus récents d'abord (MEDIPLAN-21).
   *
   * Le filtre porte sur `patient_id = jeton` : un patient ne peut voir que ses
   * propres rendez-vous, y compris ceux pris pour lui par la réception.
   */
  async findMine(currentUser: AuthenticatedUser): Promise<AppointmentResponse[]> {
    const appointments = await this.dataSource
      .getRepository(Appointment)
      .createQueryBuilder('appointment')
      .innerJoinAndSelect('appointment.slot', 'slot')
      .leftJoinAndSelect('appointment.patient', 'patient')
      .leftJoinAndSelect('appointment.doctor', 'doctor')
      .where('appointment.patient_id = :patientId', { patientId: currentUser.id })
      .orderBy('slot.start_at', 'DESC')
      .getMany();

    return appointments.map(toAppointmentResponse);
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

  private parseExportDate(value: string | undefined, field: 'from' | 'to'): string {
    if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      throw new BadRequestException(
        field === 'from'
          ? 'La date de debut est requise au format AAAA-MM-JJ.'
          : 'La date de fin est requise au format AAAA-MM-JJ.',
      );
    }

    return value;
  }

  private toCsv(appointments: AppointmentResponse[]): string {
    const headers = [
      'Date',
      'Heure debut',
      'Heure fin',
      'Patient',
      'Medecin',
      'Statut',
      'Motif',
      'Motif annulation',
      'Cree le',
    ];

    const rows = appointments.map((appointment) => [
      this.formatDate(appointment.startAt),
      this.formatTime(appointment.startAt),
      this.formatTime(appointment.endAt),
      appointment.patientName ?? '',
      appointment.doctorName ?? '',
      this.statusLabel(appointment.status),
      appointment.reason ?? '',
      appointment.cancellationReason ?? '',
      this.formatDateTime(appointment.createdAt),
    ]);

    return `\uFEFF${[headers, ...rows].map((row) => row.map((cell) => this.csvCell(cell)).join(',')).join('\r\n')}\r\n`;
  }

  private csvCell(value: string): string {
    return `"${value.replace(/"/g, '""')}"`;
  }

  private formatDate(value: Date | undefined): string {
    if (!value) {
      return '';
    }

    return new Intl.DateTimeFormat('fr-CA', {
      dateStyle: 'short',
      timeZone: 'America/Toronto',
    }).format(value);
  }

  private formatTime(value: Date | undefined): string {
    if (!value) {
      return '';
    }

    return new Intl.DateTimeFormat('fr-CA', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Toronto',
    }).format(value);
  }

  private formatDateTime(value: Date): string {
    return new Intl.DateTimeFormat('fr-CA', {
      dateStyle: 'short',
      timeStyle: 'short',
      timeZone: 'America/Toronto',
    }).format(value);
  }

  private statusLabel(status: AppointmentStatus): string {
    const labels: Record<AppointmentStatus, string> = {
      [AppointmentStatus.BOOKED]: 'Reserve',
      [AppointmentStatus.CANCELLED]: 'Annule',
      [AppointmentStatus.ARRIVED]: 'Arrive',
      [AppointmentStatus.IN_CONSULTATION]: 'En consultation',
      [AppointmentStatus.COMPLETED]: 'Termine',
      [AppointmentStatus.ABSENT]: 'Absent',
    };

    return labels[status];
  }
}

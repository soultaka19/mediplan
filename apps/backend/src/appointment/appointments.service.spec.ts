import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { AuthenticatedUser } from '../auth/auth.types';
import { NotificationsService } from '../notification/notifications.service';
import { User } from '../user/user.entity';
import { UserRole } from '../user/user-role.enum';
import { UsersService } from '../user/users.service';
import { AppointmentSlot } from './appointment-slot.entity';
import { AppointmentStatus } from './appointment-status.enum';
import { Appointment } from './appointment.entity';
import { AppointmentsService } from './appointments.service';

/**
 * Seule surcharge de `DataSource.transaction` utilisée par le service.
 *
 * `jest.Mocked<Pick<DataSource, 'transaction'>>` ne convient pas ici :
 * `transaction` cumule plusieurs surcharges, et la résolution retombe sur celle
 * dont le callback est typé `any`. Chaque `mockImplementationOnce` renvoyait
 * alors une valeur `any`. Nommer la signature réellement employée rend les
 * doublures typées de bout en bout.
 */
type TransactionRunner = (
  callback: (manager: EntityManager) => Promise<unknown>,
) => Promise<unknown>;

describe('AppointmentsService notifications', () => {
  let service: AppointmentsService;
  let dataSource: { transaction: jest.MockedFunction<TransactionRunner> };
  let usersService: jest.Mocked<Pick<UsersService, 'createLightPatientWith'>>;
  let notificationsService: jest.Mocked<
    Pick<
      NotificationsService,
      'notifyAppointmentBooked' | 'notifyAppointmentCancelled' | 'notifyAppointmentUpdated'
    >
  >;

  const currentUser = (overrides: Partial<AuthenticatedUser> = {}): AuthenticatedUser => ({
    id: 'admin-1',
    email: 'admin@example.com',
    role: UserRole.CLINIC_ADMIN,
    clinicId: 'clinic-1',
    ...overrides,
  });

  const slot = (overrides: Partial<AppointmentSlot> = {}): AppointmentSlot =>
    ({
      id: 'slot-1',
      clinicId: 'clinic-1',
      doctorId: 'doctor-1',
      startAt: new Date('2026-07-05T13:00:00Z'),
      endAt: new Date('2026-07-05T13:30:00Z'),
      isBooked: false,
      createdAt: new Date('2026-07-05T12:00:00Z'),
      updatedAt: new Date('2026-07-05T12:00:00Z'),
      ...overrides,
    }) as AppointmentSlot;

  const patient = (overrides: Partial<User> = {}): User =>
    ({
      id: 'patient-1',
      email: 'patient@example.com',
      firstName: 'Ada',
      lastName: 'Lovelace',
      role: UserRole.PATIENT,
      clinicId: 'clinic-1',
      isActive: true,
      ...overrides,
    }) as User;

  const appointment = (overrides: Partial<Appointment> = {}): Appointment =>
    ({
      id: 'appointment-1',
      clinicId: 'clinic-1',
      slotId: 'slot-1',
      patientId: 'patient-1',
      doctorId: 'doctor-1',
      createdById: 'admin-1',
      status: AppointmentStatus.BOOKED,
      reason: null,
      cancellationReason: null,
      createdAt: new Date('2026-07-05T12:00:00Z'),
      updatedAt: new Date('2026-07-05T12:00:00Z'),
      slot: slot(),
      patient: patient(),
      doctor: {
        id: 'doctor-1',
        email: 'doctor@example.com',
        firstName: 'Docteur',
        lastName: 'Test',
      },
      ...overrides,
    }) as Appointment;

  beforeEach(() => {
    dataSource = {
      transaction: jest.fn(async (callback: (manager: EntityManager) => Promise<unknown>) =>
        callback(createManager()),
      ),
    };
    usersService = {
      createLightPatientWith: jest.fn(),
    };
    notificationsService = {
      notifyAppointmentBooked: jest.fn(),
      notifyAppointmentCancelled: jest.fn(),
      notifyAppointmentUpdated: jest.fn(),
    };

    service = new AppointmentsService(
      dataSource as unknown as DataSource,
      usersService as unknown as UsersService,
      notificationsService as unknown as NotificationsService,
    );
  });

  function createManager(overrides: Partial<jest.Mocked<EntityManager>> = {}) {
    return {
      findOne: jest.fn(),
      save: jest.fn((_: unknown, entity: unknown) => Promise.resolve(entity)),
      create: jest.fn((_: unknown, entity: unknown) => entity),
      ...overrides,
    } as unknown as jest.Mocked<EntityManager>;
  }

  it('creation reception -> emet une notification booked', async () => {
    const appointmentSlot = slot();
    const existingPatient = patient();
    const savedAppointment = appointment({ slot: appointmentSlot, patient: existingPatient });
    const manager = createManager({
      findOne: jest
        .fn()
        .mockResolvedValueOnce(appointmentSlot)
        .mockResolvedValueOnce(existingPatient)
        .mockResolvedValueOnce(savedAppointment)
        .mockResolvedValueOnce(savedAppointment),
      save: jest.fn((target: unknown, entity: unknown) => {
        if (target === Appointment) {
          return Promise.resolve(savedAppointment);
        }
        return Promise.resolve(entity);
      }),
    });
    dataSource.transaction.mockImplementationOnce((callback) => callback(manager));

    await service.createByReception(currentUser(), {
      slotId: 'slot-1',
      patientId: 'patient-1',
      reason: 'Controle',
    });

    expect(notificationsService.notifyAppointmentBooked).toHaveBeenCalledWith({
      manager,
      appointment: savedAppointment,
    });
  });

  it('annulation -> emet une notification cancelled', async () => {
    const storedAppointment = appointment();
    const appointmentSlot = slot({ isBooked: true });
    const manager = createManager({
      findOne: jest
        .fn()
        .mockResolvedValueOnce(storedAppointment)
        .mockResolvedValueOnce(appointmentSlot)
        .mockResolvedValueOnce(storedAppointment)
        .mockResolvedValueOnce(storedAppointment),
    });
    dataSource.transaction.mockImplementationOnce((callback) => callback(manager));

    await service.cancel(currentUser(), 'appointment-1', { cancellationReason: 'Patient absent' });

    expect(storedAppointment.status).toBe(AppointmentStatus.CANCELLED);
    expect(appointmentSlot.isBooked).toBe(false);
    expect(notificationsService.notifyAppointmentCancelled).toHaveBeenCalledWith({
      manager,
      appointment: storedAppointment,
    });
  });

  it('changement de statut -> emet une notification updated', async () => {
    const storedAppointment = appointment();
    const manager = createManager({
      findOne: jest
        .fn()
        .mockResolvedValueOnce(storedAppointment)
        .mockResolvedValueOnce(storedAppointment)
        .mockResolvedValueOnce(storedAppointment),
    });
    dataSource.transaction.mockImplementationOnce((callback) => callback(manager));

    await service.updateStatus(
      currentUser({ role: UserRole.DOCTOR, id: 'doctor-1' }),
      'appointment-1',
      {
        status: AppointmentStatus.ARRIVED,
      },
    );

    expect(storedAppointment.status).toBe(AppointmentStatus.ARRIVED);
    expect(notificationsService.notifyAppointmentUpdated).toHaveBeenCalledWith({
      manager,
      appointment: storedAppointment,
    });
  });

  it('ne notifie pas si le rendez-vous est introuvable', async () => {
    const manager = createManager({ findOne: jest.fn().mockResolvedValueOnce(null) });
    dataSource.transaction.mockImplementationOnce((callback) => callback(manager));

    await expect(
      service.cancel(currentUser(), 'missing-appointment', { cancellationReason: 'Erreur' }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(notificationsService.notifyAppointmentCancelled).not.toHaveBeenCalled();
  });

  /**
   * Réservation par le patient lui-même (MEDIPLAN-21).
   *
   * Ces tests portent sur les garde-fous, pas sur l'anti-double-réservation :
   * celui-ci appartient à PostgreSQL (index unique partiel) et ne peut pas être
   * prouvé avec un `EntityManager` simulé — voir `docs/tests/plan-et-resultats.md`.
   */
  describe('createBySelf', () => {
    const patientUser = (overrides: Partial<AuthenticatedUser> = {}): AuthenticatedUser =>
      currentUser({
        id: 'patient-1',
        email: 'julie@example.com',
        role: UserRole.PATIENT,
        ...overrides,
      });

    /** Créneau libre situé dans le futur, quelle que soit la date d'exécution. */
    const futureSlot = (overrides: Partial<AppointmentSlot> = {}): AppointmentSlot =>
      slot({
        startAt: new Date(Date.now() + 86_400_000),
        endAt: new Date(Date.now() + 88_200_000),
        ...overrides,
      });

    it('réserve au nom du porteur du jeton et émet une notification', async () => {
      const bookable = futureSlot();
      const saved = appointment({ slot: bookable, createdById: 'patient-1' });
      const manager = createManager({
        findOne: jest.fn().mockResolvedValueOnce(bookable).mockResolvedValue(saved),
        save: jest.fn((target: unknown, entity: unknown) =>
          Promise.resolve(target === Appointment ? saved : entity),
        ),
      });
      dataSource.transaction.mockImplementationOnce((callback) => callback(manager));

      await service.createBySelf(patientUser(), { slotId: 'slot-1', reason: 'Maux de tête' });

      // Le patient réservé est celui du jeton — jamais une valeur du corps.
      const createCalls = (manager.create as jest.Mock).mock.calls as unknown[][];
      const created = createCalls[0][1] as Partial<Appointment>;
      expect(created.patientId).toBe('patient-1');
      expect(created.createdById).toBe('patient-1');
      expect(bookable.isBooked).toBe(true);
      expect(notificationsService.notifyAppointmentBooked).toHaveBeenCalled();
    });

    it("anti-IDOR : un créneau d'une autre clinique est traité comme inexistant", async () => {
      const manager = createManager({
        findOne: jest.fn().mockResolvedValueOnce(futureSlot({ clinicId: 'clinic-2' })),
      });
      dataSource.transaction.mockImplementationOnce((callback) => callback(manager));

      await expect(
        service.createBySelf(patientUser(), { slotId: 'slot-1' }),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(notificationsService.notifyAppointmentBooked).not.toHaveBeenCalled();
    });

    it('créneau déjà réservé -> 409', async () => {
      const manager = createManager({
        findOne: jest.fn().mockResolvedValueOnce(futureSlot({ isBooked: true })),
      });
      dataSource.transaction.mockImplementationOnce((callback) => callback(manager));

      await expect(
        service.createBySelf(patientUser(), { slotId: 'slot-1' }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('créneau déjà commencé -> 400 (le patient ne rattrape pas le passé)', async () => {
      const manager = createManager({
        findOne: jest.fn().mockResolvedValueOnce(
          slot({
            startAt: new Date(Date.now() - 3_600_000),
            endAt: new Date(Date.now() - 1_800_000),
          }),
        ),
      });
      dataSource.transaction.mockImplementationOnce((callback) => callback(manager));

      await expect(
        service.createBySelf(patientUser(), { slotId: 'slot-1' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('patient sans clinique -> 403, sans même ouvrir de transaction', async () => {
      await expect(
        service.createBySelf(patientUser({ clinicId: null }), { slotId: 'slot-1' }),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(dataSource.transaction).not.toHaveBeenCalled();
    });
  });
});

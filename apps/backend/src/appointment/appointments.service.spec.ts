import { NotFoundException } from '@nestjs/common';
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

describe('AppointmentsService notifications', () => {
  let service: AppointmentsService;
  let dataSource: jest.Mocked<Pick<DataSource, 'transaction'>>;
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
});

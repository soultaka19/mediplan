import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EntityManager, IsNull, Repository } from 'typeorm';
import { Appointment } from '../appointment/appointment.entity';
import { AppointmentStatus } from '../appointment/appointment-status.enum';
import { AuthenticatedUser } from '../auth/auth.types';
import { User } from '../user/user.entity';
import { UserRole } from '../user/user-role.enum';
import { NotificationType } from './notification-type.enum';
import { Notification } from './notification.entity';
import { NotificationsService } from './notifications.service';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let repository: jest.Mocked<Repository<Notification>>;

  const currentUser = (overrides: Partial<AuthenticatedUser> = {}): AuthenticatedUser => ({
    id: 'doctor-1',
    email: 'doctor@example.com',
    role: UserRole.DOCTOR,
    clinicId: 'clinic-1',
    ...overrides,
  });

  const notification = (overrides: Partial<Notification> = {}): Notification => ({
    id: 'notification-1',
    recipientId: 'doctor-1',
    recipient: null as unknown as User,
    clinicId: 'clinic-1',
    type: NotificationType.APPOINTMENT_BOOKED,
    title: 'Nouveau rendez-vous',
    message: 'Un rendez-vous a ete reserve.',
    actionUrl: '/clinic-flow/today',
    readAt: null,
    createdAt: new Date('2026-07-05T13:00:00Z'),
    ...overrides,
  });

  const appointment = (overrides: Partial<Appointment> = {}): Appointment =>
    ({
      id: 'appointment-1',
      clinicId: 'clinic-1',
      doctorId: 'doctor-1',
      patientId: 'patient-1',
      slotId: 'slot-1',
      createdById: 'admin-1',
      status: AppointmentStatus.BOOKED,
      reason: null,
      cancellationReason: null,
      createdAt: new Date('2026-07-05T12:00:00Z'),
      slot: {
        startAt: new Date('2026-07-05T13:00:00Z'),
        endAt: new Date('2026-07-05T13:30:00Z'),
      },
      patient: { firstName: 'Ada', lastName: 'Lovelace', email: 'ada@example.com' },
      doctor: { firstName: 'Docteur', lastName: 'Test', email: 'doctor@example.com' },
      ...overrides,
    }) as Appointment;

  beforeEach(async () => {
    const repositoryMock = {
      find: jest.fn(),
      count: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: getRepositoryToken(Notification), useValue: repositoryMock },
      ],
    }).compile();

    service = module.get(NotificationsService);
    repository = module.get(getRepositoryToken(Notification));
  });

  it('liste uniquement les notifications du destinataire courant', async () => {
    repository.find.mockResolvedValue([notification()]);

    const result = await service.listForUser(currentUser());

    expect(repository.find.mock.calls[0]).toEqual([
      {
        where: { recipientId: 'doctor-1' },
        order: { createdAt: 'DESC' },
        take: 30,
      },
    ]);
    expect(result).toEqual([
      {
        id: 'notification-1',
        type: NotificationType.APPOINTMENT_BOOKED,
        title: 'Nouveau rendez-vous',
        message: 'Un rendez-vous a ete reserve.',
        actionUrl: '/clinic-flow/today',
        readAt: null,
        createdAt: new Date('2026-07-05T13:00:00Z'),
      },
    ]);
  });

  it('compte seulement les notifications non lues du destinataire courant', async () => {
    repository.count.mockResolvedValue(2);

    const result = await service.unreadCount(currentUser());

    expect(repository.count.mock.calls[0]).toEqual([
      { where: { recipientId: 'doctor-1', readAt: IsNull() } },
    ]);
    expect(result).toBe(2);
  });

  it('marque comme lue uniquement une notification appartenant a l utilisateur courant', async () => {
    const stored = notification();
    repository.findOne.mockResolvedValue(stored);
    repository.save.mockImplementation((entity) => Promise.resolve(entity as Notification));

    const result = await service.markAsRead(currentUser(), 'notification-1');

    expect(repository.findOne.mock.calls[0]).toEqual([
      { where: { id: 'notification-1', recipientId: 'doctor-1' } },
    ]);
    expect(stored.readAt).toBeInstanceOf(Date);
    expect(result.readAt).toBe(stored.readAt);
  });

  it('refuse de marquer comme lue une notification hors perimetre', async () => {
    repository.findOne.mockResolvedValue(null);

    await expect(service.markAsRead(currentUser(), 'other-notification')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('emet une notification d annulation aux destinataires de la clinique et au super admin', async () => {
    const manager = {
      find: jest
        .fn()
        .mockResolvedValue([{ id: 'clinic-admin-1' }, { id: 'doctor-2' }, { id: 'super-admin-1' }]),
      create: jest.fn((_: unknown, entity: Partial<Notification>) => entity),
      save: jest.fn(),
    } as unknown as jest.Mocked<EntityManager>;

    await service.notifyAppointmentCancelled({
      manager,
      appointment: appointment({ cancellationReason: 'test notif' }),
    });

    expect(manager.find.mock.calls[0][0]).toBe(User);
    expect(manager.save.mock.calls[0][0]).toBe(Notification);
    expect(manager.save.mock.calls[0][1]).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          recipientId: 'doctor-1',
          clinicId: 'clinic-1',
          type: NotificationType.APPOINTMENT_CANCELLED,
          title: 'Rendez-vous annulé',
          message: expect.stringContaining('Motif : test notif.'),
        }),
        expect.objectContaining({ recipientId: 'clinic-admin-1' }),
        expect.objectContaining({ recipientId: 'doctor-2' }),
        expect.objectContaining({ recipientId: 'super-admin-1' }),
      ]),
    );
  });
});

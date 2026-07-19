import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppointmentSlot } from '../appointment/appointment-slot.entity';
import type { AuthenticatedUser } from '../auth/auth.types';
import { Clinic } from '../clinic/clinic.entity';
import { UserRole } from '../user/user-role.enum';
import { User } from '../user/user.entity';
import { AvailabilityType } from './availability-type.enum';
import { Availability } from './availability.entity';
import { AvailabilityService } from './availability.service';

describe('AvailabilityService', () => {
  let service: AvailabilityService;
  let availabilityRepo: jest.Mocked<Repository<Availability>>;
  let userRepo: jest.Mocked<Repository<User>>;
  let appointmentSlotRepo: jest.Mocked<Repository<AppointmentSlot>>;

  const doctorUser = (overrides: Partial<User> = {}): User => ({
    id: 'doctor-1',
    email: 'doctor@example.com',
    passwordHash: 'hash',
    firstName: 'Doc',
    lastName: 'Tor',
    role: UserRole.DOCTOR,
    clinicId: 'clinic-1',
    clinic: null,
    isSelfRegistered: true,
    isActive: true,
    failedLoginAttempts: 0,
    lockedUntil: null,
    passwordResetTokenHash: null,
    passwordResetExpiresAt: null,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    ...overrides,
  });

  const availability = (overrides: Partial<Availability> = {}): Availability => ({
    id: 'availability-1',
    doctorId: 'doctor-1',
    doctor: doctorUser(),
    clinicId: 'clinic-1',
    clinic: null as unknown as Clinic,
    startAt: new Date('2026-06-24T13:00:00Z'),
    endAt: new Date('2026-06-24T14:00:00Z'),
    slotDurationMin: 30,
    type: AvailabilityType.AVAILABLE,
    note: null,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    ...overrides,
  });

  const authUser = (overrides: Partial<AuthenticatedUser> = {}): AuthenticatedUser => ({
    id: 'doctor-1',
    role: UserRole.DOCTOR,
    clinicId: 'clinic-1',
    email: 'doctor@example.com',
    ...overrides,
  });

  const appointmentSlot = (overrides: Partial<AppointmentSlot> = {}): AppointmentSlot => ({
    id: 'slot-1',
    clinicId: 'clinic-1',
    clinic: null as unknown as Clinic,
    doctorId: 'doctor-1',
    doctor: doctorUser(),
    startAt: new Date('2026-06-24T13:00:00Z'),
    endAt: new Date('2026-06-24T13:30:00Z'),
    isBooked: false,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    ...overrides,
  });

  beforeEach(async () => {
    const availabilityRepoMock = {
      create: jest.fn((entity: Partial<Availability>) => entity as Availability),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      remove: jest.fn(),
    };
    const userRepoMock = {
      findOne: jest.fn(),
    };
    const appointmentSlotRepoMock = {
      create: jest.fn((entity: Partial<AppointmentSlot>) => entity as AppointmentSlot),
      save: jest.fn((entity: Partial<AppointmentSlot>) =>
        Promise.resolve(appointmentSlot(entity)),
      ),
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AvailabilityService,
        { provide: getRepositoryToken(Availability), useValue: availabilityRepoMock },
        { provide: getRepositoryToken(User), useValue: userRepoMock },
        { provide: getRepositoryToken(AppointmentSlot), useValue: appointmentSlotRepoMock },
      ],
    }).compile();

    service = module.get(AvailabilityService);
    availabilityRepo = module.get(getRepositoryToken(Availability));
    userRepo = module.get(getRepositoryToken(User));
    appointmentSlotRepo = module.get(getRepositoryToken(AppointmentSlot));
  });

  it('doctor -> cree une plage pour lui-meme et derive clinicId du medecin', async () => {
    userRepo.findOne.mockResolvedValue(doctorUser());
    availabilityRepo.save.mockImplementation((entity) =>
      Promise.resolve(availability(entity as Availability)),
    );

    const result = await service.create(authUser(), {
      startAt: '2026-06-24T13:00:00Z',
      endAt: '2026-06-24T14:00:00Z',
      slotDurationMin: 20,
    });

    expect(userRepo.findOne.mock.calls[0]).toEqual([{ where: { id: 'doctor-1' } }]);
    expect(availabilityRepo.create.mock.calls[0][0]).toMatchObject({
      doctorId: 'doctor-1',
      clinicId: 'clinic-1',
      slotDurationMin: 20,
      type: AvailabilityType.AVAILABLE,
    });
    expect(result.doctorId).toBe('doctor-1');
  });

  it('clinic_admin -> ne peut pas creer pour un medecin hors clinique', async () => {
    userRepo.findOne.mockResolvedValue(doctorUser({ id: 'doctor-2', clinicId: 'clinic-2' }));

    await expect(
      service.create(authUser({ id: 'admin-1', role: UserRole.CLINIC_ADMIN }), {
        doctorId: 'doctor-2',
        startAt: '2026-06-24T13:00:00Z',
        endAt: '2026-06-24T14:00:00Z',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejette une plage dont la fin precede le debut', async () => {
    userRepo.findOne.mockResolvedValue(doctorUser());

    await expect(
      service.create(authUser(), {
        startAt: '2026-06-24T14:00:00Z',
        endAt: '2026-06-24T13:00:00Z',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('findAllScoped doctor -> filtre sur son doctorId', async () => {
    availabilityRepo.find.mockResolvedValue([availability()]);

    await service.findAllScoped(authUser());

    expect(availabilityRepo.find.mock.calls[0]).toEqual([
      { where: { doctorId: 'doctor-1' }, order: { startAt: 'ASC' } },
    ]);
  });

  it('generateSlots -> decoupe une plage disponible et persiste les creneaux', async () => {
    availabilityRepo.findOne.mockResolvedValue(availability({ slotDurationMin: 30 }));
    appointmentSlotRepo.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce(null);
    appointmentSlotRepo.save
      .mockResolvedValueOnce(
        appointmentSlot({
          id: 'slot-1',
          startAt: new Date('2026-06-24T13:00:00Z'),
          endAt: new Date('2026-06-24T13:30:00Z'),
        }),
      )
      .mockResolvedValueOnce(
        appointmentSlot({
          id: 'slot-2',
          startAt: new Date('2026-06-24T13:30:00Z'),
          endAt: new Date('2026-06-24T14:00:00Z'),
        }),
      );

    const result = await service.generateSlots(authUser(), 'availability-1');

    expect(result).toEqual([
      {
        id: 'slot-1',
        startAt: '2026-06-24T13:00:00.000Z',
        endAt: '2026-06-24T13:30:00.000Z',
        isBooked: false,
      },
      {
        id: 'slot-2',
        startAt: '2026-06-24T13:30:00.000Z',
        endAt: '2026-06-24T14:00:00.000Z',
        isBooked: false,
      },
    ]);
  });
});

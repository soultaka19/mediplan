import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { AuthenticatedUser } from '../auth/auth.types';
import { Clinic } from '../clinic/clinic.entity';
import { UserRole } from '../user/user-role.enum';
import { User } from '../user/user.entity';
import { AppointmentSlot } from '../appointment/appointment-slot.entity';
import { AvailabilityType } from './availability-type.enum';
import { Availability } from './availability.entity';
import { AvailabilityService } from './availability.service';

describe('AvailabilityService', () => {
  let service: AvailabilityService;
  let availabilityRepo: jest.Mocked<Repository<Availability>>;
  let userRepo: jest.Mocked<Repository<User>>;

  const doctorUser = (overrides: Partial<User> = {}): User => ({
    id: 'doctor-1',
    email: 'doctor@example.com',
    passwordHash: 'hash',
    firstName: 'Doc',
    lastName: 'Tor',
    role: UserRole.DOCTOR,
    clinicId: 'clinic-1',
    clinic: null,
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
    const slotRepoMock = {
      find: jest.fn(),
      createQueryBuilder: jest.fn(() => ({
        insert: jest.fn().mockReturnThis(),
        values: jest.fn().mockReturnThis(),
        orIgnore: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue({}),
      })),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AvailabilityService,
        { provide: getRepositoryToken(Availability), useValue: availabilityRepoMock },
        { provide: getRepositoryToken(User), useValue: userRepoMock },
        { provide: getRepositoryToken(AppointmentSlot), useValue: slotRepoMock },
      ],
    }).compile();

    service = module.get(AvailabilityService);
    availabilityRepo = module.get(getRepositoryToken(Availability));
    userRepo = module.get(getRepositoryToken(User));
  });

  it('doctor -> crée une plage pour lui-même et dérive clinicId du médecin', async () => {
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

  it('clinic_admin -> ne peut pas créer pour un médecin hors clinique', async () => {
    userRepo.findOne.mockResolvedValue(doctorUser({ id: 'doctor-2', clinicId: 'clinic-2' }));

    await expect(
      service.create(authUser({ id: 'admin-1', role: UserRole.CLINIC_ADMIN }), {
        doctorId: 'doctor-2',
        startAt: '2026-06-24T13:00:00Z',
        endAt: '2026-06-24T14:00:00Z',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejette une plage dont la fin précède le début', async () => {
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

  it('generateSlots -> découpe une plage disponible selon slotDurationMin', async () => {
    availabilityRepo.findOne.mockResolvedValue(availability({ slotDurationMin: 30 }));

    const result = await service.generateSlots(authUser(), 'availability-1');

    expect(result).toEqual([
      {
        startAt: '2026-06-24T13:00:00.000Z',
        endAt: '2026-06-24T13:30:00.000Z',
      },
      {
        startAt: '2026-06-24T13:30:00.000Z',
        endAt: '2026-06-24T14:00:00.000Z',
      },
    ]);
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import type { AuthenticatedUser } from '../auth/auth.types';
import { UserRole } from '../user/user-role.enum';
import { AvailabilityController } from './availability.controller';
import { AvailabilityService } from './availability.service';
import { AvailabilityType } from './availability-type.enum';

describe('AvailabilityController', () => {
  let controller: AvailabilityController;
  let service: jest.Mocked<
    Pick<
      AvailabilityService,
      'create' | 'findAllScoped' | 'findOneScoped' | 'generateSlots' | 'update' | 'remove'
    >
  >;

  const currentUser: AuthenticatedUser = {
    id: 'doctor-1',
    role: UserRole.DOCTOR,
    clinicId: 'clinic-1',
    email: 'doctor@example.com',
  };

  beforeEach(async () => {
    service = {
      create: jest.fn(),
      findAllScoped: jest.fn(),
      findOneScoped: jest.fn(),
      generateSlots: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AvailabilityController],
      providers: [{ provide: AvailabilityService, useValue: service }],
    }).compile();

    controller = module.get(AvailabilityController);
  });

  it('POST /availabilities -> délègue la création au service', async () => {
    const dto = {
      startAt: '2026-06-24T13:00:00Z',
      endAt: '2026-06-24T14:00:00Z',
      type: AvailabilityType.AVAILABLE,
    };
    service.create.mockResolvedValue({ id: 'availability-1' } as never);

    const result = await controller.create(currentUser, dto);

    expect(service.create.mock.calls[0]).toEqual([currentUser, dto]);
    expect(result).toEqual({ id: 'availability-1' });
  });

  it('GET /availabilities -> délègue avec le scope utilisateur', async () => {
    service.findAllScoped.mockResolvedValue([] as never);

    await controller.findAll(currentUser);

    expect(service.findAllScoped.mock.calls[0]).toEqual([currentUser]);
  });

  it('GET /availabilities/:id/slots -> délègue la génération des créneaux', async () => {
    service.generateSlots.mockResolvedValue([] as never);

    await controller.generateSlots(currentUser, 'availability-1');

    expect(service.generateSlots.mock.calls[0]).toEqual([currentUser, 'availability-1']);
  });
});

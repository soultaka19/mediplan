import { Test, TestingModule } from '@nestjs/testing';
import { AuthenticatedUser } from '../auth/auth.types';
import { UserRole } from '../user/user-role.enum';
import { ClinicController } from './clinic.controller';
import { ClinicService } from './clinic.service';

describe('ClinicController', () => {
  let controller: ClinicController;
  let service: jest.Mocked<Pick<ClinicService, 'create' | 'findAll' | 'findOneScoped' | 'update'>>;

  const currentUser: AuthenticatedUser = {
    id: 'admin-1',
    role: UserRole.SUPER_ADMIN,
    clinicId: null,
    email: 'admin@example.com',
  };

  const response = {
    id: 'clinic-1',
    name: 'Clinique Centrale',
    address: null,
    openingHour: '08:00',
    closingHour: '17:00',
    isActive: true,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
  };

  beforeEach(async () => {
    service = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOneScoped: jest.fn(),
      update: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ClinicController],
      providers: [{ provide: ClinicService, useValue: service }],
    }).compile();

    controller = module.get(ClinicController);
  });

  it('POST /clinics delegue la creation au service', async () => {
    service.create.mockResolvedValue(response);

    const dto = { name: 'Clinique Centrale' };
    const result = await controller.create(dto);

    expect(service.create.mock.calls[0]).toEqual([dto]);
    expect(result).toBe(response);
  });

  it('GET /clinics delegue la liste au service', async () => {
    service.findAll.mockResolvedValue([response]);

    const result = await controller.findAll();

    expect(service.findAll).toHaveBeenCalled();
    expect(result).toEqual([response]);
  });

  it('GET /clinics/:id applique le scope utilisateur', async () => {
    service.findOneScoped.mockResolvedValue(response);

    const result = await controller.findOne(currentUser, 'clinic-1');

    expect(service.findOneScoped.mock.calls[0]).toEqual([currentUser, 'clinic-1']);
    expect(result).toBe(response);
  });

  it('PATCH /clinics/:id delegue la mise a jour au service', async () => {
    service.update.mockResolvedValue(response);

    const dto = { isActive: false };
    const result = await controller.update('clinic-1', dto);

    expect(service.update.mock.calls[0]).toEqual(['clinic-1', dto]);
    expect(result).toBe(response);
  });
});

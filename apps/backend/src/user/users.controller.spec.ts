import { Test, TestingModule } from '@nestjs/testing';
import { AuthenticatedUser } from '../auth/auth.types';
import { PublicUser } from '../auth/dto/auth-response.dto';
import { UserRole } from './user-role.enum';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

describe('UsersController', () => {
  let controller: UsersController;
  let service: jest.Mocked<
    Pick<
      UsersService,
      'findOneById' | 'findAllScoped' | 'createLightPatient' | 'activateLightPatient'
    >
  >;

  const currentUser: AuthenticatedUser = {
    id: 'user-1',
    role: UserRole.CLINIC_ADMIN,
    clinicId: 'clinic-1',
    email: 'admin@example.com',
  };

  const publicUser: PublicUser = {
    id: 'user-1',
    email: 'admin@example.com',
    firstName: 'Jane',
    lastName: 'Doe',
    role: UserRole.CLINIC_ADMIN,
    clinicId: 'clinic-1',
    isSelfRegistered: true,
    isActive: true,
    createdAt: new Date('2026-01-01T00:00:00Z'),
  };

  beforeEach(async () => {
    service = {
      findOneById: jest.fn(),
      findAllScoped: jest.fn(),
      createLightPatient: jest.fn(),
      activateLightPatient: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: service }],
    }).compile();

    controller = module.get(UsersController);
  });

  it('GET /me -> renvoie l utilisateur courant mappe par le service', async () => {
    service.findOneById.mockResolvedValue(publicUser);

    const result = await controller.getMe(currentUser);

    expect(service.findOneById.mock.calls[0]).toEqual(['user-1']);
    expect(result).toBe(publicUser);
  });

  it('GET /users -> delegue au service avec l utilisateur courant', async () => {
    service.findAllScoped.mockResolvedValue([publicUser]);

    const result = await controller.findAll(currentUser);

    expect(service.findAllScoped.mock.calls[0]).toEqual([currentUser]);
    expect(result).toEqual([publicUser]);
  });

  it('POST /users/light-patients -> delegue la creation au service', async () => {
    service.createLightPatient.mockResolvedValue(publicUser);
    const dto = { firstName: 'Awa', lastName: 'Traore' };

    const result = await controller.createLightPatient(currentUser, dto);

    expect(service.createLightPatient.mock.calls[0]).toEqual([currentUser, dto]);
    expect(result).toBe(publicUser);
  });

  it('POST /users/:id/activate-self-service -> delegue l activation au service', async () => {
    service.activateLightPatient.mockResolvedValue(publicUser);
    const dto = { email: 'patient@example.com', password: 'Mediplan2026!' };

    const result = await controller.activateLightPatient(currentUser, 'patient-1', dto);

    expect(service.activateLightPatient.mock.calls[0]).toEqual([currentUser, 'patient-1', dto]);
    expect(result).toBe(publicUser);
  });
});

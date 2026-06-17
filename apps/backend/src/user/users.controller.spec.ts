import { Test, TestingModule } from '@nestjs/testing';
import { AuthenticatedUser } from '../auth/auth.types';
import { PublicUser } from '../auth/dto/auth-response.dto';
import { UserRole } from './user-role.enum';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

/**
 * Tests unitaires (légers) du UsersController : le service est mocké, on vérifie
 * le câblage des handlers (récupération de l'utilisateur courant, délégation).
 */
describe('UsersController', () => {
  let controller: UsersController;
  let service: jest.Mocked<Pick<UsersService, 'findOneById' | 'findAllScoped'>>;

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
    isActive: true,
    createdAt: new Date('2026-01-01T00:00:00Z'),
  };

  beforeEach(async () => {
    service = {
      findOneById: jest.fn(),
      findAllScoped: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: service }],
    }).compile();

    controller = module.get(UsersController);
  });

  it('GET /me -> renvoie l’utilisateur courant mappé par le service', async () => {
    service.findOneById.mockResolvedValue(publicUser);

    const result = await controller.getMe(currentUser);

    expect(service.findOneById.mock.calls[0]).toEqual(['user-1']);
    expect(result).toBe(publicUser);
  });

  it('GET /users -> délègue au service avec l’utilisateur courant (scope)', async () => {
    service.findAllScoped.mockResolvedValue([publicUser]);

    const result = await controller.findAll(currentUser);

    expect(service.findAllScoped.mock.calls[0]).toEqual([currentUser]);
    expect(result).toEqual([publicUser]);
  });
});

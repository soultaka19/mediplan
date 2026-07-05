import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthenticatedUser } from '../auth/auth.types';
import { UserRole } from '../user/user-role.enum';
import { User } from '../user/user.entity';
import { Clinic } from './clinic.entity';
import { ClinicService } from './clinic.service';

describe('ClinicService', () => {
  let service: ClinicService;
  let repo: jest.Mocked<Repository<Clinic>>;

  const clinic = (overrides: Partial<Clinic> = {}): Clinic => ({
    id: 'clinic-1',
    name: 'Clinique Centrale',
    address: '10 rue Principale',
    openingHour: '08:00',
    closingHour: '17:00',
    isActive: true,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    users: [] as User[],
    ...overrides,
  });

  const authUser = (overrides: Partial<AuthenticatedUser> = {}): AuthenticatedUser => ({
    id: 'admin-1',
    role: UserRole.SUPER_ADMIN,
    clinicId: null,
    email: 'admin@example.com',
    ...overrides,
  });

  beforeEach(async () => {
    const repoMock: Partial<jest.Mocked<Repository<Clinic>>> = {
      create: jest.fn((entity: Partial<Clinic>) => entity as Clinic),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [ClinicService, { provide: getRepositoryToken(Clinic), useValue: repoMock }],
    }).compile();

    service = module.get(ClinicService);
    repo = module.get(getRepositoryToken(Clinic));
  });

  it('cree une clinique active par defaut', async () => {
    repo.save.mockImplementation(async (entity) => clinic(entity as Clinic));

    const result = await service.create({
      name: ' Clinique Centrale ',
      address: ' 10 rue Principale ',
      openingHour: '08:00',
      closingHour: '17:00',
    });

    expect(repo.create.mock.calls[0][0]).toMatchObject({
      name: 'Clinique Centrale',
      address: '10 rue Principale',
      openingHour: '08:00',
      closingHour: '17:00',
      isActive: true,
    });
    expect(result.name).toBe('Clinique Centrale');
  });

  it("rejette une fermeture avant l'ouverture", async () => {
    await expect(
      service.create({
        name: 'Clinique',
        openingHour: '17:00',
        closingHour: '08:00',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('liste toutes les cliniques par nom', async () => {
    repo.find.mockResolvedValue([clinic()]);

    const result = await service.findAll();

    expect(repo.find.mock.calls[0]).toEqual([{ order: { name: 'ASC' } }]);
    expect(result).toHaveLength(1);
  });

  it('clinic_admin ne peut lire que sa clinique', async () => {
    await expect(
      service.findOneScoped(
        authUser({ role: UserRole.CLINIC_ADMIN, clinicId: 'clinic-1' }),
        'clinic-2',
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(repo.findOne).not.toHaveBeenCalled();
  });

  it('met a jour une clinique existante', async () => {
    repo.findOne.mockResolvedValue(clinic());
    repo.save.mockImplementation(async (entity) => entity as Clinic);

    const result = await service.update('clinic-1', {
      address: '',
      openingHour: '09:00',
      closingHour: '18:00',
      isActive: false,
    });

    expect(result.address).toBeNull();
    expect(result.openingHour).toBe('09:00');
    expect(result.isActive).toBe(false);
  });
});

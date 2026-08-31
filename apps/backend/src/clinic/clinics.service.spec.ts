import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Clinic } from './clinic.entity';
import { ClinicsService } from './clinics.service';

describe('ClinicsService', () => {
  let service: ClinicsService;
  let repository: jest.Mocked<Repository<Clinic>>;

  const clinic = (): Clinic => ({
    id: 'clinic-1',
    name: 'Clinique du Plateau',
    address: '12 rue Principale',
    openingHour: '08:00:00',
    closingHour: '18:00:00',
    isActive: true,
    isDemo: false,
    expiresAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    users: [],
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClinicsService,
        {
          provide: getRepositoryToken(Clinic),
          useValue: { find: jest.fn() },
        },
      ],
    }).compile();

    service = module.get(ClinicsService);
    repository = module.get(getRepositoryToken(Clinic));
  });

  it("n'expose que l'identifiant, le nom et l'adresse", async () => {
    repository.find.mockResolvedValue([clinic()]);

    const resultat = await service.findAllPublic();

    expect(resultat).toEqual([
      { id: 'clinic-1', name: 'Clinique du Plateau', address: '12 rue Principale' },
    ]);
  });

  // L'annuaire est volontairement public : il alimente le sélecteur du
  // formulaire d'inscription. Y laisser les bacs à sable de démonstration
  // encombrerait ce sélecteur et révélerait à chaque visiteur l'existence des
  // espaces jetables des autres.
  it('exclut les cliniques de démonstration et les cliniques inactives', async () => {
    repository.find.mockResolvedValue([]);

    await service.findAllPublic();

    expect(repository.find).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { isActive: true, isDemo: false },
      }),
    );
  });
});

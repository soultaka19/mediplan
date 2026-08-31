import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Clinic } from './clinic.entity';

/** Clinique telle qu'exposée au public : strictement de quoi la choisir. */
export interface PublicClinicResponse {
  id: string;
  name: string;
  address: string | null;
}

@Injectable()
export class ClinicsService {
  constructor(
    @InjectRepository(Clinic)
    private readonly clinicRepository: Repository<Clinic>,
  ) {}

  /**
   * Annuaire public des cliniques actives (MEDIPLAN-21).
   *
   * Nécessaire à l'inscription libre-service : un patient doit pouvoir désigner
   * sa clinique AVANT d'avoir un compte, donc avant d'avoir un jeton. On
   * n'expose que le nom et l'adresse — aucune donnée d'exploitation (horaires
   * internes, effectifs, identifiants de praticiens).
   *
   * Les cliniques de démonstration sont exclues : ce sont des bacs à sable
   * jetables appartenant chacun à un visiteur. Les laisser ici encombrerait le
   * sélecteur d'inscription et révélerait à chaque visiteur l'existence des
   * espaces des autres.
   */
  async findAllPublic(): Promise<PublicClinicResponse[]> {
    const clinics = await this.clinicRepository.find({
      where: { isActive: true, isDemo: false },
      order: { name: 'ASC' },
      select: { id: true, name: true, address: true },
    });

    return clinics.map((clinic) => ({
      id: clinic.id,
      name: clinic.name,
      address: clinic.address,
    }));
  }

  /**
   * Vérifie qu'un identifiant de clinique désigne bien une clinique active.
   *
   * Utilisé par l'inscription : le `clinicId` vient du client, il ne peut donc
   * jamais être écrit tel quel sans être confronté à la base.
   */
  async existsActive(clinicId: string): Promise<boolean> {
    const count = await this.clinicRepository.count({
      where: { id: clinicId, isActive: true },
    });
    return count > 0;
  }
}

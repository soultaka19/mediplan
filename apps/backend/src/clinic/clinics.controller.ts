import { Controller, Get } from '@nestjs/common';
import { ClinicsService, PublicClinicResponse } from './clinics.service';

/**
 * Annuaire des cliniques.
 *
 * Route **volontairement publique** (aucun `JwtAuthGuard`) : elle alimente le
 * sélecteur de clinique du formulaire d'inscription, qui s'affiche par
 * définition à un visiteur non authentifié. Le contenu renvoyé est de la même
 * nature qu'une plaque à l'entrée d'un cabinet — nom et adresse.
 */
@Controller('clinics')
export class ClinicsController {
  constructor(private readonly clinicsService: ClinicsService) {}

  @Get()
  findAll(): Promise<PublicClinicResponse[]> {
    return this.clinicsService.findAllPublic();
  }
}

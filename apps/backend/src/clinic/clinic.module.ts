import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Clinic } from './clinic.entity';
import { ClinicsController } from './clinics.controller';
import { ClinicsService } from './clinics.service';

/**
 * Enregistre le repository Clinic et l'exporte pour les modules consommateurs
 * (gestion des cliniques, et indirectement l'auth qui valide `clinic_id`).
 *
 * `ClinicsService` est exporté car l'inscription libre-service s'en sert pour
 * valider la clinique choisie par le patient (MEDIPLAN-21).
 */
@Module({
  imports: [TypeOrmModule.forFeature([Clinic])],
  controllers: [ClinicsController],
  providers: [ClinicsService],
  exports: [TypeOrmModule, ClinicsService],
})
export class ClinicModule {}

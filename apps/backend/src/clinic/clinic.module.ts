import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Clinic } from './clinic.entity';

/**
 * Enregistre le repository Clinic et l'exporte pour les modules consommateurs
 * (gestion des cliniques, et indirectement l'auth qui valide `clinic_id`).
 */
@Module({
  imports: [TypeOrmModule.forFeature([Clinic])],
  exports: [TypeOrmModule],
})
export class ClinicModule {}

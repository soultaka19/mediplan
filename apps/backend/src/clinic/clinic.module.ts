import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClinicController } from './clinic.controller';
import { Clinic } from './clinic.entity';
import { ClinicService } from './clinic.service';

/**
 * Enregistre le repository Clinic et l'exporte pour les modules consommateurs
 * (gestion des cliniques, et indirectement l'auth qui valide `clinic_id`).
 */
@Module({
  imports: [TypeOrmModule.forFeature([Clinic])],
  controllers: [ClinicController],
  providers: [ClinicService],
  exports: [TypeOrmModule, ClinicService],
})
export class ClinicModule {}

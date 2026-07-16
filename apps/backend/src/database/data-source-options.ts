import { DataSourceOptions } from 'typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import { Appointment } from '../appointment/appointment.entity';
import { AppointmentSlot } from '../appointment/appointment-slot.entity';
import { Availability } from '../availability/availability.entity';
import { Clinic } from '../clinic/clinic.entity';
import { User } from '../user/user.entity';
import { InitAuthSchema1781674897611 } from './migrations/1781674897611-InitAuthSchema';
import { AddPasswordReset1781674897612 } from './migrations/1781674897612-AddPasswordReset';
import { AddSelfRegistrationFlag1781674897613 } from './migrations/1781674897613-AddSelfRegistrationFlag';
import { CreateAvailability1781674897614 } from './migrations/1781674897614-CreateAvailability';
import { AddAppointmentReceptionBooking1781674897615 } from './migrations/1781674897615-AddAppointmentReceptionBooking';
import { AddDoctorConsultationPreference1781674897616 } from './migrations/1781674897616-AddDoctorConsultationPreference';

/**
 * Construit les options TypeORM partagées entre :
 *  - le runtime NestJS (TypeOrmModule.forRootAsync, via ConfigService) ;
 *  - la CLI de migration (data-source.ts, via process.env).
 *
 * Un seul endroit décrit la connexion afin que runtime et CLI restent
 * strictement alignés (mêmes entités, migrations, stratégie de nommage).
 *
 * Entités et migrations sont référencées par CLASSES explicites (et non par
 * glob de répertoire) : c'est déterministe et compatible partout — ts-node
 * (CLI), dist après `nest build`, et surtout l'environnement jest (le
 * directory loader de TypeORM faisait des require dynamiques qui cassaient les
 * tests e2e). Toute nouvelle entité/migration doit être ajoutée ici.
 */
export interface DbEnv {
  DB_HOST?: string;
  DB_PORT?: string;
  DB_NAME?: string;
  DB_USER?: string;
  DB_PASSWORD?: string;
}

export function buildDataSourceOptions(env: DbEnv): DataSourceOptions {
  return {
    type: 'postgres',
    host: env.DB_HOST ?? 'localhost',
    port: Number(env.DB_PORT ?? 5432),
    database: env.DB_NAME ?? 'mediplan',
    username: env.DB_USER ?? 'mediplan_app',
    password: env.DB_PASSWORD ?? 'change_me',

    // Schéma piloté UNIQUEMENT par les migrations versionnées (décision Phase 2).
    synchronize: false,
    migrationsRun: false,
    // Les migrations ne s'exécutent que via la CLI explicite, jamais au boot.

    entities: [Clinic, User, Availability, AppointmentSlot, Appointment],
    migrations: [
      InitAuthSchema1781674897611,
      AddPasswordReset1781674897612,
      AddSelfRegistrationFlag1781674897613,
      CreateAvailability1781674897614,
      AddAppointmentReceptionBooking1781674897615,
      AddDoctorConsultationPreference1781674897616,
    ],

    namingStrategy: new SnakeNamingStrategy(),
    logging: ['error', 'warn', 'migration'],
  };
}

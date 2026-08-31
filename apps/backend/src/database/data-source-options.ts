import { DataSourceOptions } from 'typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import { Appointment } from '../appointment/appointment.entity';
import { AppointmentSlot } from '../appointment/appointment-slot.entity';
import { Availability } from '../availability/availability.entity';
import { Clinic } from '../clinic/clinic.entity';
import { Notification } from '../notification/notification.entity';
import { User } from '../user/user.entity';
import { InitAuthSchema1781674897611 } from './migrations/1781674897611-InitAuthSchema';
import { AddPasswordReset1781674897612 } from './migrations/1781674897612-AddPasswordReset';
import { AddSelfRegistrationFlag1781674897613 } from './migrations/1781674897613-AddSelfRegistrationFlag';
import { CreateAvailability1781674897614 } from './migrations/1781674897614-CreateAvailability';
import { AddAppointmentReceptionBooking1781674897615 } from './migrations/1781674897615-AddAppointmentReceptionBooking';
import { AddSlotUniqueDoctorStart1781674897616 } from './migrations/1781674897616-AddSlotUniqueDoctorStart';
import { CreateNotification1781674897617 } from './migrations/1781674897617-CreateNotification';
import { AddClinicDemoSandbox1781674897618 } from './migrations/1781674897618-AddClinicDemoSandbox';

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
  DATABASE_URL?: string;
  DB_HOST?: string;
  DB_PORT?: string;
  DB_NAME?: string;
  DB_USER?: string;
  DB_PASSWORD?: string;
  DB_SSL?: string;
  DB_SSL_REJECT_UNAUTHORIZED?: string;
}

/** Lit une variable d'environnement booléenne (« true » / « false »). */
function readBoolean(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined || value === '') {
    return fallback;
  }
  return value.trim().toLowerCase() === 'true';
}

/**
 * Configuration TLS de la connexion PostgreSQL.
 *
 * En local (Docker Compose), la base vit sur le réseau interne des conteneurs :
 * TLS est inutile, d'où le défaut désactivé qui préserve l'expérience de
 * développement existante.
 *
 * En hébergement infogéré (Neon, Azure Database for PostgreSQL), TLS est
 * OBLIGATOIRE : le serveur refuse toute connexion en clair. Poser `DB_SSL=true`
 * suffit — ces fournisseurs présentent un certificat signé par une autorité
 * publique, que Node valide avec son magasin de certificats racine.
 *
 * `DB_SSL_REJECT_UNAUTHORIZED=false` désactive cette vérification de chaîne.
 * Réservé aux certificats auto-signés : la connexion reste chiffrée, mais plus
 * rien ne garantit l'identité du serveur (exposition à une interception).
 */
function buildSslOptions(env: DbEnv): boolean | { rejectUnauthorized: boolean } {
  if (!readBoolean(env.DB_SSL, false)) {
    return false;
  }

  return { rejectUnauthorized: readBoolean(env.DB_SSL_REJECT_UNAUTHORIZED, true) };
}

/**
 * Coordonnées de la base.
 *
 * Deux formes équivalentes, au choix de l'environnement :
 *  - `DATABASE_URL` : chaîne de connexion unique, format universel des
 *    hébergeurs infogérés (Neon, Railway, Heroku…). Prioritaire quand elle est
 *    présente, car c'est ce que le fournisseur donne à copier tel quel — la
 *    découper en cinq variables dans un script shell casse dès qu'un mot de
 *    passe contient un caractère encodé.
 *  - Variables séparées : forme historique du projet, utilisée en local.
 */
function buildConnection(env: DbEnv) {
  if (env.DATABASE_URL) {
    return { url: env.DATABASE_URL };
  }

  return {
    host: env.DB_HOST ?? 'localhost',
    port: Number(env.DB_PORT ?? 5432),
    database: env.DB_NAME ?? 'mediplan',
    username: env.DB_USER ?? 'mediplan_app',
    password: env.DB_PASSWORD ?? 'change_me',
  };
}

export function buildDataSourceOptions(env: DbEnv): DataSourceOptions {
  return {
    type: 'postgres',
    ...buildConnection(env),
    ssl: buildSslOptions(env),

    // Schéma piloté UNIQUEMENT par les migrations versionnées (décision Phase 2).
    synchronize: false,
    migrationsRun: false,
    // Les migrations ne s'exécutent que via la CLI explicite, jamais au boot.

    entities: [Clinic, User, Availability, AppointmentSlot, Appointment, Notification],
    migrations: [
      InitAuthSchema1781674897611,
      AddPasswordReset1781674897612,
      AddSelfRegistrationFlag1781674897613,
      CreateAvailability1781674897614,
      AddAppointmentReceptionBooking1781674897615,
      AddSlotUniqueDoctorStart1781674897616,
      CreateNotification1781674897617,
      AddClinicDemoSandbox1781674897618,
    ],

    namingStrategy: new SnakeNamingStrategy(),
    logging: ['error', 'warn', 'migration'],
  };
}

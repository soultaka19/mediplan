import 'reflect-metadata';

import * as bcrypt from 'bcrypt';
import { config as loadEnv } from 'dotenv';
import { join } from 'path';
import { DataSource, EntityManager } from 'typeorm';

import { Appointment } from '../../appointment/appointment.entity';
import { AppointmentSlot } from '../../appointment/appointment-slot.entity';
import { AppointmentStatus } from '../../appointment/appointment-status.enum';
import { Availability } from '../../availability/availability.entity';
import { AvailabilityType } from '../../availability/availability-type.enum';
import { Clinic } from '../../clinic/clinic.entity';
import { User } from '../../user/user.entity';
import { UserRole } from '../../user/user-role.enum';
import { buildDataSourceOptions } from '../data-source-options';

/**
 * Jeu de données de démonstration (clinique, comptes, disponibilités, RDV).
 *
 * Objectif : rendre l'application démontrable sur une base neuve, sans création
 * manuelle de comptes. Prérequis de la revue de sprint et de l'audit visuel.
 *
 * Usage : `pnpm --filter backend seed:demo`
 * (les migrations doivent avoir été jouées : `pnpm --filter backend migration:run`)
 *
 * Idempotent : les identifiants sont fixes et chaque entité est réinsérée par
 * `upsert`. Rejouer le script remet le jeu de démo dans un état connu sans
 * dupliquer ni casser les clés étrangères.
 *
 * ⚠ Données de démonstration uniquement — mots de passe publics, jamais en
 * production. Le script refuse de s'exécuter si NODE_ENV vaut 'production'.
 */

loadEnv({ path: join(__dirname, '..', '..', '..', '..', '..', '.env') });

/** Fuseau de référence du projet : « aujourd'hui » se lit à Toronto. */
const TIMEZONE_OFFSET_NOTE = 'America/Toronto';

/** Coût bcrypt : identique à AuthService (DEFAULT_BCRYPT_ROUNDS). */
const BCRYPT_ROUNDS = 12;

/**
 * Identifiants fixes : rejouer le seed vise les mêmes lignes.
 *
 * UUID v4 valides (chiffre de version `4` et variant `8` en place) : la
 * validation `@IsUUID()` des DTO les accepte, contrairement aux anciens
 * identifiants « répétés » (variant invalide) qui faisaient échouer la création
 * de disponibilités pour un médecin du seed.
 */
const IDS = {
  clinic: '11111111-1111-4111-8111-111111111111',
  admin: '22222222-2222-4222-8222-222222222222',
  doctorHopper: '33333333-3333-4333-8333-333333333333',
  doctorTuring: '44444444-4444-4444-8444-444444444444',
  patientLovelace: '55555555-5555-4555-8555-555555555555',
  patientBabbage: '66666666-6666-4666-8666-666666666666',
  availabilityHopper: '77777777-7777-4777-8777-777777777777',
  availabilityTuring: '88888888-8888-4888-8888-888888888888',
} as const;

/** Comptes de démonstration. Mots de passe volontairement publics. */
export const DEMO_ACCOUNTS = [
  {
    email: 'admin.demo@mediplan.test',
    password: 'Adm1n!Secret',
    role: 'Réception / admin de clinique',
  },
  { email: 'doctor.demo@mediplan.test', password: 'Doct0r!Secret', role: 'Médecin (Grace Hopper)' },
  { email: 'doctor2.demo@mediplan.test', password: 'Doct0r!Secret', role: 'Médecin (Alan Turing)' },
] as const;

/**
 * Début de journée ouvrée, exprimé en heure locale du serveur.
 * Le seed vise une démo lisible (« RDV aujourd'hui » non vide), pas une
 * reconstitution exacte du fuseau : les créneaux sont posés relativement à
 * aujourd'hui, ce qui suffit aux écrans et aux KPI.
 */
function todayAt(hour: number, minute = 0): Date {
  const date = new Date();
  date.setHours(hour, minute, 0, 0);
  return date;
}

/** Même heure, décalée de `days` jours. */
function dayAt(days: number, hour: number, minute = 0): Date {
  const date = todayAt(hour, minute);
  date.setDate(date.getDate() + days);
  return date;
}

/**
 * Découpe une plage en créneaux consécutifs de `durationMin` minutes.
 * Réplique la règle de génération des disponibilités (MEDIPLAN-20) : le seed
 * doit rester autonome, il ne passe pas par le service NestJS.
 */
function buildSlots(start: Date, end: Date, durationMin: number): { startAt: Date; endAt: Date }[] {
  const slots: { startAt: Date; endAt: Date }[] = [];
  let cursor = new Date(start);

  while (cursor < end) {
    const slotEnd = new Date(cursor.getTime() + durationMin * 60_000);
    if (slotEnd > end) {
      break;
    }
    slots.push({ startAt: new Date(cursor), endAt: slotEnd });
    cursor = slotEnd;
  }

  return slots;
}

/** E-mails du jeu de démo, purgés avant réinsertion. */
const DEMO_EMAILS = [
  'admin.demo@mediplan.test',
  'doctor.demo@mediplan.test',
  'doctor2.demo@mediplan.test',
  'patient.demo@mediplan.test',
];

/**
 * Purge le jeu de démo précédent.
 *
 * Nécessaire car le seed impose des identifiants fixes alors que d'anciens
 * comptes ont pu être créés à la main avec des identifiants aléatoires : un
 * simple `upsert` par `id` violerait alors l'unicité de l'e-mail.
 *
 * L'ordre suit les clés étrangères (`RESTRICT`) : rendez-vous → créneaux →
 * disponibilités → utilisateurs. Ne touche que la clinique de démonstration et
 * les comptes de démonstration.
 */
async function cleanDemoData(manager: EntityManager): Promise<void> {
  await manager.delete(Appointment, { clinicId: IDS.clinic });
  await manager.delete(AppointmentSlot, { clinicId: IDS.clinic });
  await manager.delete(Availability, { clinicId: IDS.clinic });

  // Patients légers de la clinique (sans e-mail) : visés par leur clinique.
  await manager
    .createQueryBuilder()
    .delete()
    .from(User)
    .where('clinic_id = :clinic AND role = :role', { clinic: IDS.clinic, role: UserRole.PATIENT })
    .execute();

  await manager
    .createQueryBuilder()
    .delete()
    .from(User)
    .where('email IN (:...emails)', { emails: DEMO_EMAILS })
    .execute();
}

/** Crée (ou remet à jour) la clinique de démonstration. */
async function seedClinic(manager: EntityManager): Promise<void> {
  await manager.upsert(
    Clinic,
    {
      id: IDS.clinic,
      name: 'Clinique MediPlan — Ottawa',
      address: '123 rue Rideau, Ottawa (Ontario)',
      openingHour: '08:00',
      closingHour: '18:00',
      isActive: true,
    },
    ['id'],
  );
}

/** Crée les comptes : réception, deux médecins, deux patients légers. */
async function seedUsers(manager: EntityManager): Promise<void> {
  const adminHash = await bcrypt.hash('Adm1n!Secret', BCRYPT_ROUNDS);
  const doctorHash = await bcrypt.hash('Doct0r!Secret', BCRYPT_ROUNDS);

  await manager.upsert(
    User,
    [
      {
        id: IDS.admin,
        email: 'admin.demo@mediplan.test',
        passwordHash: adminHash,
        firstName: 'Alice',
        lastName: 'Tremblay',
        role: UserRole.CLINIC_ADMIN,
        clinicId: IDS.clinic,
        isActive: true,
        isSelfRegistered: false,
      },
      {
        id: IDS.doctorHopper,
        email: 'doctor.demo@mediplan.test',
        passwordHash: doctorHash,
        firstName: 'Grace',
        lastName: 'Hopper',
        role: UserRole.DOCTOR,
        clinicId: IDS.clinic,
        isActive: true,
        isSelfRegistered: false,
      },
      {
        id: IDS.doctorTuring,
        email: 'doctor2.demo@mediplan.test',
        passwordHash: doctorHash,
        firstName: 'Alan',
        lastName: 'Turing',
        role: UserRole.DOCTOR,
        clinicId: IDS.clinic,
        isActive: true,
        isSelfRegistered: false,
      },
    ],
    ['id'],
  );

  // Patients légers : créés au comptoir, sans compte. `passwordHash` NULL est
  // le garde-fou métier (MEDIPLAN-50) — ils ne doivent jamais s'authentifier.
  await manager.upsert(
    User,
    [
      {
        id: IDS.patientLovelace,
        email: null,
        passwordHash: null,
        firstName: 'Ada',
        lastName: 'Lovelace',
        role: UserRole.PATIENT,
        clinicId: IDS.clinic,
        isActive: true,
        isSelfRegistered: false,
      },
      {
        id: IDS.patientBabbage,
        email: null,
        passwordHash: null,
        firstName: 'Charles',
        lastName: 'Babbage',
        role: UserRole.PATIENT,
        clinicId: IDS.clinic,
        isActive: true,
        isSelfRegistered: false,
      },
    ],
    ['id'],
  );
}

/** Disponibilités du jour : Hopper le matin, Turing l'après-midi. */
async function seedAvailabilities(manager: EntityManager): Promise<void> {
  await manager.upsert(
    Availability,
    [
      {
        id: IDS.availabilityHopper,
        doctorId: IDS.doctorHopper,
        clinicId: IDS.clinic,
        startAt: todayAt(9),
        endAt: todayAt(12),
        slotDurationMin: 30,
        type: AvailabilityType.AVAILABLE,
        note: 'Consultations du matin',
      },
      {
        id: IDS.availabilityTuring,
        doctorId: IDS.doctorTuring,
        clinicId: IDS.clinic,
        startAt: dayAt(1, 13),
        endAt: dayAt(1, 16),
        slotDurationMin: 30,
        type: AvailabilityType.AVAILABLE,
        note: "Consultations de l'après-midi (demain)",
      },
    ],
    ['id'],
  );
}

/**
 * Créneaux + deux rendez-vous du jour.
 *
 * Les identifiants des créneaux sont générés (et non fixes) : la purge de
 * `cleanDemoData` garantit qu'un second passage ne les duplique pas.
 */
async function seedSlotsAndAppointments(manager: EntityManager): Promise<void> {
  const matin = buildSlots(todayAt(9), todayAt(12), 30).map((slot) => ({
    ...slot,
    clinicId: IDS.clinic,
    doctorId: IDS.doctorHopper,
    isBooked: false,
  }));
  const demain = buildSlots(dayAt(1, 13), dayAt(1, 16), 30).map((slot) => ({
    ...slot,
    clinicId: IDS.clinic,
    doctorId: IDS.doctorTuring,
    isBooked: false,
  }));

  const slots = await manager.save(AppointmentSlot, [...matin, ...demain]);

  // Deux créneaux du matin réservés : le tableau de bord et le flux du jour ont
  // ainsi de quoi s'afficher dès la première ouverture.
  const [premier, deuxieme] = slots;

  await manager.save(Appointment, [
    {
      clinicId: IDS.clinic,
      slotId: premier.id,
      patientId: IDS.patientLovelace,
      doctorId: IDS.doctorHopper,
      createdById: IDS.admin,
      status: AppointmentStatus.BOOKED,
      reason: 'Suivi annuel',
    },
    {
      clinicId: IDS.clinic,
      slotId: deuxieme.id,
      patientId: IDS.patientBabbage,
      doctorId: IDS.doctorHopper,
      createdById: IDS.admin,
      status: AppointmentStatus.BOOKED,
      reason: 'Douleur au genou',
    },
  ]);

  // `isBooked` n'est qu'un cache d'affichage : la source de vérité reste
  // l'index unique partiel sur `appointment`.
  await manager.update(AppointmentSlot, [premier.id, deuxieme.id], { isBooked: true });
}

async function run(): Promise<void> {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Le seed de démonstration ne doit jamais être exécuté en production.');
  }

  const dataSource = new DataSource(buildDataSourceOptions(process.env));
  await dataSource.initialize();

  try {
    await dataSource.transaction(async (manager) => {
      await cleanDemoData(manager);
      await seedClinic(manager);
      await seedUsers(manager);
      await seedAvailabilities(manager);
      await seedSlotsAndAppointments(manager);
    });

    const slots = await dataSource.getRepository(AppointmentSlot).count();
    const appointments = await dataSource.getRepository(Appointment).count();

    console.log('\nJeu de démonstration en place.');
    console.log(`  Clinique      : Clinique MediPlan — Ottawa (${TIMEZONE_OFFSET_NOTE})`);
    console.log(`  Créneaux      : ${slots}`);
    console.log(`  Rendez-vous   : ${appointments}`);
    console.log('\n  Comptes (mots de passe de démonstration) :');
    for (const account of DEMO_ACCOUNTS) {
      console.log(`    ${account.email.padEnd(28)} ${account.password.padEnd(15)} ${account.role}`);
    }
    console.log(
      '\n  Patients légers : Ada Lovelace, Charles Babbage (sans compte, non connectables).\n',
    );
  } finally {
    await dataSource.destroy();
  }
}

run().catch((error: unknown) => {
  console.error('Échec du seed :', error);
  process.exitCode = 1;
});

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
 * Objectif : rendre l'application démontrable sur une base neuve, avec des
 * données réalistes et « vivantes » — plusieurs médecins et patients, un
 * planning du jour rempli et des rendez-vous à statuts variés (terminé, en
 * consultation, arrivé, réservé, absent, annulé) pour que le tableau de bord et
 * le flux clinique aient de la matière dès la première ouverture, tout en
 * laissant des créneaux libres pour démontrer la prise de rendez-vous.
 *
 * Usage : `pnpm --filter backend seed:demo`
 * (les migrations doivent avoir été jouées : `pnpm --filter backend migration:run`)
 *
 * Idempotent : les identifiants sont fixes et la purge (`cleanDemoData`) précède
 * chaque réinsertion. Rejouer le script remet le jeu de démo dans un état connu
 * sans dupliquer ni casser les clés étrangères.
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
 * Fabrique d'UUID v4 valides et lisibles (chiffre de version `4` et variant `8`
 * en place) : la validation `@IsUUID()` des DTO les accepte. Le préfixe distingue
 * les familles d'entités ; `n` numérote la ligne (1 → « ...000000000001 »).
 */
function uuid(prefix: string, n: number): string {
  const tail = n.toString(16).padStart(12, '0');
  return `${prefix}-0000-4000-8000-${tail}`;
}

/**
 * Identifiants fixes des entités de référence (clinique, comptes, disponibilités).
 * Les créneaux et rendez-vous ont des identifiants générés : la purge garantit
 * qu'un second passage ne les duplique pas.
 */
const IDS = {
  clinic: '11111111-1111-4111-8111-111111111111',
  admin: '22222222-2222-4222-8222-222222222222',
  doctorBergeron: '33333333-3333-4333-8333-333333333333',
  doctorLefebvre: '44444444-4444-4444-8444-444444444444',
} as const;

/** Comptes connectables. Mots de passe volontairement publics (démo). */
export const DEMO_ACCOUNTS = [
  {
    email: 'admin.demo@mediplan.test',
    password: 'Adm1n!Secret',
    role: 'Réception / admin de clinique (Alice Tremblay)',
  },
  {
    email: 'doctor.demo@mediplan.test',
    password: 'Doct0r!Secret',
    role: 'Médecin — Dre Sophie Bergeron',
  },
  {
    email: 'doctor2.demo@mediplan.test',
    password: 'Doct0r!Secret',
    role: 'Médecin — Dr Marc Lefebvre',
  },
] as const;

/**
 * Patients de la clinique (patients légers : `passwordHash` NULL, non
 * connectables — garde-fou métier MEDIPLAN-50). Quelques-uns ont une adresse
 * e-mail de contact, comme au comptoir. Noms volontairement réalistes.
 */
const DEMO_PATIENTS = [
  { id: uuid('55555555', 1), firstName: 'Émilie', lastName: 'Gagnon', email: 'emilie.gagnon@example.com' },
  { id: uuid('55555555', 2), firstName: 'Nathan', lastName: 'Roy', email: null },
  { id: uuid('55555555', 3), firstName: 'Léa', lastName: 'Bouchard', email: null },
  { id: uuid('55555555', 4), firstName: 'Olivier', lastName: 'Côté', email: 'olivier.cote@example.com' },
  { id: uuid('55555555', 5), firstName: 'Fatima', lastName: 'Benali', email: null },
  { id: uuid('55555555', 6), firstName: 'Chloé', lastName: 'Dubois', email: null },
  { id: uuid('55555555', 7), firstName: 'Hugo', lastName: 'Martin', email: null },
  { id: uuid('55555555', 8), firstName: 'Liam', lastName: "O'Connor", email: null },
  { id: uuid('55555555', 9), firstName: 'Sophie', lastName: 'Nadeau', email: 'sophie.nadeau@example.com' },
  { id: uuid('55555555', 10), firstName: 'William', lastName: 'Gagné', email: null },
] as const;

/** Identifiants des disponibilités du jeu de démo. */
const AVAIL = {
  bergeronMatin: uuid('66666666', 1),
  bergeronApresMidi: uuid('66666666', 2),
  bergeronDemain: uuid('66666666', 3),
  lefebvreMatin: uuid('66666666', 4),
  lefebvreConge: uuid('66666666', 5),
  lefebvreDemain: uuid('66666666', 6),
} as const;

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
 * Configuration d'une disponibilité de démo. Sert à la fois à créer la
 * disponibilité et (pour le type `available`) à matérialiser ses créneaux, afin
 * de garder une source unique et cohérente.
 */
interface AvailabilityConfig {
  id: string;
  doctorId: string;
  start: Date;
  end: Date;
  slotDurationMin: number;
  type: AvailabilityType;
  note: string;
}

/** Planning de démonstration : deux médecins, aujourd'hui et demain. */
const AVAILABILITIES: readonly AvailabilityConfig[] = [
  {
    id: AVAIL.bergeronMatin,
    doctorId: IDS.doctorBergeron,
    start: todayAt(9),
    end: todayAt(12),
    slotDurationMin: 30,
    type: AvailabilityType.AVAILABLE,
    note: 'Consultations du matin',
  },
  {
    id: AVAIL.bergeronApresMidi,
    doctorId: IDS.doctorBergeron,
    start: todayAt(13, 30),
    end: todayAt(16, 30),
    slotDurationMin: 30,
    type: AvailabilityType.AVAILABLE,
    note: "Consultations de l'après-midi",
  },
  {
    id: AVAIL.bergeronDemain,
    doctorId: IDS.doctorBergeron,
    start: dayAt(1, 9),
    end: dayAt(1, 12),
    slotDurationMin: 30,
    type: AvailabilityType.AVAILABLE,
    note: 'Consultations du matin (demain)',
  },
  {
    id: AVAIL.lefebvreMatin,
    doctorId: IDS.doctorLefebvre,
    start: todayAt(8, 30),
    end: todayAt(11, 30),
    slotDurationMin: 30,
    type: AvailabilityType.AVAILABLE,
    note: 'Consultations du matin',
  },
  {
    id: AVAIL.lefebvreConge,
    doctorId: IDS.doctorLefebvre,
    start: todayAt(13),
    end: todayAt(18),
    slotDurationMin: 30,
    type: AvailabilityType.TIME_OFF,
    note: "Congé — après-midi",
  },
  {
    id: AVAIL.lefebvreDemain,
    doctorId: IDS.doctorLefebvre,
    start: dayAt(1, 13),
    end: dayAt(1, 16),
    slotDurationMin: 30,
    type: AvailabilityType.AVAILABLE,
    note: "Consultations de l'après-midi (demain)",
  },
];

/**
 * Rendez-vous du jour, désignés par la disponibilité et l'index du créneau.
 * Statuts variés pour animer le flux clinique et les KPI. Les créneaux non
 * référencés restent libres (utiles pour démontrer la réservation en direct).
 */
interface AppointmentPlan {
  availabilityId: string;
  slotIndex: number;
  patientId: string;
  status: AppointmentStatus;
  reason: string;
  cancellationReason?: string;
}

const TODAY_APPOINTMENTS: readonly AppointmentPlan[] = [
  // Dre Bergeron — matin (6 créneaux : 09:00 → 11:30)
  {
    availabilityId: AVAIL.bergeronMatin,
    slotIndex: 0,
    patientId: DEMO_PATIENTS[0].id,
    status: AppointmentStatus.COMPLETED,
    reason: "Renouvellement d'ordonnance",
  },
  {
    availabilityId: AVAIL.bergeronMatin,
    slotIndex: 1,
    patientId: DEMO_PATIENTS[1].id,
    status: AppointmentStatus.COMPLETED,
    reason: 'Résultats de prise de sang',
  },
  {
    availabilityId: AVAIL.bergeronMatin,
    slotIndex: 2,
    patientId: DEMO_PATIENTS[2].id,
    status: AppointmentStatus.IN_CONSULTATION,
    reason: 'Douleurs abdominales',
  },
  {
    availabilityId: AVAIL.bergeronMatin,
    slotIndex: 3,
    patientId: DEMO_PATIENTS[3].id,
    status: AppointmentStatus.ARRIVED,
    reason: 'Vaccination antigrippale',
  },
  {
    availabilityId: AVAIL.bergeronMatin,
    slotIndex: 4,
    patientId: DEMO_PATIENTS[4].id,
    status: AppointmentStatus.BOOKED,
    reason: 'Suivi de tension artérielle',
  },
  // (créneau 11:30 laissé libre)

  // Dre Bergeron — après-midi (6 créneaux : 13:30 → 16:00)
  {
    availabilityId: AVAIL.bergeronApresMidi,
    slotIndex: 0,
    patientId: DEMO_PATIENTS[5].id,
    status: AppointmentStatus.BOOKED,
    reason: 'Consultation dermatologie',
  },
  {
    availabilityId: AVAIL.bergeronApresMidi,
    slotIndex: 1,
    patientId: DEMO_PATIENTS[6].id,
    status: AppointmentStatus.ABSENT,
    reason: 'Bilan de santé annuel',
  },
  {
    availabilityId: AVAIL.bergeronApresMidi,
    slotIndex: 2,
    patientId: DEMO_PATIENTS[7].id,
    status: AppointmentStatus.CANCELLED,
    reason: 'Maux de tête persistants',
    cancellationReason: "Annulé par le patient — conflit d'horaire.",
  },
  // (créneaux 15:00 → 16:00 laissés libres)

  // Dr Lefebvre — matin (6 créneaux : 08:30 → 11:00)
  {
    availabilityId: AVAIL.lefebvreMatin,
    slotIndex: 0,
    patientId: DEMO_PATIENTS[8].id,
    status: AppointmentStatus.COMPLETED,
    reason: 'Certificat médical',
  },
  {
    availabilityId: AVAIL.lefebvreMatin,
    slotIndex: 1,
    patientId: DEMO_PATIENTS[9].id,
    status: AppointmentStatus.BOOKED,
    reason: 'Entorse à la cheville',
  },
  // (créneaux 09:30 → 11:00 laissés libres)
];

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

/** E-mails des comptes connectables, purgés avant réinsertion. */
const DEMO_EMAILS = [
  'admin.demo@mediplan.test',
  'doctor.demo@mediplan.test',
  'doctor2.demo@mediplan.test',
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

  // Patients (légers) de la clinique : visés par leur clinique + rôle, quels
  // que soient leurs identifiants ou e-mails d'origine.
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

/** Crée les comptes : réception, deux médecins, et les patients légers. */
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
        id: IDS.doctorBergeron,
        email: 'doctor.demo@mediplan.test',
        passwordHash: doctorHash,
        firstName: 'Sophie',
        lastName: 'Bergeron',
        role: UserRole.DOCTOR,
        clinicId: IDS.clinic,
        isActive: true,
        isSelfRegistered: false,
      },
      {
        id: IDS.doctorLefebvre,
        email: 'doctor2.demo@mediplan.test',
        passwordHash: doctorHash,
        firstName: 'Marc',
        lastName: 'Lefebvre',
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
    DEMO_PATIENTS.map((patient) => ({
      id: patient.id,
      email: patient.email,
      passwordHash: null,
      firstName: patient.firstName,
      lastName: patient.lastName,
      role: UserRole.PATIENT,
      clinicId: IDS.clinic,
      isActive: true,
      isSelfRegistered: false,
    })),
    ['id'],
  );
}

/** Crée toutes les disponibilités du planning de démonstration. */
async function seedAvailabilities(manager: EntityManager): Promise<void> {
  await manager.upsert(
    Availability,
    AVAILABILITIES.map((config) => ({
      id: config.id,
      doctorId: config.doctorId,
      clinicId: IDS.clinic,
      startAt: config.start,
      endAt: config.end,
      slotDurationMin: config.slotDurationMin,
      type: config.type,
      note: config.note,
    })),
    ['id'],
  );
}

/**
 * Matérialise les créneaux des disponibilités « available » puis pose les
 * rendez-vous du jour aux statuts variés.
 *
 * Les identifiants des créneaux sont générés (et non fixes) : la purge de
 * `cleanDemoData` garantit qu'un second passage ne les duplique pas. Un index
 * (disponibilité → créneaux ordonnés) permet de désigner les rendez-vous par
 * position, en cohérence avec le planning déclaré plus haut.
 */
async function seedSlotsAndAppointments(manager: EntityManager): Promise<void> {
  const slotsByAvailability = new Map<string, AppointmentSlot[]>();

  for (const config of AVAILABILITIES) {
    if (config.type !== AvailabilityType.AVAILABLE) {
      continue; // un congé n'ouvre aucun créneau réservable
    }

    const rows = buildSlots(config.start, config.end, config.slotDurationMin).map((slot) => ({
      ...slot,
      clinicId: IDS.clinic,
      doctorId: config.doctorId,
      isBooked: false,
    }));

    const saved = await manager.save(AppointmentSlot, rows);
    slotsByAvailability.set(config.id, saved);
  }

  const bookedSlotIds: string[] = [];

  for (const plan of TODAY_APPOINTMENTS) {
    const slots = slotsByAvailability.get(plan.availabilityId);
    const slot = slots?.[plan.slotIndex];
    if (!slot) {
      throw new Error(
        `Créneau introuvable pour la disponibilité ${plan.availabilityId} (index ${plan.slotIndex}).`,
      );
    }

    await manager.save(Appointment, {
      clinicId: IDS.clinic,
      slotId: slot.id,
      patientId: plan.patientId,
      doctorId: slot.doctorId,
      createdById: IDS.admin,
      status: plan.status,
      reason: plan.reason,
      cancellationReason: plan.cancellationReason ?? null,
    });

    // `isBooked` n'est qu'un cache d'affichage : la source de vérité reste
    // l'index unique partiel sur `appointment`. Un rendez-vous annulé libère
    // son créneau (il redevient réservable), les autres l'occupent.
    if (plan.status !== AppointmentStatus.CANCELLED) {
      bookedSlotIds.push(slot.id);
    }
  }

  if (bookedSlotIds.length > 0) {
    await manager.update(AppointmentSlot, bookedSlotIds, { isBooked: true });
  }
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
    const patients = DEMO_PATIENTS.length;

    console.log('\nJeu de démonstration en place.');
    console.log(`  Clinique      : Clinique MediPlan — Ottawa (${TIMEZONE_OFFSET_NOTE})`);
    console.log(`  Médecins      : Dre Sophie Bergeron, Dr Marc Lefebvre`);
    console.log(`  Patients      : ${patients}`);
    console.log(`  Créneaux      : ${slots}`);
    console.log(`  Rendez-vous   : ${appointments} (statuts variés, du jour)`);
    console.log('\n  Comptes (mots de passe de démonstration) :');
    for (const account of DEMO_ACCOUNTS) {
      console.log(`    ${account.email.padEnd(28)} ${account.password.padEnd(15)} ${account.role}`);
    }
    console.log(
      '\n  Patients légers (sans compte, non connectables) : ' +
        DEMO_PATIENTS.map((p) => `${p.firstName} ${p.lastName}`).join(', ') +
        '.\n',
    );
  } finally {
    await dataSource.destroy();
  }
}

run().catch((error: unknown) => {
  console.error('Échec du seed :', error);
  process.exitCode = 1;
});

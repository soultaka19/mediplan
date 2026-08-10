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
 * ⚠ Données de démonstration uniquement — mots de passe publics, jamais sur des
 * données réelles. Le script refuse de s'exécuter si NODE_ENV vaut 'production',
 * sauf autorisation explicite par ALLOW_DEMO_SEED=true (environnement vitrine).
 */

loadEnv({ path: join(__dirname, '..', '..', '..', '..', '..', '.env') });

/** Autorisation explicite de semer malgré NODE_ENV=production (voir `run`). */
const ALLOW_DEMO_SEED = process.env.ALLOW_DEMO_SEED?.trim().toLowerCase() === 'true';

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
  // Patients supplémentaires : alimentent l'historique et le planning à venir,
  // pour que la liste des patients et la recherche au comptoir soient crédibles.
  { id: uuid('55555555', 11), firstName: 'Amélie', lastName: 'Lévesque', email: 'amelie.levesque@example.com' },
  { id: uuid('55555555', 12), firstName: 'Jacob', lastName: 'Fortin', email: null },
  { id: uuid('55555555', 13), firstName: 'Noémie', lastName: 'Pelletier', email: null },
  { id: uuid('55555555', 14), firstName: 'Antoine', lastName: 'Girard', email: 'antoine.girard@example.com' },
  { id: uuid('55555555', 15), firstName: 'Yasmine', lastName: 'Haddad', email: null },
  { id: uuid('55555555', 16), firstName: 'Thomas', lastName: 'Beaulieu', email: null },
  { id: uuid('55555555', 17), firstName: 'Camille', lastName: 'Ouellet', email: 'camille.ouellet@example.com' },
  { id: uuid('55555555', 18), firstName: 'Raphaël', lastName: 'Mercier', email: null },
  { id: uuid('55555555', 19), firstName: 'Jade', lastName: 'Boucher', email: null },
  { id: uuid('55555555', 20), firstName: 'Samuel', lastName: 'Desjardins', email: 'samuel.desjardins@example.com' },
  { id: uuid('55555555', 21), firstName: 'Maya', lastName: 'Sirois', email: null },
  { id: uuid('55555555', 22), firstName: 'Étienne', lastName: 'Lapointe', email: null },
  { id: uuid('55555555', 23), firstName: 'Priya', lastName: 'Sharma', email: 'priya.sharma@example.com' },
  { id: uuid('55555555', 24), firstName: 'Gabriel', lastName: 'Morin', email: null },
] as const;

/**
 * Motifs de consultation courants en clinique de première ligne. Piochés de
 * façon déterministe pour l'historique et le planning à venir, afin que les
 * écrans ne répètent pas trois fois le même libellé.
 */
const CONSULTATION_REASONS = [
  'Suivi de tension artérielle',
  "Renouvellement d'ordonnance",
  'Résultats de prise de sang',
  'Vaccination antigrippale',
  'Douleurs lombaires',
  'Consultation dermatologie',
  'Bilan de santé annuel',
  'Suivi de diabète',
  'Infection respiratoire',
  'Certificat médical',
  'Migraine récurrente',
  'Suivi post-opératoire',
  'Douleurs articulaires',
  'Otite — enfant',
  'Suivi de grossesse',
  'Consultation de santé mentale',
  'Entorse à la cheville',
  'Renouvellement de contraception',
] as const;

/** Motifs d'annulation observés au comptoir. */
const CANCELLATION_REASONS = [
  "Annulé par le patient — conflit d'horaire.",
  'Annulé par le patient — symptômes résolus.',
  'Annulé par la clinique — médecin indisponible.',
  'Annulé par le patient — reporté à une date ultérieure.',
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

/** Lecture d'un instant dans le fuseau de la clinique. */
const CLINIC_PARTS = new Intl.DateTimeFormat('en-CA', {
  timeZone: TIMEZONE_OFFSET_NOTE,
  hour12: false,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
});

/** Décalage du fuseau de la clinique, en minutes, à un instant donné. */
function clinicOffsetMinutes(at: Date): number {
  const parts: Record<string, string> = {};
  for (const part of CLINIC_PARTS.formatToParts(at)) {
    if (part.type !== 'literal') {
      parts[part.type] = part.value;
    }
  }
  const asUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour) % 24,
    Number(parts.minute),
    Number(parts.second),
  );
  return (asUtc - at.getTime()) / 60_000;
}

/** Date civile (année, mois, jour) telle qu'elle se lit à la clinique. */
function clinicDateParts(at: Date): { year: number; month: number; day: number } {
  const parts: Record<string, string> = {};
  for (const part of CLINIC_PARTS.formatToParts(at)) {
    if (part.type !== 'literal') {
      parts[part.type] = part.value;
    }
  }
  return { year: Number(parts.year), month: Number(parts.month), day: Number(parts.day) };
}

/**
 * Instant correspondant à une heure **murale de la clinique**.
 *
 * `setHours()` travaille dans le fuseau du serveur. Sur nos postes, réglés à
 * l'heure de l'Est, le résultat était juste — c'est pourquoi le défaut est passé
 * inaperçu. Dans le conteneur, qui tourne en UTC, une journée déclarée de 9 h à
 * 12 h s'affichait de 5 h à 8 h : à l'écran, la clinique ouvrait à 4 h 30 du
 * matin. Le seed vise donc explicitement le fuseau de la clinique.
 */
function clinicTime(year: number, month: number, day: number, hour: number, minute: number): Date {
  // On interprète d'abord l'heure murale comme si elle était en UTC, puis on
  // retranche le décalage réel du fuseau à cet instant. Deux passes suffisent à
  // converger, y compris autour des changements d'heure.
  const naive = Date.UTC(year, month - 1, day, hour, minute, 0, 0);
  let instant = new Date(naive);
  for (let pass = 0; pass < 2; pass++) {
    instant = new Date(naive - clinicOffsetMinutes(instant) * 60_000);
  }
  return instant;
}

/** Heure du jour, à la clinique. */
function todayAt(hour: number, minute = 0): Date {
  const today = clinicDateParts(new Date());
  return clinicTime(today.year, today.month, today.day, hour, minute);
}

/**
 * Même heure, décalée de `days` jours **de calendrier**.
 *
 * On décale la date civile, pas l'instant : un jour ne fait pas toujours 24 h
 * (changement d'heure), et c'est bien « le lendemain à 9 h » que l'on veut.
 */
function dayAt(days: number, hour: number, minute = 0): Date {
  const today = clinicDateParts(new Date());
  const shifted = new Date(Date.UTC(today.year, today.month - 1, today.day + days));
  return clinicTime(
    shifted.getUTCFullYear(),
    shifted.getUTCMonth() + 1,
    shifted.getUTCDate(),
    hour,
    minute,
  );
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
 * Rendez-vous de demain. Volontairement clairsemés : demain est la journée
 * utilisée pour démontrer la prise de rendez-vous en direct, il doit donc
 * rester des créneaux libres évidents — tout en évitant une journée vide au
 * milieu d'un planning par ailleurs rempli.
 */
const TOMORROW_APPOINTMENTS: readonly AppointmentPlan[] = [
  // Dre Bergeron — matin (6 créneaux : 09:00 → 11:30)
  {
    availabilityId: AVAIL.bergeronDemain,
    slotIndex: 0,
    patientId: DEMO_PATIENTS[10].id,
    status: AppointmentStatus.BOOKED,
    reason: 'Suivi de diabète',
  },
  {
    availabilityId: AVAIL.bergeronDemain,
    slotIndex: 2,
    patientId: DEMO_PATIENTS[13].id,
    status: AppointmentStatus.BOOKED,
    reason: 'Douleurs lombaires',
  },
  {
    availabilityId: AVAIL.bergeronDemain,
    slotIndex: 5,
    patientId: DEMO_PATIENTS[16].id,
    status: AppointmentStatus.BOOKED,
    reason: "Renouvellement d'ordonnance",
  },
  // Dr Lefebvre — après-midi (6 créneaux : 13:00 → 15:30)
  {
    availabilityId: AVAIL.lefebvreDemain,
    slotIndex: 1,
    patientId: DEMO_PATIENTS[19].id,
    status: AppointmentStatus.BOOKED,
    reason: 'Bilan de santé annuel',
  },
  {
    availabilityId: AVAIL.lefebvreDemain,
    slotIndex: 3,
    patientId: DEMO_PATIENTS[22].id,
    status: AppointmentStatus.BOOKED,
    reason: 'Consultation dermatologie',
  },
];

/**
 * Générateur pseudo-aléatoire déterministe (mulberry32), amorcé par une graine
 * fixe. Le jeu de démonstration doit être *varié* sans être *aléatoire* : deux
 * exécutions produisent le même planning, ce qui rend la démo reproductible et
 * les captures d'écran stables.
 */
function createRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Profondeur de l'historique et du planning à venir, en jours calendaires. */
const HISTORY_DAYS = 14;
const UPCOMING_DAYS = 7;

/**
 * Jours ouvrés seulement : la clinique est fermée le samedi et le dimanche.
 * Le jour de la semaine se lit dans le fuseau de la clinique, pas dans celui du
 * serveur — sans quoi un conteneur en UTC pourrait basculer de journée.
 */
function isWorkingDay(date: Date): boolean {
  const { year, month, day } = clinicDateParts(date);
  const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  return weekday >= 1 && weekday <= 5;
}

/**
 * Plage type de chaque médecin sur les journées générées. Aujourd'hui et demain
 * gardent leur planning déclaré à la main (flux du jour soigné) ; les autres
 * journées suivent ce gabarit.
 *
 * Les deux médecins tiennent matin **et** après-midi : une journée générée
 * compte donc 4 plages et 24 créneaux. Une journée de clinique à moitié vide se
 * remarque tout de suite, et l'écran de statistiques a besoin d'un dénominateur
 * crédible pour que le taux d'occupation veuille dire quelque chose.
 */
const DOCTOR_SHIFTS = [
  {
    doctorId: IDS.doctorBergeron,
    startHour: 9,
    startMinute: 0,
    endHour: 12,
    endMinute: 0,
    note: 'Consultations du matin',
  },
  {
    doctorId: IDS.doctorBergeron,
    startHour: 13,
    startMinute: 30,
    endHour: 16,
    endMinute: 30,
    note: "Consultations de l'après-midi",
  },
  {
    doctorId: IDS.doctorLefebvre,
    startHour: 8,
    startMinute: 30,
    endHour: 11,
    endMinute: 30,
    note: 'Consultations du matin',
  },
  {
    doctorId: IDS.doctorLefebvre,
    startHour: 13,
    startMinute: 0,
    endHour: 16,
    endMinute: 0,
    note: "Consultations de l'après-midi",
  },
] as const;

/**
 * Choisit `count` index de créneaux distincts parmi `total`.
 *
 * Le nombre de rendez-vous d'une plage est **choisi**, pas tiré créneau par
 * créneau : c'est ce qui garantit qu'il reste toujours des créneaux libres à
 * réserver pendant une démonstration. Un tirage indépendant par créneau peut
 * remplir une plage entière et bloquer la démo.
 */
function pickSlots(count: number, total: number, random: () => number): number[] {
  const indices = Array.from({ length: total }, (_, index) => index);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  return indices.slice(0, Math.min(count, total)).sort((a, b) => a - b);
}

/**
 * Tire un patient qui n'a pas déjà un rendez-vous dans la journée. Voir deux
 * fois le même nom dans un planning d'une journée trahit immédiatement des
 * données fabriquées.
 */
function pickPatient(random: () => number, seenToday: Set<string>) {
  for (let attempt = 0; attempt < 8; attempt++) {
    const candidate = DEMO_PATIENTS[Math.floor(random() * DEMO_PATIENTS.length)];
    if (!seenToday.has(candidate.id)) {
      seenToday.add(candidate.id);
      return candidate;
    }
  }
  return DEMO_PATIENTS[Math.floor(random() * DEMO_PATIENTS.length)];
}

/**
 * Construit l'historique (J-14 → J-1) et le planning à venir (J+2 → J+7).
 *
 * Objectif de démonstration : que l'historique des rendez-vous, les filtres par
 * statut et la navigation par date aient de la matière, sans toucher au flux
 * du jour déjà réglé. Les journées passées sont majoritairement `completed`
 * (avec quelques absences et annulations, comme en clinique réelle) ; les
 * journées à venir sont `booked` et volontairement incomplètes, pour qu'il
 * reste des créneaux libres à réserver pendant la présentation.
 *
 * **La fenêtre à venir couvre une semaine entière.** C'est délibéré : le seed
 * fige ses dates au moment où il s'exécute, et le job qui le déclenche est
 * manuel. Un lancement le lundi laisse donc une clinique utilisable jusqu'au
 * lundi suivant, sans dépendre d'une commande à ne pas oublier le matin d'une
 * démonstration. Chaque journée de cette fenêtre est traitée comme une vraie
 * journée de clinique : quatre plages, des créneaux libres, quelques
 * annulations et une demi-journée de congé.
 */
function buildExtendedSchedule(): {
  availabilities: AvailabilityConfig[];
  appointments: AppointmentPlan[];
} {
  const random = createRandom(20260729);
  const availabilities: AvailabilityConfig[] = [];
  const appointments: AppointmentPlan[] = [];
  let sequence = 100; // au-delà des identifiants fixes d'AVAIL

  // Journées ouvrées à venir effectivement générées (J+2 → J+7, week-ends
  // exclus). Le congé est placé sur la **dernière** : une démonstration a lieu
  // dans les jours qui suivent le lancement du seed, et amputer l'après-midi de
  // ce jour-là priverait la démo de la moitié de son planning.
  const futureWorkingOffsets: number[] = [];
  for (let offset = 2; offset <= UPCOMING_DAYS; offset++) {
    if (isWorkingDay(dayAt(offset, 12))) {
      futureWorkingOffsets.push(offset);
    }
  }
  const dayOffOffset = futureWorkingOffsets.at(-1);

  for (let offset = -HISTORY_DAYS; offset <= UPCOMING_DAYS; offset++) {
    // 0 et 1 sont déjà couverts par le planning déclaré à la main.
    if (offset === 0 || offset === 1) {
      continue;
    }

    const reference = dayAt(offset, 12);
    if (!isWorkingDay(reference)) {
      continue;
    }

    const isPast = offset < 0;

    // Une demi-journée de congé sur la fenêtre à venir. Le planning d'une vraie
    // clinique n'est jamais uniforme, et cela donne de la matière au type de
    // plage « congé », qui ne génère aucun créneau réservable.
    const dayOff = !isPast && offset === dayOffOffset;
    const seenToday = new Set<string>();

    for (const shift of DOCTOR_SHIFTS) {
      const availabilityId = uuid('66666666', sequence++);
      const isTimeOff = dayOff && shift.doctorId === IDS.doctorLefebvre && shift.startHour >= 12;

      availabilities.push({
        id: availabilityId,
        doctorId: shift.doctorId,
        start: dayAt(offset, shift.startHour, shift.startMinute),
        end: dayAt(offset, shift.endHour, shift.endMinute),
        slotDurationMin: 30,
        type: isTimeOff ? AvailabilityType.TIME_OFF : AvailabilityType.AVAILABLE,
        note: isTimeOff ? 'Congé — après-midi' : shift.note,
      });

      if (isTimeOff) {
        continue; // un congé ne matérialise aucun créneau
      }

      // 6 créneaux par plage de 3 h. Le passé est bien rempli (une journée de
      // clinique se remplit), le futur volontairement à moitié — il doit rester
      // des créneaux libres évidents à réserver devant la salle.
      const slotCount = 6;
      const bookedCount = isPast ? 4 + Math.floor(random() * 2) : 2 + Math.floor(random() * 2);

      for (const slotIndex of pickSlots(bookedCount, slotCount, random)) {
        const patient = pickPatient(random, seenToday);
        const reason = CONSULTATION_REASONS[Math.floor(random() * CONSULTATION_REASONS.length)];

        let status = AppointmentStatus.BOOKED;
        let cancellationReason: string | undefined;

        if (isPast) {
          const draw = random();
          if (draw < 0.08) {
            status = AppointmentStatus.CANCELLED;
            cancellationReason =
              CANCELLATION_REASONS[Math.floor(random() * CANCELLATION_REASONS.length)];
          } else if (draw < 0.16) {
            status = AppointmentStatus.ABSENT;
          } else {
            status = AppointmentStatus.COMPLETED;
          }
        } else if (random() < 0.12) {
          // Quelques annulations à venir : le créneau redevient libre (le seed
          // ne le marque pas réservé) et le filtre « Annulé » de l'historique a
          // de la matière sans qu'il faille annuler soi-même.
          status = AppointmentStatus.CANCELLED;
          cancellationReason =
            CANCELLATION_REASONS[Math.floor(random() * CANCELLATION_REASONS.length)];
        }

        appointments.push({
          availabilityId,
          slotIndex,
          patientId: patient.id,
          status,
          reason,
          cancellationReason,
        });
      }
    }
  }

  return { availabilities, appointments };
}

const EXTENDED_SCHEDULE = buildExtendedSchedule();

/** Planning complet : journées déclarées à la main + journées générées. */
const ALL_AVAILABILITIES: readonly AvailabilityConfig[] = [
  ...AVAILABILITIES,
  ...EXTENDED_SCHEDULE.availabilities,
];

/** Rendez-vous complets : flux du jour soigné + historique et jours à venir. */
const ALL_APPOINTMENTS: readonly AppointmentPlan[] = [
  ...TODAY_APPOINTMENTS,
  ...TOMORROW_APPOINTMENTS,
  ...EXTENDED_SCHEDULE.appointments,
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
    ALL_AVAILABILITIES.map((config) => ({
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

  for (const config of ALL_AVAILABILITIES) {
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

  for (const plan of ALL_APPOINTMENTS) {
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
  // Garde-fou : en `NODE_ENV=production`, le seed est refusé par défaut.
  //
  // L'environnement déployé de ce projet est une VITRINE DE DÉMONSTRATION, pas
  // une clinique réelle : il doit contenir le jeu de démo, et son image tourne
  // avec NODE_ENV=production. Le garde-fou reste donc en place mais devient
  // franchissable par un geste explicite et séparé (`ALLOW_DEMO_SEED=true`),
  // qu'on ne pose jamais par accident — plutôt que d'être simplement retiré.
  if (process.env.NODE_ENV === 'production' && !ALLOW_DEMO_SEED) {
    throw new Error(
      'Le seed de démonstration est bloqué en production. ' +
        "Poser ALLOW_DEMO_SEED=true pour l'autoriser explicitement — " +
        'à ne faire que sur un environnement de démonstration, jamais sur des données réelles.',
    );
  }

  if (ALLOW_DEMO_SEED) {
    console.warn(
      '\n⚠  ALLOW_DEMO_SEED=true : insertion de comptes à mots de passe publics.\n' +
        '   Les données existantes de la clinique de démonstration seront purgées.\n',
    );
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
    console.log(
      `  Rendez-vous   : ${appointments} — historique sur ${HISTORY_DAYS} j, flux du jour, ` +
        `planning jusqu'à J+${UPCOMING_DAYS} (jours ouvrés)`,
    );
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

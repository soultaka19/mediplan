import { randomBytes, randomUUID } from 'node:crypto';
import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, EntityManager, In, LessThan } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { AuthService } from '../auth/auth.service';
import { Appointment } from '../appointment/appointment.entity';
import { AppointmentSlot } from '../appointment/appointment-slot.entity';
import { AppointmentStatus } from '../appointment/appointment-status.enum';
import { Availability } from '../availability/availability.entity';
import { AvailabilityType } from '../availability/availability-type.enum';
import { Clinic } from '../clinic/clinic.entity';
import { Notification } from '../notification/notification.entity';
import { User } from '../user/user.entity';
import { UserRole } from '../user/user-role.enum';
import { DemoSession } from './demo.types';

/**
 * Bacs à sable jetables pour les visiteurs du portfolio.
 *
 * Chaque visiteur reçoit sa propre clinique. MediPlan cloisonne par
 * `clinic_id`, mais — contrairement à TechMaint — le cloisonnement est
 * EXPLICITE dans chaque requête, pas garanti par un filtre global. C'est
 * pourquoi l'isolation est vérifiée par test de bout en bout, et pourquoi
 * aucun compte de démonstration n'est `super_admin` : ce rôle n'a pas de
 * `clinic_id` et court-circuite le cloisonnement.
 */
@Injectable()
export class DemoService {
  private readonly logger = new Logger(DemoService.name);

  private readonly lifetimeMs: number;
  private readonly maxLiveSandboxes: number;
  /** bcrypt à 12 tours coûte ~250 ms : on hache UNE fois pour les 8 comptes. */
  private readonly bcryptRounds: number;

  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly authService: AuthService,
    configService: ConfigService,
  ) {
    this.lifetimeMs = Number(configService.get('DEMO_LIFETIME_MINUTES') ?? 60) * 60_000;
    this.maxLiveSandboxes = Number(configService.get('DEMO_MAX_LIVE_SANDBOXES') ?? 50);
    const rounds = Number(configService.get('BCRYPT_ROUNDS'));
    this.bcryptRounds = Number.isInteger(rounds) && rounds >= 4 && rounds <= 15 ? rounds : 12;
  }

  async createSandbox(): Promise<DemoSession> {
    const now = new Date();

    const live = await this.dataSource.getRepository(Clinic).count({
      where: { isDemo: true },
    });
    if (live >= this.maxLiveSandboxes) {
      this.logger.warn(`Plafond de bacs à sable atteint (${live})`);
      throw new ServiceUnavailableException(
        "Trop d'espaces de démonstration sont ouverts. Chacun expire au bout " +
          "d'une heure ; réessayez dans quelques minutes.",
      );
    }

    // Suffixe non devinable : rend les adresses uniques (l'index sur
    // user.email est unique) et empêche de deviner les comptes d'un autre.
    const suffix = randomBytes(4).toString('hex');
    const password = `Demo-${randomBytes(6).toString('hex').toUpperCase()}`;
    const passwordHash = await bcrypt.hash(password, this.bcryptRounds);

    const clinicId = randomUUID();
    const expiresAt = new Date(now.getTime() + this.lifetimeMs);

    const accounts = await this.dataSource.transaction(async (manager) => {
      await manager.insert(Clinic, {
        id: clinicId,
        name: `Clinique de démonstration ${suffix}`,
        address: '250, promenade du Portage, Gatineau',
        openingHour: '08:00:00',
        closingHour: '18:00:00',
        isActive: true,
        isDemo: true,
        expiresAt,
      });

      return this.seed(manager, clinicId, suffix, passwordHash, now);
    });

    const admin = accounts.find((a) => a.role === UserRole.CLINIC_ADMIN)!;

    // On passe par la connexion normale : le jeton du visiteur est produit
    // exactement comme celui d'un vrai compte, avec la revendication
    // clinic_id dont dépend tout le cloisonnement.
    const auth = await this.authService.login({ email: admin.email, password });

    this.logger.log(`Bac à sable ${clinicId} créé, expire à ${expiresAt.toISOString()}`);

    return {
      accessToken: auth.accessToken,
      tokenType: auth.tokenType,
      expiresIn: auth.expiresIn,
      user: auth.user,
      clinicId,
      clinicName: `Clinique de démonstration ${suffix}`,
      sandboxExpiresAt: expiresAt.toISOString(),
      sharedPassword: password,
      accounts: accounts
        .filter((a) => a.role !== UserRole.PATIENT || a.featured)
        .map(({ email, role, firstName, lastName }) => ({
          email,
          role,
          firstName,
          lastName,
        })),
    };
  }

  /**
   * Supprime les bacs à sable expirés.
   *
   * L'ordre suit les clés étrangères : toutes les relations vers `clinic` et
   * `user` sont en ON DELETE RESTRICT, la clinique ne peut donc partir qu'en
   * dernier. La condition porte sur `is_demo = true` ET une expiration
   * dépassée : une clinique réelle a `expires_at` NULL, la comparaison est
   * fausse pour elle quoi qu'il arrive.
   */
  async purgeExpired(): Promise<number> {
    const now = new Date();

    const expired = await this.dataSource.getRepository(Clinic).find({
      where: { isDemo: true, expiresAt: LessThan(now) },
      select: { id: true },
    });
    if (expired.length === 0) {
      return 0;
    }
    const ids = expired.map((c) => c.id);

    await this.dataSource.transaction(async (manager) => {
      // `In(...)` est obligatoire : passer le tableau nu produit un litteral
      // PostgreSQL `{uuid,uuid}` au lieu d'un `IN (...)`, et la requete echoue
      // sur « invalid input syntax for type uuid ».
      await manager.delete(Appointment, { clinicId: In(ids) });
      await manager.delete(AppointmentSlot, { clinicId: In(ids) });
      await manager.delete(Availability, { clinicId: In(ids) });
      await manager.delete(Notification, { clinicId: In(ids) });
      await manager.delete(User, { clinicId: In(ids) });
      await manager.delete(Clinic, { id: In(ids) });
    });

    this.logger.log(`${ids.length} bac(s) à sable expiré(s) supprimé(s)`);
    return ids.length;
  }

  /**
   * Jeu de données : deux médecins, six patients, des disponibilités sur trois
   * jours découpées en créneaux, et des rendez-vous couvrant les statuts. De
   * quoi que l'agenda, la liste et les statistiques aient tous quelque chose à
   * montrer dès la première seconde.
   */
  private async seed(
    manager: EntityManager,
    clinicId: string,
    suffix: string,
    passwordHash: string,
    now: Date,
  ): Promise<SeededAccount[]> {
    const comptes: SeededAccount[] = [
      {
        id: randomUUID(),
        email: `admin@${suffix}.demo.test`,
        role: UserRole.CLINIC_ADMIN,
        firstName: 'Sonia',
        lastName: 'Bélanger',
        featured: true,
      },
      {
        id: randomUUID(),
        email: `dre.roy@${suffix}.demo.test`,
        role: UserRole.DOCTOR,
        firstName: 'Amina',
        lastName: 'Roy',
        featured: true,
      },
      {
        id: randomUUID(),
        email: `dr.tremblay@${suffix}.demo.test`,
        role: UserRole.DOCTOR,
        firstName: 'Marc',
        lastName: 'Tremblay',
        featured: false,
      },
      {
        id: randomUUID(),
        email: `patient@${suffix}.demo.test`,
        role: UserRole.PATIENT,
        firstName: 'Yanis',
        lastName: 'Ferland',
        featured: true,
      },
    ];

    // Patients supplémentaires : ils remplissent l'agenda sans encombrer le
    // sélecteur de rôles du bandeau (d'où `featured: false`).
    const autresPatients = [
      ['Claire', 'Dubois'],
      ['Olivier', 'Côté'],
      ['Priya', 'Sharma'],
      ['Émilie', 'Gagnon'],
      ['Samuel', 'Desjardins'],
    ] as const;

    autresPatients.forEach(([firstName, lastName], index) => {
      comptes.push({
        id: randomUUID(),
        email: `patient${index + 2}@${suffix}.demo.test`,
        role: UserRole.PATIENT,
        firstName,
        lastName,
        featured: false,
      });
    });

    await manager.insert(
      User,
      comptes.map((c) => ({
        id: c.id,
        email: c.email,
        passwordHash,
        firstName: c.firstName,
        lastName: c.lastName,
        role: c.role,
        // Un patient de démonstration reste rattaché à la clinique : sans
        // clinic_id il serait visible depuis n'importe quel autre bac.
        clinicId,
        isSelfRegistered: false,
        isActive: true,
      })),
    );

    const medecins = comptes.filter((c) => c.role === UserRole.DOCTOR);
    const patients = comptes.filter((c) => c.role === UserRole.PATIENT);

    const disponibilites: Partial<Availability>[] = [];
    const creneaux: Partial<AppointmentSlot>[] = [];
    const rendezVous: Partial<Appointment>[] = [];

    const jourZero = new Date(now);
    jourZero.setUTCHours(0, 0, 0, 0);

    // Hier, aujourd'hui, demain, après-demain : de l'historique ET du futur.
    const decalages = [-1, 0, 1, 2];
    let compteurPatient = 0;

    for (const decalage of decalages) {
      for (const medecin of medecins) {
        const debut = new Date(jourZero);
        debut.setUTCDate(debut.getUTCDate() + decalage);
        debut.setUTCHours(medecin.firstName === 'Amina' ? 13 : 15, 0, 0, 0);
        const fin = new Date(debut.getTime() + 3 * 60 * 60 * 1000);

        disponibilites.push({
          id: randomUUID(),
          clinicId,
          doctorId: medecin.id,
          startAt: debut,
          endAt: fin,
          slotDurationMin: 30,
          type: AvailabilityType.AVAILABLE,
        });

        for (let i = 0; i < 6; i += 1) {
          const creneauDebut = new Date(debut.getTime() + i * 30 * 60 * 1000);
          const creneauFin = new Date(creneauDebut.getTime() + 30 * 60 * 1000);
          const slotId = randomUUID();

          // Deux créneaux réservés sur six : l'agenda est lisible, il reste
          // de la place pour que le visiteur réserve lui-même.
          const reserve = i === 1 || i === 3;
          creneaux.push({
            id: slotId,
            clinicId,
            doctorId: medecin.id,
            startAt: creneauDebut,
            endAt: creneauFin,
            isBooked: reserve,
          });

          if (!reserve) {
            continue;
          }

          const patient = patients[compteurPatient % patients.length];
          compteurPatient += 1;

          rendezVous.push({
            id: randomUUID(),
            clinicId,
            slotId,
            patientId: patient.id,
            doctorId: medecin.id,
            createdById: comptes[0].id,
            status: this.statutSelonDate(creneauDebut, now, i),
            reason: MOTIFS[compteurPatient % MOTIFS.length],
            cancellationReason: null,
          });
        }
      }
    }

    await manager.insert(Availability, disponibilites);
    await manager.insert(AppointmentSlot, creneaux);
    await manager.insert(Appointment, rendezVous);

    return comptes;
  }

  /** Passé = terminé (ou une absence), aujourd'hui et après = réservé. */
  private statutSelonDate(debut: Date, now: Date, index: number): AppointmentStatus {
    if (debut.getTime() >= now.getTime()) {
      return AppointmentStatus.BOOKED;
    }
    return index === 1 ? AppointmentStatus.COMPLETED : AppointmentStatus.ABSENT;
  }
}

const MOTIFS = [
  'Suivi de tension artérielle',
  'Renouvellement d’ordonnance',
  'Douleurs lombaires persistantes',
  'Bilan sanguin annuel',
  'Consultation de suivi',
  'Vaccination',
] as const;

interface SeededAccount {
  id: string;
  email: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  /** Proposé dans le sélecteur de rôles du bandeau de démonstration. */
  featured: boolean;
}

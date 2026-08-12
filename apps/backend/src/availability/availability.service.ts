import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, FindOptionsWhere, Repository } from 'typeorm';
import { AppointmentSlot } from '../appointment/appointment-slot.entity';
import type { AuthenticatedUser } from '../auth/auth.types';
import { UserRole } from '../user/user-role.enum';
import { User } from '../user/user.entity';
import { AvailabilityType } from './availability-type.enum';
import { Availability } from './availability.entity';
import {
  AvailabilitySlotDto,
  MaterializedSlotDto,
  toAvailabilityResponse,
} from './dto/availability-response.dto';
import { CreateAvailabilityDto } from './dto/create-availability.dto';
import { UpdateAvailabilityDto } from './dto/update-availability.dto';

@Injectable()
export class AvailabilityService {
  constructor(
    @InjectRepository(Availability)
    private readonly availabilityRepository: Repository<Availability>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(AppointmentSlot)
    private readonly slotRepository: Repository<AppointmentSlot>,
  ) {}

  async create(currentUser: AuthenticatedUser, dto: CreateAvailabilityDto) {
    const doctor = await this.resolveWritableDoctor(currentUser, dto.doctorId);
    const { startAt, endAt } = this.parseAndValidateRange(dto.startAt, dto.endAt);
    const clinicId = doctor.clinicId;
    if (!clinicId) {
      throw new NotFoundException('Médecin introuvable.');
    }

    const availability = this.availabilityRepository.create({
      doctorId: doctor.id,
      clinicId,
      startAt,
      endAt,
      slotDurationMin: dto.slotDurationMin ?? 30,
      type: dto.type ?? AvailabilityType.AVAILABLE,
      note: dto.note?.trim() || null,
    });

    const saved = await this.availabilityRepository.save(availability);

    // Les créneaux sont matérialisés DÈS la publication de la plage, et non
    // lors du premier accès de la réception (MEDIPLAN-21).
    //
    // Tant qu'ils n'existent pas en base, ils n'ont pas d'identifiant — donc
    // rien à réserver. La réception ne s'en apercevait pas : ouvrir son
    // dialogue de réservation les créait au passage. Un patient en
    // libre-service, lui, ne déclenche jamais cette matérialisation : une plage
    // fraîchement publiée lui serait restée invisible jusqu'à ce qu'un
    // réceptionniste l'ouvre par hasard.
    await this.insertSlotsFor(saved);

    return toAvailabilityResponse(saved);
  }

  /**
   * Insère les créneaux d'une plage réservable, sans jamais écraser l'existant.
   *
   * `orIgnore()` rend l'opération idempotente : la contrainte d'unicité
   * (clinique, médecin, début) absorbe les rejouages, et un créneau déjà
   * réservé n'est pas retouché. C'est ce qui permet de l'appeler aussi bien à
   * la création qu'à chaque matérialisation ultérieure.
   *
   * Une plage de congé ne génère rien, par définition.
   */
  private async insertSlotsFor(availability: Availability): Promise<void> {
    if (availability.type !== AvailabilityType.AVAILABLE) {
      return;
    }

    const durationMs = availability.slotDurationMin * 60_000;
    const end = availability.endAt.getTime();
    const rows: Array<Partial<AppointmentSlot>> = [];
    for (
      let cursor = availability.startAt.getTime();
      cursor + durationMs <= end;
      cursor += durationMs
    ) {
      rows.push({
        clinicId: availability.clinicId,
        doctorId: availability.doctorId,
        startAt: new Date(cursor),
        endAt: new Date(cursor + durationMs),
      });
    }

    if (rows.length > 0) {
      await this.slotRepository.createQueryBuilder().insert().values(rows).orIgnore().execute();
    }
  }

  async findAllScoped(currentUser: AuthenticatedUser) {
    const where = this.buildReadScope(currentUser);
    const availabilities = await this.availabilityRepository.find({
      where,
      order: { startAt: 'ASC' },
    });
    return availabilities.map(toAvailabilityResponse);
  }

  async findOneScoped(currentUser: AuthenticatedUser, id: string) {
    const availability = await this.getScopedAvailability(currentUser, id);
    return toAvailabilityResponse(availability);
  }

  async update(currentUser: AuthenticatedUser, id: string, dto: UpdateAvailabilityDto) {
    const availability = await this.getScopedAvailability(currentUser, id);
    this.ensureWritableAvailability(currentUser, availability);

    if (dto.doctorId !== undefined) {
      const doctor = await this.resolveWritableDoctor(currentUser, dto.doctorId);
      const clinicId = doctor.clinicId;
      if (!clinicId) {
        throw new NotFoundException('Médecin introuvable.');
      }
      availability.doctorId = doctor.id;
      availability.clinicId = clinicId;
    }

    if (dto.startAt !== undefined || dto.endAt !== undefined) {
      const { startAt, endAt } = this.parseAndValidateRange(
        dto.startAt ?? availability.startAt.toISOString(),
        dto.endAt ?? availability.endAt.toISOString(),
      );
      availability.startAt = startAt;
      availability.endAt = endAt;
    }

    if (dto.slotDurationMin !== undefined) {
      availability.slotDurationMin = dto.slotDurationMin;
    }
    if (dto.type !== undefined) {
      availability.type = dto.type;
    }
    if (dto.note !== undefined) {
      availability.note = dto.note.trim() || null;
    }

    return toAvailabilityResponse(await this.availabilityRepository.save(availability));
  }

  /**
   * Supprime une plage **et les créneaux qu'elle avait publiés**.
   *
   * Les créneaux sont des lignes indépendantes de la plage : rien, en base, ne
   * les rattache à elle. Supprimer la plage sans les supprimer laissait donc des
   * créneaux réservables pour une matinée qui n'existe plus — invisible tant que
   * seule la réception réservait, mais directement exposé au patient depuis
   * MEDIPLAN-21.
   *
   * Si un créneau de la plage est **déjà réservé**, la suppression est refusée :
   * effacer la matinée d'un médecin ne doit pas faire disparaître en silence les
   * rendez-vous de ses patients. Il faut d'abord les annuler — geste explicite,
   * tracé, avec un motif.
   */
  async remove(currentUser: AuthenticatedUser, id: string): Promise<void> {
    const availability = await this.getScopedAvailability(currentUser, id);
    this.ensureWritableAvailability(currentUser, availability);

    // Une plage de congé n'a jamais publié de créneau : rien à nettoyer.
    if (availability.type === AvailabilityType.AVAILABLE) {
      const booked = await this.slotsOfRange(availability)
        .andWhere('slot.is_booked = true')
        .getCount();

      if (booked > 0) {
        throw new ConflictException(
          'Des rendez-vous sont réservés sur cette plage. Annulez-les avant de la supprimer.',
        );
      }

      await this.slotRepository
        .createQueryBuilder()
        .delete()
        .from(AppointmentSlot)
        .where('clinic_id = :clinicId', { clinicId: availability.clinicId })
        .andWhere('doctor_id = :doctorId', { doctorId: availability.doctorId })
        .andWhere('start_at >= :start AND start_at < :end', {
          start: availability.startAt,
          end: availability.endAt,
        })
        .andWhere('is_booked = false')
        .execute();
    }

    await this.availabilityRepository.remove(availability);
  }

  /**
   * Créneaux couverts par une plage.
   *
   * Borne haute **exclue** : un créneau qui commence exactement à la fin de la
   * plage appartient à la plage suivante, pas à celle-ci.
   */
  private slotsOfRange(availability: Availability) {
    return this.slotRepository
      .createQueryBuilder('slot')
      .where('slot.clinic_id = :clinicId', { clinicId: availability.clinicId })
      .andWhere('slot.doctor_id = :doctorId', { doctorId: availability.doctorId })
      .andWhere('slot.start_at >= :start AND slot.start_at < :end', {
        start: availability.startAt,
        end: availability.endAt,
      });
  }

  async generateSlots(currentUser: AuthenticatedUser, id: string): Promise<AvailabilitySlotDto[]> {
    const availability = await this.getScopedAvailability(currentUser, id);

    if (availability.type !== AvailabilityType.AVAILABLE) {
      return [];
    }

    const slots: AvailabilitySlotDto[] = [];
    const durationMs = availability.slotDurationMin * 60_000;
    let cursor = availability.startAt.getTime();
    const end = availability.endAt.getTime();

    while (cursor + durationMs <= end) {
      slots.push({
        startAt: new Date(cursor).toISOString(),
        endAt: new Date(cursor + durationMs).toISOString(),
      });
      cursor += durationMs;
    }

    return slots;
  }

  /**
   * Matérialise (persiste) les créneaux réservables d'une disponibilité et les
   * renvoie avec leur `id` et leur état `isBooked`.
   *
   * Contrairement à `generateSlots` (aperçu éphémère), cette méthode crée en base
   * les lignes `appointment_slot` manquantes afin que la réception puisse réserver
   * par `slotId`. L'insertion est idempotente (`ON CONFLICT DO NOTHING` sur
   * l'unique `(doctor_id, start_at)`) : rejouable sans doublon et sans jamais
   * réécrire un créneau déjà réservé. Le périmètre RBAC est celui de la
   * disponibilité (médecin → les siennes, admin → sa clinique).
   */
  async materializeSlots(
    currentUser: AuthenticatedUser,
    id: string,
  ): Promise<MaterializedSlotDto[]> {
    const availability = await this.getScopedAvailability(currentUser, id);

    if (availability.type !== AvailabilityType.AVAILABLE) {
      return [];
    }

    // Rattrape les plages créées avant que la matérialisation soit faite dès la
    // publication ; sans effet sur les autres (insertion idempotente).
    await this.insertSlotsFor(availability);

    const slots = await this.slotRepository.find({
      where: {
        clinicId: availability.clinicId,
        doctorId: availability.doctorId,
        startAt: Between(availability.startAt, availability.endAt),
      },
      order: { startAt: 'ASC' },
    });

    return slots.map((slot) => ({
      id: slot.id,
      startAt: slot.startAt.toISOString(),
      endAt: slot.endAt.toISOString(),
      isBooked: slot.isBooked,
    }));
  }

  private buildReadScope(currentUser: AuthenticatedUser): FindOptionsWhere<Availability> {
    if (currentUser.role === UserRole.SUPER_ADMIN) {
      return {};
    }
    if (currentUser.role === UserRole.DOCTOR) {
      return { doctorId: currentUser.id };
    }
    if (!currentUser.clinicId) {
      return { clinicId: '__no_clinic__' };
    }
    return { clinicId: currentUser.clinicId };
  }

  private async getScopedAvailability(
    currentUser: AuthenticatedUser,
    id: string,
  ): Promise<Availability> {
    const availability = await this.availabilityRepository.findOne({
      where: { id, ...this.buildReadScope(currentUser) },
    });
    if (!availability) {
      throw new NotFoundException('Disponibilité introuvable.');
    }
    return availability;
  }

  private ensureWritableAvailability(
    currentUser: AuthenticatedUser,
    availability: Availability,
  ): void {
    if (currentUser.role === UserRole.SUPER_ADMIN) {
      return;
    }
    if (currentUser.role === UserRole.DOCTOR && availability.doctorId === currentUser.id) {
      return;
    }
    if (
      currentUser.role === UserRole.CLINIC_ADMIN &&
      currentUser.clinicId &&
      availability.clinicId === currentUser.clinicId
    ) {
      return;
    }
    throw new ForbiddenException('Accès refusé : disponibilité hors périmètre.');
  }

  private async resolveWritableDoctor(
    currentUser: AuthenticatedUser,
    requestedDoctorId?: string,
  ): Promise<User> {
    const doctorId = currentUser.role === UserRole.DOCTOR ? currentUser.id : requestedDoctorId;
    if (!doctorId) {
      throw new BadRequestException('doctorId est requis.');
    }

    const doctor = await this.userRepository.findOne({ where: { id: doctorId } });
    if (!doctor || doctor.role !== UserRole.DOCTOR || !doctor.isActive || !doctor.clinicId) {
      throw new NotFoundException('Médecin introuvable.');
    }

    if (currentUser.role === UserRole.CLINIC_ADMIN && doctor.clinicId !== currentUser.clinicId) {
      throw new NotFoundException('Médecin introuvable.');
    }

    return doctor;
  }

  private parseAndValidateRange(
    startValue: string,
    endValue: string,
  ): { startAt: Date; endAt: Date } {
    const startAt = new Date(startValue);
    const endAt = new Date(endValue);

    if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime())) {
      throw new BadRequestException('Dates de disponibilité invalides.');
    }
    if (endAt <= startAt) {
      throw new BadRequestException('La fin doit être après le début.');
    }

    return { startAt, endAt };
  }
}

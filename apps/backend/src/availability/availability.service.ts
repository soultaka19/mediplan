import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import type { AuthenticatedUser } from '../auth/auth.types';
import { UserRole } from '../user/user-role.enum';
import { User } from '../user/user.entity';
import { AvailabilityType } from './availability-type.enum';
import { Availability } from './availability.entity';
import { AvailabilitySlotDto, toAvailabilityResponse } from './dto/availability-response.dto';
import { CreateAvailabilityDto } from './dto/create-availability.dto';
import { UpdateAvailabilityDto } from './dto/update-availability.dto';

@Injectable()
export class AvailabilityService {
  constructor(
    @InjectRepository(Availability)
    private readonly availabilityRepository: Repository<Availability>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
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

    return toAvailabilityResponse(await this.availabilityRepository.save(availability));
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

  async remove(currentUser: AuthenticatedUser, id: string): Promise<void> {
    const availability = await this.getScopedAvailability(currentUser, id);
    this.ensureWritableAvailability(currentUser, availability);
    await this.availabilityRepository.remove(availability);
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

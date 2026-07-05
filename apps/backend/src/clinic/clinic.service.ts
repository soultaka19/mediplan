import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { AuthenticatedUser } from '../auth/auth.types';
import { UserRole } from '../user/user-role.enum';
import { Clinic } from './clinic.entity';
import { ClinicResponseDto, toClinicResponse } from './dto/clinic-response.dto';
import { CreateClinicDto } from './dto/create-clinic.dto';
import { UpdateClinicDto } from './dto/update-clinic.dto';

@Injectable()
export class ClinicService {
  constructor(
    @InjectRepository(Clinic)
    private readonly clinicRepository: Repository<Clinic>,
  ) {}

  async create(dto: CreateClinicDto): Promise<ClinicResponseDto> {
    this.validateHours(dto.openingHour, dto.closingHour);

    const clinic = this.clinicRepository.create({
      name: dto.name.trim(),
      address: dto.address?.trim() || null,
      openingHour: dto.openingHour ?? null,
      closingHour: dto.closingHour ?? null,
      isActive: dto.isActive ?? true,
    });

    return toClinicResponse(await this.clinicRepository.save(clinic));
  }

  async findAll(): Promise<ClinicResponseDto[]> {
    const clinics = await this.clinicRepository.find({ order: { name: 'ASC' } });
    return clinics.map(toClinicResponse);
  }

  async findOneScoped(currentUser: AuthenticatedUser, id: string): Promise<ClinicResponseDto> {
    if (currentUser.role === UserRole.CLINIC_ADMIN && currentUser.clinicId !== id) {
      throw new NotFoundException('Clinique introuvable.');
    }

    const clinic = await this.clinicRepository.findOne({ where: { id } });
    if (!clinic) {
      throw new NotFoundException('Clinique introuvable.');
    }

    return toClinicResponse(clinic);
  }

  async update(id: string, dto: UpdateClinicDto): Promise<ClinicResponseDto> {
    const clinic = await this.clinicRepository.findOne({ where: { id } });
    if (!clinic) {
      throw new NotFoundException('Clinique introuvable.');
    }

    const openingHour = dto.openingHour ?? clinic.openingHour ?? undefined;
    const closingHour = dto.closingHour ?? clinic.closingHour ?? undefined;
    this.validateHours(openingHour, closingHour);

    if (dto.name !== undefined) {
      clinic.name = dto.name.trim();
    }
    if (dto.address !== undefined) {
      clinic.address = dto.address.trim() || null;
    }
    if (dto.openingHour !== undefined) {
      clinic.openingHour = dto.openingHour;
    }
    if (dto.closingHour !== undefined) {
      clinic.closingHour = dto.closingHour;
    }
    if (dto.isActive !== undefined) {
      clinic.isActive = dto.isActive;
    }

    return toClinicResponse(await this.clinicRepository.save(clinic));
  }

  private validateHours(openingHour?: string | null, closingHour?: string | null): void {
    if (!openingHour || !closingHour) {
      return;
    }
    if (closingHour <= openingHour) {
      throw new BadRequestException("L'heure de fermeture doit etre apres l'ouverture.");
    }
  }
}

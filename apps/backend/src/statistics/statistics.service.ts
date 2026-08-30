import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthenticatedUser } from '../auth/auth.types';
import { AppointmentSlot } from '../appointment/appointment-slot.entity';
import { AppointmentStatus } from '../appointment/appointment-status.enum';
import { Appointment } from '../appointment/appointment.entity';
import { UserRole } from '../user/user-role.enum';
import { User } from '../user/user.entity';
import { StatisticsQueryDto } from './dto/statistics-query.dto';
import { DoctorStatistics, StatisticsResponse } from './dto/statistics-response.dto';

interface Period {
  start: Date;
  end: Date;
}

interface AppointmentAggregateRow {
  doctorId: string;
  doctorFirstName: string | null;
  doctorLastName: string | null;
  doctorEmail: string | null;
  totalAppointments: string;
  completedAppointments: string;
  cancelledAppointments: string;
  noShowAppointments: string;
}

interface SlotAggregateRow {
  doctorId: string;
  doctorFirstName: string | null;
  doctorLastName: string | null;
  doctorEmail: string | null;
  totalSlots: string;
  occupiedSlots: string;
}

@Injectable()
export class StatisticsService {
  constructor(
    @InjectRepository(Appointment)
    private readonly appointmentRepository: Repository<Appointment>,
    @InjectRepository(AppointmentSlot)
    private readonly slotRepository: Repository<AppointmentSlot>,
  ) {}

  async getActivityStatistics(
    currentUser: AuthenticatedUser,
    query: StatisticsQueryDto,
  ): Promise<StatisticsResponse> {
    const period = this.resolvePeriod(query);
    const doctorId = query.doctorId ?? null;

    const appointmentRows = await this.buildAppointmentAggregate(currentUser, period, doctorId);
    const slotRows = await this.buildSlotAggregate(currentUser, period, doctorId);
    const byDoctor = this.mergeDoctorRows(appointmentRows, slotRows);

    const summary = byDoctor.reduce(
      (acc, doctor) => {
        acc.totalAppointments += doctor.totalAppointments;
        acc.completedAppointments += this.completedForDoctor(appointmentRows, doctor.doctorId);
        acc.cancelledAppointments += this.cancelledForDoctor(appointmentRows, doctor.doctorId);
        acc.noShowAppointments += doctor.noShowAppointments;
        acc.totalSlots += doctor.totalSlots;
        acc.occupiedSlots += doctor.occupiedSlots;
        return acc;
      },
      {
        totalAppointments: 0,
        completedAppointments: 0,
        cancelledAppointments: 0,
        noShowAppointments: 0,
        noShowRate: 0,
        totalSlots: 0,
        occupiedSlots: 0,
        occupancyRate: 0,
      },
    );

    summary.noShowRate = this.rate(summary.noShowAppointments, summary.totalAppointments);
    summary.occupancyRate = this.rate(summary.occupiedSlots, summary.totalSlots);

    return {
      filters: {
        startDate: period.start.toISOString(),
        endDate: period.end.toISOString(),
        doctorId,
      },
      summary,
      byDoctor,
    };
  }

  private buildAppointmentAggregate(
    currentUser: AuthenticatedUser,
    period: Period,
    doctorId: string | null,
  ): Promise<AppointmentAggregateRow[]> {
    const query = this.appointmentRepository
      .createQueryBuilder('appointment')
      .innerJoin('appointment.slot', 'slot')
      .innerJoin(User, 'doctor', 'doctor.id = appointment.doctor_id')
      .select('appointment.doctor_id', 'doctorId')
      .addSelect('doctor.first_name', 'doctorFirstName')
      .addSelect('doctor.last_name', 'doctorLastName')
      .addSelect('doctor.email', 'doctorEmail')
      .addSelect('COUNT(appointment.id)', 'totalAppointments')
      .addSelect('COUNT(*) FILTER (WHERE appointment.status = :completed)', 'completedAppointments')
      .addSelect('COUNT(*) FILTER (WHERE appointment.status = :cancelled)', 'cancelledAppointments')
      .addSelect('COUNT(*) FILTER (WHERE appointment.status = :absent)', 'noShowAppointments')
      .where('slot.start_at >= :start', { start: period.start })
      .andWhere('slot.start_at < :end', { end: period.end })
      .setParameters({
        completed: AppointmentStatus.COMPLETED,
        cancelled: AppointmentStatus.CANCELLED,
        absent: AppointmentStatus.ABSENT,
      })
      .groupBy('appointment.doctor_id')
      .addGroupBy('doctor.first_name')
      .addGroupBy('doctor.last_name')
      .addGroupBy('doctor.email')
      .orderBy('doctor.last_name', 'ASC', 'NULLS LAST')
      .addOrderBy('doctor.first_name', 'ASC', 'NULLS LAST');

    this.applyScope(query, currentUser, 'appointment.clinic_id');
    if (doctorId) {
      query.andWhere('appointment.doctor_id = :doctorId', { doctorId });
    }

    return query.getRawMany<AppointmentAggregateRow>();
  }

  private buildSlotAggregate(
    currentUser: AuthenticatedUser,
    period: Period,
    doctorId: string | null,
  ): Promise<SlotAggregateRow[]> {
    const query = this.slotRepository
      .createQueryBuilder('slot')
      .innerJoin(User, 'doctor', 'doctor.id = slot.doctor_id')
      .select('slot.doctor_id', 'doctorId')
      .addSelect('doctor.first_name', 'doctorFirstName')
      .addSelect('doctor.last_name', 'doctorLastName')
      .addSelect('doctor.email', 'doctorEmail')
      .addSelect('COUNT(slot.id)', 'totalSlots')
      .addSelect('COUNT(*) FILTER (WHERE slot.is_booked = true)', 'occupiedSlots')
      .where('slot.start_at >= :start', { start: period.start })
      .andWhere('slot.start_at < :end', { end: period.end })
      .groupBy('slot.doctor_id')
      .addGroupBy('doctor.first_name')
      .addGroupBy('doctor.last_name')
      .addGroupBy('doctor.email')
      .orderBy('doctor.last_name', 'ASC', 'NULLS LAST')
      .addOrderBy('doctor.first_name', 'ASC', 'NULLS LAST');

    this.applyScope(query, currentUser, 'slot.clinic_id');
    if (doctorId) {
      query.andWhere('slot.doctor_id = :doctorId', { doctorId });
    }

    return query.getRawMany<SlotAggregateRow>();
  }

  private applyScope(
    query: { andWhere: (condition: string, parameters?: Record<string, unknown>) => unknown },
    currentUser: AuthenticatedUser,
    clinicColumn: string,
  ): void {
    if (currentUser.role === UserRole.SUPER_ADMIN) {
      return;
    }
    if (!currentUser.clinicId) {
      query.andWhere('1 = 0');
      return;
    }
    query.andWhere(`${clinicColumn} = :clinicId`, { clinicId: currentUser.clinicId });
  }

  private mergeDoctorRows(
    appointmentRows: AppointmentAggregateRow[],
    slotRows: SlotAggregateRow[],
  ): DoctorStatistics[] {
    const doctors = new Map<string, DoctorStatistics>();

    for (const row of slotRows) {
      doctors.set(row.doctorId, {
        doctorId: row.doctorId,
        doctorName: this.doctorName(row),
        totalAppointments: 0,
        noShowAppointments: 0,
        noShowRate: 0,
        totalSlots: this.toNumber(row.totalSlots),
        occupiedSlots: this.toNumber(row.occupiedSlots),
        occupancyRate: 0,
      });
    }

    for (const row of appointmentRows) {
      const current =
        doctors.get(row.doctorId) ??
        ({
          doctorId: row.doctorId,
          doctorName: this.doctorName(row),
          totalAppointments: 0,
          noShowAppointments: 0,
          noShowRate: 0,
          totalSlots: 0,
          occupiedSlots: 0,
          occupancyRate: 0,
        } satisfies DoctorStatistics);

      current.totalAppointments = this.toNumber(row.totalAppointments);
      current.noShowAppointments = this.toNumber(row.noShowAppointments);
      doctors.set(row.doctorId, current);
    }

    return Array.from(doctors.values()).map((doctor) => ({
      ...doctor,
      noShowRate: this.rate(doctor.noShowAppointments, doctor.totalAppointments),
      occupancyRate: this.rate(doctor.occupiedSlots, doctor.totalSlots),
    }));
  }

  private completedForDoctor(rows: AppointmentAggregateRow[], doctorId: string): number {
    return this.toNumber(rows.find((row) => row.doctorId === doctorId)?.completedAppointments);
  }

  private cancelledForDoctor(rows: AppointmentAggregateRow[], doctorId: string): number {
    return this.toNumber(rows.find((row) => row.doctorId === doctorId)?.cancelledAppointments);
  }

  private resolvePeriod(query: StatisticsQueryDto): Period {
    const end = query.endDate ? this.parseDate(query.endDate, true) : new Date();
    const start = query.startDate
      ? this.parseDate(query.startDate, false)
      : this.daysBefore(end, 30);

    if (start.getTime() >= end.getTime()) {
      throw new BadRequestException('La date de debut doit etre avant la date de fin.');
    }

    return { start, end };
  }

  private parseDate(value: string, endOfDay: boolean): Date {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException('Periode invalide.');
    }

    if (/^\d{4}-\d{2}-\d{2}$/.test(value) && endOfDay) {
      date.setUTCDate(date.getUTCDate() + 1);
    }

    return date;
  }

  private daysBefore(date: Date, days: number): Date {
    const result = new Date(date);
    result.setUTCDate(result.getUTCDate() - days);
    return result;
  }

  private doctorName(row: {
    doctorFirstName: string | null;
    doctorLastName: string | null;
    doctorEmail: string | null;
  }): string {
    const fullName = [row.doctorFirstName, row.doctorLastName].filter(Boolean).join(' ').trim();
    return fullName || row.doctorEmail || 'Medecin';
  }

  private rate(part: number, total: number): number {
    if (total === 0) {
      return 0;
    }
    return Math.round((part / total) * 1000) / 10;
  }

  private toNumber(value: string | number | null | undefined): number {
    if (value === null || value === undefined) {
      return 0;
    }
    return Number(value);
  }
}

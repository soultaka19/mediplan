import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Clinic } from '../clinic/clinic.entity';
import { User } from '../user/user.entity';
import { AvailabilityType } from './availability-type.enum';

/**
 * Plage datée de disponibilité ou d'indisponibilité d'un médecin (MEDIPLAN-20).
 *
 * `clinicId` est dénormalisé pour appliquer rapidement le scope multi-clinique.
 * Il est dérivé du médecin côté service, jamais accepté depuis le body API.
 */
@Entity('availability')
@Index('idx_availability_clinic_start', ['clinicId', 'startAt'])
@Index('idx_availability_doctor_start', ['doctorId', 'startAt'])
export class Availability {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  doctorId: string;

  @ManyToOne(() => User, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'doctor_id' })
  doctor: User;

  @Column({ type: 'uuid' })
  clinicId: string;

  @ManyToOne(() => Clinic, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'clinic_id' })
  clinic: Clinic;

  @Column({ type: 'timestamptz' })
  startAt: Date;

  @Column({ type: 'timestamptz' })
  endAt: Date;

  @Column({ type: 'int', default: 30 })
  slotDurationMin: number;

  @Column({ type: 'enum', enum: AvailabilityType, enumName: 'availability_type' })
  type: AvailabilityType;

  @Column({ type: 'text', nullable: true })
  note: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}

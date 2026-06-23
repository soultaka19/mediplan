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

@Entity('appointment_slot')
@Index('idx_appointment_slot_clinic_start', ['clinicId', 'startAt'])
@Index('idx_appointment_slot_doctor_start', ['doctorId', 'startAt'])
export class AppointmentSlot {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  clinicId: string;

  @ManyToOne(() => Clinic, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'clinic_id' })
  clinic: Clinic;

  @Column({ type: 'uuid' })
  doctorId: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'doctor_id' })
  doctor: User;

  @Column({ type: 'timestamptz' })
  startAt: Date;

  @Column({ type: 'timestamptz' })
  endAt: Date;

  @Column({ type: 'boolean', default: false })
  isBooked: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}

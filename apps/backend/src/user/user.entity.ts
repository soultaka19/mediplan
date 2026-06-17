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
import { UserRole } from './user-role.enum';

/**
 * Utilisateur de la plateforme (tous rôles confondus).
 *
 * Décisions de schéma (Phase 2) reflétées ici et garanties par la migration socle :
 * - `email` en `citext` (comparaison insensible à la casse) + unicité tolérant NULL.
 * - `passwordHash` nullable : prépare le futur « patient léger » (créé sans mot de passe).
 * - `role` = enum PostgreSQL natif `user_role`.
 * - `clinicId` nullable mais OBLIGATOIRE pour tout rôle ≠ super_admin (CHECK en base).
 * - FK `clinicId` → clinic.id ON DELETE RESTRICT (on ne supprime pas une clinique
 *   tant qu'elle rattache des utilisateurs).
 *
 * Donnée sensible : ne JAMAIS exposer `passwordHash`, `failedLoginAttempts`,
 * `lockedUntil` dans une réponse API (à filtrer côté serializer au Lot 2).
 */
@Entity('user')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Type `citext` : insensible à la casse au niveau du stockage.
   * L'unicité (tolérant les NULL multiples) est posée par index dans la migration.
   */
  @Column({ type: 'citext', nullable: true })
  email: string | null;

  /** Hash bcrypt (12 rounds, décision sécurité). Nullable pour patient léger. */
  @Column({ type: 'text', nullable: true, select: false })
  passwordHash: string | null;

  @Column({ type: 'text', nullable: true })
  firstName: string | null;

  @Column({ type: 'text', nullable: true })
  lastName: string | null;

  @Column({ type: 'enum', enum: UserRole, enumName: 'user_role' })
  role: UserRole;

  @Index('idx_user_clinic_id')
  @Column({ type: 'uuid', nullable: true })
  clinicId: string | null;

  @ManyToOne(() => Clinic, (clinic) => clinic.users, {
    nullable: true,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'clinic_id' })
  clinic: Clinic | null;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'int', default: 0 })
  failedLoginAttempts: number;

  @Column({ type: 'timestamptz', nullable: true })
  lockedUntil: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}

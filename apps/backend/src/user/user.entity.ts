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
 * - `clinicId` nullable pour les rôles globaux (super_admin, patient auto-inscrit) ;
 *   OBLIGATOIRE pour les rôles rattachés à une clinique (clinic_admin, doctor) — CHECK en base.
 * - FK `clinicId` → clinic.id ON DELETE RESTRICT (on ne supprime pas une clinique
 *   tant qu'elle rattache des utilisateurs).
 *
 * Donnée sensible : ne JAMAIS exposer `passwordHash`, `passwordResetTokenHash`,
 * `failedLoginAttempts`, `lockedUntil` dans une réponse API. Filtrage en place
 * via `select:false` sur `passwordHash` / `passwordResetTokenHash` + le DTO de
 * sortie `toPublicUser` (voir auth-response.dto.ts).
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

  @Column({ name: 'is_self_registered', type: 'boolean', default: false })
  isSelfRegistered: boolean;

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

  /**
   * Hash SHA-256 du jeton de réinitialisation de mot de passe (MEDIPLAN-16).
   *
   * On stocke le HASH du jeton, jamais le jeton en clair : une fuite de la base
   * ne permet pas de réinitialiser un mot de passe. `select:false` aligne ce
   * champ sur `passwordHash` (ne sort jamais d'une requête sans demande explicite).
   */
  @Column({ type: 'text', nullable: true, select: false })
  passwordResetTokenHash: string | null;

  /** Expiration du jeton de réinitialisation (MEDIPLAN-16). NULL = aucun jeton actif. */
  @Column({ type: 'timestamptz', nullable: true })
  passwordResetExpiresAt: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}

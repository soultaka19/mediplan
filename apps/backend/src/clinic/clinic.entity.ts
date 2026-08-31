import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../user/user.entity';

/**
 * Clinique : unité d'isolation multi-tenant. `clinic_id` est porté par `User`
 * pour cloisonner les données entre cliniques (décision archi Phase 2 / OM-05).
 *
 * Colonnes alignées sur l'ERD (`docs/conception/erd/mcd-erd.md`).
 * Le nommage des colonnes (snake_case) est dérivé automatiquement par
 * `SnakeNamingStrategy` ; on ne fixe donc pas `name:` explicitement.
 */
@Entity('clinic')
export class Clinic {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  name: string;

  @Column({ type: 'text', nullable: true })
  address: string | null;

  /** Heure d'ouverture (sans fuseau). Optionnelle tant que non renseignée. */
  @Column({ type: 'time', nullable: true })
  openingHour: string | null;

  /** Heure de fermeture (sans fuseau). */
  @Column({ type: 'time', nullable: true })
  closingHour: string | null;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  /**
   * Clinique de démonstration, créée à la volée pour un visiteur du portfolio.
   * Elle est supprimée automatiquement passé `expiresAt`.
   */
  @Column({ type: 'boolean', default: false })
  isDemo: boolean;

  /**
   * Expiration d'un bac à sable. NULL pour une clinique réelle, qui n'expire
   * jamais — c'est ce qui garantit qu'une purge ne peut pas l'emporter.
   */
  @Column({ type: 'timestamptz', nullable: true })
  expiresAt: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @OneToMany(() => User, (user) => user.clinic)
  users: User[];
}

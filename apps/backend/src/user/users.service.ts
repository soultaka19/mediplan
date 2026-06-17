import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthenticatedUser } from '../auth/auth.types';
import { PublicUser, toPublicUser } from '../auth/dto/auth-response.dto';
import { UserRole } from './user-role.enum';
import { User } from './user.entity';

/**
 * Logique métier de consultation des utilisateurs (MEDIPLAN-17 / EF-09).
 *
 * Porte le SCOPE `clinic_id` du RBAC : c'est ici, et non dans le contrôleur, que
 * l'on restreint les données selon le rôle et la clinique de l'appelant. Toutes les
 * sorties passent par `toPublicUser` pour ne jamais exposer de champ sensible
 * (passwordHash, failedLoginAttempts, lockedUntil, passwordResetTokenHash).
 */
@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /** Récupère un utilisateur par son id (vue publique). 404 si introuvable. */
  async findOneById(id: string): Promise<PublicUser> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('Utilisateur introuvable.');
    }
    return toPublicUser(user);
  }

  /**
   * Liste des utilisateurs selon le périmètre de l'appelant :
   * - `super_admin`  → tous les utilisateurs (aucun filtre clinique) ;
   * - `clinic_admin` → uniquement les utilisateurs de SA clinique ;
   *   si son `clinicId` est `null` (cas anormal), renvoie une liste vide (défensif).
   *
   * L'accès lui-même (rôles autorisés) est garanti en amont par `RolesGuard`
   * + `@Roles(...)` ; ce service applique le filtrage des données.
   */
  async findAllScoped(currentUser: AuthenticatedUser): Promise<PublicUser[]> {
    if (currentUser.role === UserRole.SUPER_ADMIN) {
      const users = await this.userRepository.find();
      return users.map(toPublicUser);
    }

    // clinic_admin : restreint à sa propre clinique.
    if (!currentUser.clinicId) {
      // Un clinic_admin sans clinique ne doit voir personne.
      return [];
    }

    const users = await this.userRepository.find({
      where: { clinicId: currentUser.clinicId },
    });
    return users.map(toPublicUser);
  }
}

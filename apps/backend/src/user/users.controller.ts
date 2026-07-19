import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import type { AuthenticatedUser } from '../auth/auth.types';
import { PublicUser } from '../auth/dto/auth-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ActivateLightPatientDto } from './dto/activate-light-patient.dto';
import { CreateLightPatientDto } from './dto/create-light-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { UserRole } from './user-role.enum';
import { UsersService } from './users.service';

/**
 * Endpoints utilisateurs, exposés sous le préfixe global `/api/v1` (→ `/api/v1/users`).
 *
 * Démontre et applique le RBAC (MEDIPLAN-17 / EF-09) :
 * - GET /users/me : tout utilisateur authentifié (JwtAuthGuard seul) ;
 * - GET /users    : réservé clinic_admin + super_admin (JwtAuthGuard + RolesGuard),
 *   avec scope `clinic_id` appliqué dans le service.
 */
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * Profil de l'utilisateur courant (relu en base par son id). Accessible à tout
   * utilisateur authentifié, quel que soit son rôle. 404 si le compte n'existe plus.
   */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  getMe(@CurrentUser() user: AuthenticatedUser): Promise<PublicUser> {
    return this.usersService.findOneById(user.id);
  }

  /**
   * Liste des utilisateurs (vue publique). Réservée aux administrateurs ; le scope
   * clinique (super_admin = tous, clinic_admin = sa clinique) est appliqué dans le
   * service. patient/doctor sont bloqués en amont par `RolesGuard` (403).
   */
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CLINIC_ADMIN, UserRole.SUPER_ADMIN)
  findAll(@CurrentUser() user: AuthenticatedUser): Promise<PublicUser[]> {
    return this.usersService.findAllScoped(user);
  }

  @Post('light-patients')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CLINIC_ADMIN, UserRole.SUPER_ADMIN)
  createLightPatient(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateLightPatientDto,
  ): Promise<PublicUser> {
    return this.usersService.createLightPatient(user, dto);
  }

  @Post(':id/activate-self-service')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CLINIC_ADMIN, UserRole.SUPER_ADMIN)
  activateLightPatient(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') patientId: string,
    @Body() dto: ActivateLightPatientDto,
  ): Promise<PublicUser> {
    return this.usersService.activateLightPatient(user, patientId, dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CLINIC_ADMIN, UserRole.SUPER_ADMIN)
  updatePatient(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') patientId: string,
    @Body() dto: UpdatePatientDto,
  ): Promise<PublicUser> {
    return this.usersService.updatePatient(user, patientId, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CLINIC_ADMIN, UserRole.SUPER_ADMIN)
  deletePatient(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') patientId: string,
  ): Promise<void> {
    return this.usersService.deletePatient(user, patientId);
  }
}

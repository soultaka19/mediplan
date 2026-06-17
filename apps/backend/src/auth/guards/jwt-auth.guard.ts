import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Guard d'authentification de base : exige un access token JWT valide.
 *
 * S'appuie sur `JwtStrategy`. À appliquer sur tout endpoint protégé via
 * `@UseGuards(JwtAuthGuard)`. Le contrôle des rôles (RolesGuard) est ajouté
 * séparément en MEDIPLAN-17.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}

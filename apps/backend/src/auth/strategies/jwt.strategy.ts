import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthenticatedUser, JwtPayload } from '../auth.types';
import { requireJwtSecret } from '../jwt-secret.util';

/**
 * Stratégie Passport-JWT : valide la signature/expiration du token (HS256) puis
 * peuple `request.user` avec une identité normalisée.
 *
 * Réutilisable par `JwtAuthGuard`. Le RBAC complet (matrice de rôles, scope
 * clinic_id) est hors périmètre ici — voir MEDIPLAN-17.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    // Échec explicite au démarrage si le secret est absent/faible, plutôt que de
    // vérifier des tokens avec un secret vide (source unique : requireJwtSecret).
    const secret = requireJwtSecret(configService);
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  /**
   * Appelée après vérification cryptographique du token. La valeur retournée
   * devient `request.user`.
   */
  validate(payload: JwtPayload): AuthenticatedUser {
    if (!payload?.sub) {
      throw new UnauthorizedException();
    }
    return {
      id: payload.sub,
      role: payload.role,
      clinicId: payload.clinic_id,
      email: payload.email,
    };
  }
}

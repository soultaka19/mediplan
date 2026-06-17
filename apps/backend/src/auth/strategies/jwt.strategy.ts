import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthenticatedUser, JwtPayload } from '../auth.types';

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
    const secret = configService.get<string>('JWT_SECRET');
    if (!secret) {
      // Échec explicite au démarrage plutôt qu'un token signé avec un secret vide.
      throw new Error('JWT_SECRET est manquant : configuration JWT invalide.');
    }
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

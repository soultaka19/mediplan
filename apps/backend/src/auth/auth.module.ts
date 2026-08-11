import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ClinicModule } from '../clinic/clinic.module';
import { UserModule } from '../user/user.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { requireJwtSecret } from './jwt-secret.util';
import { JwtStrategy } from './strategies/jwt.strategy';

/**
 * Module d'authentification (MEDIPLAN-15).
 *
 * - Réutilise le repository User exposé par `UserModule` (pas de redéclaration).
 * - Configure `JwtModule` (secret + expiration depuis l'env) pour la signature
 *   HS256 des access tokens (60 min par défaut, pas de refresh token).
 * - Enregistre `JwtStrategy` (validation des tokens) et exporte `JwtAuthGuard`
 *   via PassportModule pour les futurs modules protégés.
 */
@Module({
  imports: [
    UserModule,
    // Inscription libre-service : la clinique choisie est validée en base.
    ClinicModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService): JwtModuleOptions => {
        const secret = requireJwtSecret(configService);
        const expiresIn = configService.get<string>('JWT_EXPIRES_IN') ?? '60m';
        return {
          secret,
          signOptions: {
            algorithm: 'HS256',
            // Le type `expiresIn` de jsonwebtoken est `number | StringValue` ;
            // la valeur provient de l'env (ex. "60m"), validée à la config.
            expiresIn: expiresIn as unknown as number,
          },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService, PassportModule, JwtModule],
})
export class AuthModule {}

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DemoModule } from './demo/demo.module';
import { HealthController } from './health/health.controller';
import { DatabaseModule } from './database/database.module';
import { ClinicModule } from './clinic/clinic.module';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { AvailabilityModule } from './availability/availability.module';
import { AppointmentsModule } from './appointment/appointments.module';
import { StatisticsModule } from './statistics/statistics.module';
import { NotificationsModule } from './notification/notifications.module';

@Module({
  imports: [
    // Configuration globale : charge le .env racine du monorepo (même fichier
    // que docker-compose). isGlobal => ConfigService injectable partout.
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: join(__dirname, '..', '..', '..', '.env'),
    }),
    // Limitation de débit par adresse IP, appliquée à toutes les routes par le
    // ThrottlerGuard global ci-dessous : filet de sécurité contre les rafales
    // (300 requêtes/min suffisent largement à un usage normal de l'interface).
    // Les endpoints d'authentification portent une limite plus stricte
    // (@Throttle sur AuthController). Derrière le proxy nginx / l'ingress
    // Container Apps, l'adresse vue est celle du proxy : la limite y est donc
    // partagée par tous les clients.
    ThrottlerModule.forRoot({
      throttlers: [{ ttl: 60_000, limit: 300 }],
      errorMessage: 'Trop de requêtes. Réessayez dans une minute.',
    }),
    DatabaseModule,
    ClinicModule,
    UserModule,
    AuthModule,
    AvailabilityModule,
    AppointmentsModule,
    StatisticsModule,
    NotificationsModule,
    DemoModule,
  ],
  controllers: [AppController, HealthController],
  providers: [AppService, { provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthController } from './health/health.controller';
import { DatabaseModule } from './database/database.module';
import { ClinicModule } from './clinic/clinic.module';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { AppointmentsModule } from './appointment/appointments.module';

@Module({
  imports: [
    // Configuration globale : charge le .env racine du monorepo (même fichier
    // que docker-compose). isGlobal => ConfigService injectable partout.
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: join(__dirname, '..', '..', '..', '.env'),
    }),
    DatabaseModule,
    ClinicModule,
    UserModule,
    AuthModule,
    AppointmentsModule,
  ],
  controllers: [AppController, HealthController],
  providers: [AppService],
})
export class AppModule {}

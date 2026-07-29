import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { buildDataSourceOptions } from './data-source-options';

/**
 * Branche TypeORM sur l'application en réutilisant exactement les mêmes options
 * que la CLI de migration (buildDataSourceOptions), alimentées ici par
 * ConfigService au lieu de process.env directement.
 *
 * `synchronize:false` et `migrationsRun:false` sont garantis par les options
 * partagées : le schéma n'est jamais modifié au démarrage de l'app.
 */
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        buildDataSourceOptions({
          DATABASE_URL: configService.get<string>('DATABASE_URL'),
          DB_HOST: configService.get<string>('DB_HOST'),
          DB_PORT: configService.get<string>('DB_PORT'),
          DB_NAME: configService.get<string>('DB_NAME'),
          DB_USER: configService.get<string>('DB_USER'),
          DB_PASSWORD: configService.get<string>('DB_PASSWORD'),
          DB_SSL: configService.get<string>('DB_SSL'),
          DB_SSL_REJECT_UNAUTHORIZED: configService.get<string>('DB_SSL_REJECT_UNAUTHORIZED'),
        }),
    }),
  ],
})
export class DatabaseModule {}

import { join } from 'path';
import { DataSourceOptions } from 'typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';

/**
 * Construit les options TypeORM partagées entre :
 *  - le runtime NestJS (TypeOrmModule.forRootAsync, via ConfigService) ;
 *  - la CLI de migration (data-source.ts, via process.env).
 *
 * Un seul endroit décrit la connexion afin que runtime et CLI restent
 * strictement alignés (mêmes entités, migrations, stratégie de nommage).
 *
 * Les chemins d'entités/migrations sont en glob `.{ts,js}` pour fonctionner
 * aussi bien sous ts-node (CLI, sources .ts) qu'après `nest build` (dist/.js).
 */
export interface DbEnv {
  DB_HOST?: string;
  DB_PORT?: string;
  DB_NAME?: string;
  DB_USER?: string;
  DB_PASSWORD?: string;
}

export function buildDataSourceOptions(env: DbEnv): DataSourceOptions {
  return {
    type: 'postgres',
    host: env.DB_HOST ?? 'localhost',
    port: Number(env.DB_PORT ?? 5432),
    database: env.DB_NAME ?? 'mediplan',
    username: env.DB_USER ?? 'mediplan_app',
    password: env.DB_PASSWORD ?? 'change_me',

    // Schéma piloté UNIQUEMENT par les migrations versionnées (décision Phase 2).
    synchronize: false,
    migrationsRun: false,
    // Les migrations ne s'exécutent que via la CLI explicite, jamais au boot.

    entities: [join(__dirname, '..', '**', '*.entity.{ts,js}')],
    migrations: [join(__dirname, 'migrations', '*.{ts,js}')],

    namingStrategy: new SnakeNamingStrategy(),
    logging: ['error', 'warn', 'migration'],
  };
}

import 'reflect-metadata';
import { config as loadEnv } from 'dotenv';
import { join } from 'path';
import { DataSource } from 'typeorm';
import { buildDataSourceOptions } from './data-source-options';

/**
 * DataSource utilisé par la CLI TypeORM (migration:run / revert / generate).
 *
 * Charge les variables depuis le `.env` à la racine du monorepo (le même que
 * docker-compose), pour rester aligné avec l'environnement applicatif.
 * Au runtime NestJS, ces mêmes options sont reconstruites via ConfigService
 * (voir database.module.ts) — la CLI, elle, lit directement process.env.
 */
// `quiet` : dotenv 17 affiche sinon une bannière (« injected env… tip: … »)
// à chaque commande de migration.
loadEnv({ path: join(__dirname, '..', '..', '..', '..', '.env'), quiet: true });

export default new DataSource(buildDataSourceOptions(process.env));

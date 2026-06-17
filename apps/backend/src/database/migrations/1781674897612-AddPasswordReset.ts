import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Réinitialisation de mot de passe (MEDIPLAN-16, §3.3).
 *
 * Ajoute à la table `user` deux colonnes supportant le flux « jeton » :
 *  - `password_reset_token_hash` : hash SHA-256 du jeton (jamais le jeton en clair) ;
 *  - `password_reset_expires_at` : expiration du jeton (NULL = aucun jeton actif).
 *
 * Réversible : `down()` retire les deux colonnes dans l'ordre inverse.
 * N'altère pas la migration socle (InitAuthSchema).
 */
export class AddPasswordReset1781674897612 implements MigrationInterface {
  name = 'AddPasswordReset1781674897612';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "user"
        ADD COLUMN "password_reset_token_hash" text,
        ADD COLUMN "password_reset_expires_at" timestamptz;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "user"
        DROP COLUMN IF EXISTS "password_reset_expires_at",
        DROP COLUMN IF EXISTS "password_reset_token_hash";
    `);
  }
}

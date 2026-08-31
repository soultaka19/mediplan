import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Bac à sable de démonstration : une clinique jetable par visiteur.
 *
 * Deux colonnes additives sur `clinic`. `expires_at` reste NULL pour les
 * cliniques réelles — c'est ce qui garantit qu'aucune purge ne peut les
 * emporter, même en cas de bogue dans la condition de suppression.
 */
export class AddClinicDemoSandbox1781674897618 implements MigrationInterface {
  name = 'AddClinicDemoSandbox1781674897618';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "clinic"
        ADD COLUMN "is_demo" boolean NOT NULL DEFAULT false,
        ADD COLUMN "expires_at" timestamptz;
    `);

    // Une clinique réelle ne porte jamais d'expiration, et une clinique de
    // démonstration en porte toujours une. La contrainte rend impossible
    // l'état ambigu qui ferait survivre un bac à sable indéfiniment.
    await queryRunner.query(`
      ALTER TABLE "clinic"
        ADD CONSTRAINT "ck_clinic_demo_expires"
        CHECK (("is_demo" = false AND "expires_at" IS NULL)
            OR ("is_demo" = true  AND "expires_at" IS NOT NULL));
    `);

    // La purge cherche les cliniques de démonstration expirées : un index
    // partiel suffit, il n'indexe que les quelques lignes concernées.
    await queryRunner.query(`
      CREATE INDEX "idx_clinic_demo_expires"
        ON "clinic" ("expires_at") WHERE "is_demo" = true;
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "idx_clinic_demo_expires";`);
    await queryRunner.query(`ALTER TABLE "clinic" DROP CONSTRAINT "ck_clinic_demo_expires";`);
    await queryRunner.query(
      `ALTER TABLE "clinic" DROP COLUMN "expires_at", DROP COLUMN "is_demo";`,
    );
  }
}

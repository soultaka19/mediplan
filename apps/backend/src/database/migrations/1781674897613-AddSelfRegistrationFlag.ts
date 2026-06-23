import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSelfRegistrationFlag1781674897613 implements MigrationInterface {
  name = 'AddSelfRegistrationFlag1781674897613';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "user"
        ADD COLUMN "is_self_registered" boolean NOT NULL DEFAULT false;
    `);

    await queryRunner.query(`
      UPDATE "user"
      SET "is_self_registered" = true
      WHERE "role" = 'patient'
        AND "email" IS NOT NULL
        AND "password_hash" IS NOT NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "user"
        DROP COLUMN IF EXISTS "is_self_registered";
    `);
  }
}

import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDoctorConsultationPreference1781674897616 implements MigrationInterface {
  name = 'AddDoctorConsultationPreference1781674897616';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "user"
        ADD COLUMN IF NOT EXISTS "consultation_duration_min" integer NOT NULL DEFAULT 30;
    `);

    await queryRunner.query(`
      ALTER TABLE "user"
        ADD CONSTRAINT "chk_user_consultation_duration"
        CHECK ("consultation_duration_min" BETWEEN 5 AND 240);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "user"
        DROP CONSTRAINT IF EXISTS "chk_user_consultation_duration";
    `);
    await queryRunner.query(`
      ALTER TABLE "user"
        DROP COLUMN IF EXISTS "consultation_duration_min";
    `);
  }
}

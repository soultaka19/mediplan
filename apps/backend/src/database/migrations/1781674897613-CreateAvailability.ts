import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Disponibilités médecins (MEDIPLAN-20).
 *
 * Crée des plages datées concrètes. Les récurrences complexes pourront être
 * ajoutées plus tard au-dessus de ce socle sans bloquer la réservation.
 */
export class CreateAvailability1781674897613 implements MigrationInterface {
  name = 'CreateAvailability1781674897613';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "availability_type" AS ENUM ('available', 'time_off');
    `);

    await queryRunner.query(`
      CREATE TABLE "availability" (
        "id"                uuid                NOT NULL DEFAULT gen_random_uuid(),
        "doctor_id"         uuid                NOT NULL,
        "clinic_id"         uuid                NOT NULL,
        "start_at"          timestamptz         NOT NULL,
        "end_at"            timestamptz         NOT NULL,
        "slot_duration_min" integer             NOT NULL DEFAULT 30,
        "type"              "availability_type" NOT NULL DEFAULT 'available',
        "note"              text,
        "created_at"        timestamptz         NOT NULL DEFAULT now(),
        "updated_at"        timestamptz         NOT NULL DEFAULT now(),
        CONSTRAINT "pk_availability" PRIMARY KEY ("id"),
        CONSTRAINT "chk_availability_time_order" CHECK ("end_at" > "start_at"),
        CONSTRAINT "chk_availability_slot_duration" CHECK ("slot_duration_min" BETWEEN 5 AND 240),
        CONSTRAINT "fk_availability_doctor"
          FOREIGN KEY ("doctor_id") REFERENCES "user" ("id") ON DELETE RESTRICT,
        CONSTRAINT "fk_availability_clinic"
          FOREIGN KEY ("clinic_id") REFERENCES "clinic" ("id") ON DELETE RESTRICT
      );
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_availability_doctor_start"
        ON "availability" ("doctor_id", "start_at");
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_availability_clinic_start"
        ON "availability" ("clinic_id", "start_at");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_availability_clinic_start";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_availability_doctor_start";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "availability";`);
    await queryRunner.query(`DROP TYPE IF EXISTS "availability_type";`);
  }
}

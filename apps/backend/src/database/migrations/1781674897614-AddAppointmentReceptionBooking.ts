import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAppointmentReceptionBooking1781674897614 implements MigrationInterface {
  name = 'AddAppointmentReceptionBooking1781674897614';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "appointment_status" AS ENUM (
        'booked',
        'cancelled',
        'arrived',
        'in_consultation',
        'completed',
        'absent'
      );
    `);

    await queryRunner.query(`
      CREATE TABLE "appointment_slot" (
        "id"         uuid        NOT NULL DEFAULT gen_random_uuid(),
        "clinic_id"  uuid        NOT NULL,
        "doctor_id"  uuid        NOT NULL,
        "start_at"   timestamptz NOT NULL,
        "end_at"     timestamptz NOT NULL,
        "is_booked"  boolean     NOT NULL DEFAULT false,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "pk_appointment_slot" PRIMARY KEY ("id"),
        CONSTRAINT "chk_appointment_slot_time" CHECK ("start_at" < "end_at"),
        CONSTRAINT "fk_appointment_slot_clinic"
          FOREIGN KEY ("clinic_id") REFERENCES "clinic" ("id") ON DELETE RESTRICT,
        CONSTRAINT "fk_appointment_slot_doctor"
          FOREIGN KEY ("doctor_id") REFERENCES "user" ("id") ON DELETE RESTRICT
      );
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_appointment_slot_clinic_start"
        ON "appointment_slot" ("clinic_id", "start_at");
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_appointment_slot_doctor_start"
        ON "appointment_slot" ("doctor_id", "start_at");
    `);

    await queryRunner.query(`
      CREATE TABLE "appointment" (
        "id"                  uuid                 NOT NULL DEFAULT gen_random_uuid(),
        "clinic_id"           uuid                 NOT NULL,
        "slot_id"             uuid                 NOT NULL,
        "patient_id"          uuid                 NOT NULL,
        "doctor_id"           uuid                 NOT NULL,
        "created_by_id"       uuid                 NOT NULL,
        "status"              "appointment_status" NOT NULL DEFAULT 'booked',
        "reason"              text,
        "cancellation_reason" text,
        "created_at"          timestamptz          NOT NULL DEFAULT now(),
        "updated_at"          timestamptz          NOT NULL DEFAULT now(),
        CONSTRAINT "pk_appointment" PRIMARY KEY ("id"),
        CONSTRAINT "uq_appointment_slot_id" UNIQUE ("slot_id"),
        CONSTRAINT "fk_appointment_clinic"
          FOREIGN KEY ("clinic_id") REFERENCES "clinic" ("id") ON DELETE RESTRICT,
        CONSTRAINT "fk_appointment_slot"
          FOREIGN KEY ("slot_id") REFERENCES "appointment_slot" ("id") ON DELETE RESTRICT,
        CONSTRAINT "fk_appointment_patient"
          FOREIGN KEY ("patient_id") REFERENCES "user" ("id") ON DELETE RESTRICT,
        CONSTRAINT "fk_appointment_doctor"
          FOREIGN KEY ("doctor_id") REFERENCES "user" ("id") ON DELETE RESTRICT,
        CONSTRAINT "fk_appointment_created_by"
          FOREIGN KEY ("created_by_id") REFERENCES "user" ("id") ON DELETE RESTRICT
      );
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_appointment_clinic_created"
        ON "appointment" ("clinic_id", "created_at");
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_appointment_patient"
        ON "appointment" ("patient_id");
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_appointment_doctor"
        ON "appointment" ("doctor_id");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_appointment_doctor";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_appointment_patient";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_appointment_clinic_created";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "appointment";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_appointment_slot_doctor_start";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_appointment_slot_clinic_start";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "appointment_slot";`);
    await queryRunner.query(`DROP TYPE IF EXISTS "appointment_status";`);
  }
}

import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateNotification1781674897617 implements MigrationInterface {
  name = 'CreateNotification1781674897617';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "notification_type" AS ENUM (
        'appointment_booked',
        'appointment_cancelled',
        'appointment_updated'
      );
    `);

    await queryRunner.query(`
      CREATE TABLE "notification" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "recipient_id" uuid NOT NULL,
        "clinic_id" uuid,
        "type" "notification_type" NOT NULL,
        "title" text NOT NULL,
        "message" text NOT NULL,
        "action_url" text,
        "read_at" timestamptz,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "pk_notification" PRIMARY KEY ("id"),
        CONSTRAINT "fk_notification_recipient"
          FOREIGN KEY ("recipient_id") REFERENCES "user" ("id") ON DELETE CASCADE,
        CONSTRAINT "fk_notification_clinic"
          FOREIGN KEY ("clinic_id") REFERENCES "clinic" ("id") ON DELETE CASCADE
      );
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_notification_recipient_created"
        ON "notification" ("recipient_id", "created_at");
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_notification_recipient_read"
        ON "notification" ("recipient_id", "read_at");
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_notification_recipient_read";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_notification_recipient_created";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "notification";`);
    await queryRunner.query(`DROP TYPE IF EXISTS "notification_type";`);
  }
}

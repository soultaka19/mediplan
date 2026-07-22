import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Unicité `(doctor_id, start_at)` sur `appointment_slot`.
 *
 * Prérequis à la matérialisation des créneaux réservables : garantit qu'un même
 * médecin n'a qu'une seule ligne de créneau pour un horaire de début donné.
 * Rend le `upsert` de matérialisation idempotent et sûr en concurrence (deux
 * réceptions ne peuvent pas créer deux créneaux distincts pour le même horaire,
 * ce qui contournerait l'index anti-double-booking sur `appointment(slot_id)`).
 */
export class AddSlotUniqueDoctorStart1781674897616 implements MigrationInterface {
  name = 'AddSlotUniqueDoctorStart1781674897616';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "appointment_slot"
        ADD CONSTRAINT "uq_appointment_slot_doctor_start" UNIQUE ("doctor_id", "start_at");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "appointment_slot"
        DROP CONSTRAINT "uq_appointment_slot_doctor_start";
    `);
  }
}

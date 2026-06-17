import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration socle — fondations de données pour l'authentification (MEDIPLAN-15).
 *
 * Crée UNIQUEMENT les tables `clinic` et `user` ainsi que le type enum
 * `user_role`. Les tables specialty / doctor_specialty / availability /
 * appointment* relèvent d'autres tickets (MEDIPLAN-34, etc.).
 *
 * Ordre d'application : extensions → enum → clinic → user.
 * Le `down()` défait dans l'ordre inverse (user → clinic → enum) ; les
 * extensions sont laissées en place (potentiellement partagées, non destructives).
 */
export class InitAuthSchema1781674897611 implements MigrationInterface {
  name = 'InitAuthSchema1781674897611';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // --- Extensions ---
    // pgcrypto : fournit gen_random_uuid() pour les PK générées en base.
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto";`);
    // citext : type texte insensible à la casse, utilisé pour les emails.
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "citext";`);

    // --- Type enum natif des rôles ---
    await queryRunner.query(`
      CREATE TYPE "user_role" AS ENUM (
        'super_admin',
        'clinic_admin',
        'doctor',
        'patient'
      );
    `);

    // --- Table clinic ---
    await queryRunner.query(`
      CREATE TABLE "clinic" (
        "id"           uuid        NOT NULL DEFAULT gen_random_uuid(),
        "name"         text        NOT NULL,
        "address"      text,
        "opening_hour" time,
        "closing_hour" time,
        "is_active"    boolean     NOT NULL DEFAULT true,
        "created_at"   timestamptz NOT NULL DEFAULT now(),
        "updated_at"   timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "pk_clinic" PRIMARY KEY ("id")
      );
    `);

    // --- Table user ---
    await queryRunner.query(`
      CREATE TABLE "user" (
        "id"                    uuid        NOT NULL DEFAULT gen_random_uuid(),
        -- email nullable (décision Phase 2) : prépare le « patient léger »
        -- (MEDIPLAN-35) créé sans compte. L'inscription libre-service exige
        -- l'email au niveau du DTO. L'index unique tolère les NULL multiples.
        "email"                 citext,
        "password_hash"         text,
        "first_name"            text,
        "last_name"             text,
        "role"                  "user_role" NOT NULL,
        "clinic_id"             uuid,
        "is_active"             boolean     NOT NULL DEFAULT true,
        "failed_login_attempts" integer     NOT NULL DEFAULT 0,
        "locked_until"          timestamptz,
        "created_at"            timestamptz NOT NULL DEFAULT now(),
        "updated_at"            timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "pk_user" PRIMARY KEY ("id"),
        -- super_admin : clinic_id peut être NULL ; tout autre rôle : clinic_id obligatoire.
        CONSTRAINT "chk_user_clinic_required"
          CHECK ("role" = 'super_admin' OR "clinic_id" IS NOT NULL),
        CONSTRAINT "fk_user_clinic"
          FOREIGN KEY ("clinic_id") REFERENCES "clinic" ("id") ON DELETE RESTRICT
      );
    `);

    // Unicité de l'email insensible à la casse (citext) tolérant les NULL multiples.
    // Un index UNIQUE B-tree standard autorise déjà plusieurs lignes à email NULL
    // sous PostgreSQL ; il couvre aussi la recherche par email (login).
    await queryRunner.query(`
      CREATE UNIQUE INDEX "uq_user_email" ON "user" ("email");
    `);

    // Index sur la FK clinic_id : accélère le filtrage multi-tenant (RBAC scope).
    await queryRunner.query(`
      CREATE INDEX "idx_user_clinic_id" ON "user" ("clinic_id");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_user_clinic_id";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "uq_user_email";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "user";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "clinic";`);
    await queryRunner.query(`DROP TYPE IF EXISTS "user_role";`);
    // Extensions pgcrypto / citext volontairement conservées.
  }
}

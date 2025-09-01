import { MigrationInterface, QueryRunner } from "typeorm";

export class MovePersonalFieldsToPreferences1735490000000
  implements MigrationInterface
{
  name = "MovePersonalFieldsToPreferences1735490000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Columns already exist, so just migrate the data

    // Migrate existing data from users to preferences
    // Only migrate for users who have preferences entries and who are not operators
    await queryRunner.query(`
      UPDATE "preferences" 
      SET 
        "hobbies" = "users"."hobbies",
        "ideal_living_environment" = "users"."ideal_living_environment",
        "pets" = "users"."pets", 
        "smoker" = "users"."smoker",
        "additional_info" = "users"."additional_info"
      FROM "users"
      WHERE "preferences"."user_id" = "users"."id"
      AND "users"."is_operator" = false
    `);

    // For users who don't have preferences yet but are tenants, create preferences entries
    await queryRunner.query(`
      INSERT INTO "preferences" ("user_id", "hobbies", "ideal_living_environment", "pets", "smoker", "additional_info", "created_at", "updated_at")
      SELECT 
        "users"."id",
        "users"."hobbies",
        "users"."ideal_living_environment", 
        "users"."pets",
        "users"."smoker",
        "users"."additional_info",
        NOW(),
        NOW()
      FROM "users"
      LEFT JOIN "preferences" ON "preferences"."user_id" = "users"."id"
      WHERE "users"."is_operator" = false 
      AND "preferences"."id" IS NULL
      AND (
        "users"."hobbies" IS NOT NULL 
        OR "users"."ideal_living_environment" IS NOT NULL
        OR "users"."pets" IS NOT NULL 
        OR "users"."smoker" IS NOT NULL
        OR "users"."additional_info" IS NOT NULL
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Migrate data back to users table (in case of rollback)
    await queryRunner.query(`
      UPDATE "users"
      SET 
        "hobbies" = COALESCE("preferences"."hobbies", "users"."hobbies"),
        "ideal_living_environment" = COALESCE("preferences"."ideal_living_environment", "users"."ideal_living_environment"),
        "pets" = COALESCE("preferences"."pets", "users"."pets"),
        "smoker" = COALESCE("preferences"."smoker", "users"."smoker"),
        "additional_info" = COALESCE("preferences"."additional_info", "users"."additional_info")
      FROM "preferences"
      WHERE "preferences"."user_id" = "users"."id"
    `);

    // Clear the migrated data from preferences table
    await queryRunner.query(`
      UPDATE "preferences" 
      SET 
        "hobbies" = NULL,
        "ideal_living_environment" = NULL,
        "pets" = NULL,
        "smoker" = NULL,
        "additional_info" = NULL
    `);
  }
}

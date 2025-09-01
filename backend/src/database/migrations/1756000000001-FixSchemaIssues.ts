import { MigrationInterface, QueryRunner } from "typeorm";

export class FixSchemaIssues1756000000001 implements MigrationInterface {
  name = "FixSchemaIssues1756000000001";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add full_name column to users table for backward compatibility
    await queryRunner.query(`
            ALTER TABLE "users" 
            ADD COLUMN "full_name" character varying
        `);

    // Add property_type column to properties table for backward compatibility
    await queryRunner.query(`
            ALTER TABLE "properties" 
            ADD COLUMN "property_type" character varying
        `);

    // Update property_type based on property_types array
    await queryRunner.query(`
            UPDATE "properties" 
            SET "property_type" = COALESCE("property_types"[1], 'apartment')
            WHERE "property_type" IS NULL
        `);

    // Update full_name in users table from profiles
    await queryRunner.query(`
            UPDATE "users" 
            SET "full_name" = tp.full_name
            FROM "tenant_profiles" tp
            WHERE tp."userId" = "users"."id" 
            AND tp.full_name IS NOT NULL
        `);

    await queryRunner.query(`
            UPDATE "users" 
            SET "full_name" = op.full_name
            FROM "operator_profiles" op
            WHERE op."userId" = "users"."id" 
            AND op.full_name IS NOT NULL
            AND "users"."full_name" IS NULL
        `);

    // Create indexes for better performance
    await queryRunner.query(
      `CREATE INDEX "IDX_users_full_name" ON "users" ("full_name")`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_properties_property_type" ON "properties" ("property_type")`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX "IDX_properties_property_type"`);
    await queryRunner.query(`DROP INDEX "IDX_users_full_name"`);

    // Drop columns
    await queryRunner.query(
      `ALTER TABLE "properties" DROP COLUMN "property_type"`
    );
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "full_name"`);
  }
}

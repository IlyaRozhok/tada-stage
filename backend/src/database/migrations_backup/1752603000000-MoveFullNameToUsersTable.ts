import { MigrationInterface, QueryRunner } from "typeorm";

export class MoveFullNameToUsersTable1752603000000
  implements MigrationInterface
{
  name = "MoveFullNameToUsersTable1752603000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if full_name column exists, if not - add it
    const hasFullNameColumn = await queryRunner.hasColumn("users", "full_name");

    if (!hasFullNameColumn) {
      await queryRunner.query(`
                ALTER TABLE "users" ADD "full_name" character varying
            `);
      console.log("✅ Added full_name column to users table");
    } else {
      console.log("ℹ️  full_name column already exists in users table");
    }

    // Copy full_name from tenant_profiles to users (only if users.full_name is null)
    await queryRunner.query(`
            UPDATE "users" 
            SET "full_name" = "tenant_profiles"."full_name"
            FROM "tenant_profiles"
            WHERE "users"."id" = "tenant_profiles"."userId"
            AND "users"."role" = 'tenant'
            AND ("users"."full_name" IS NULL OR "users"."full_name" = '')
            AND "tenant_profiles"."full_name" IS NOT NULL
        `);

    // Copy full_name from operator_profiles to users (only if users.full_name is null)
    await queryRunner.query(`
            UPDATE "users"
            SET "full_name" = "operator_profiles"."full_name"
            FROM "operator_profiles"
            WHERE "users"."id" = "operator_profiles"."userId"
            AND "users"."role" = 'operator'
            AND ("users"."full_name" IS NULL OR "users"."full_name" = '')
            AND "operator_profiles"."full_name" IS NOT NULL
        `);

    console.log("✅ Copied full_name data from profiles to users table");

    // Remove full_name from tenant_profiles (optional - can be done later)
    // await queryRunner.query(`
    //     ALTER TABLE "tenant_profiles" DROP COLUMN "full_name"
    // `);

    // Remove full_name from operator_profiles (optional - can be done later)
    // await queryRunner.query(`
    //     ALTER TABLE "operator_profiles" DROP COLUMN "full_name"
    // `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Restore full_name columns in profiles if they were removed
    // await queryRunner.query(`
    //     ALTER TABLE "tenant_profiles" ADD "full_name" character varying
    // `);

    // await queryRunner.query(`
    //     ALTER TABLE "operator_profiles" ADD "full_name" character varying
    // `);

    // Copy full_name back from users to tenant_profiles
    await queryRunner.query(`
            UPDATE "tenant_profiles"
            SET "full_name" = "users"."full_name"
            FROM "users"
            WHERE "tenant_profiles"."userId" = "users"."id"
            AND "users"."role" = 'tenant'
            AND "users"."full_name" IS NOT NULL
        `);

    // Copy full_name back from users to operator_profiles
    await queryRunner.query(`
            UPDATE "operator_profiles"
            SET "full_name" = "users"."full_name"
            FROM "users"
            WHERE "operator_profiles"."userId" = "users"."id"
            AND "users"."role" = 'operator'
            AND "users"."full_name" IS NOT NULL
        `);

    // Remove full_name from users table if it exists
    const hasFullNameColumn = await queryRunner.hasColumn("users", "full_name");
    if (hasFullNameColumn) {
      await queryRunner.query(`
                ALTER TABLE "users" DROP COLUMN "full_name"
            `);
      console.log("✅ Removed full_name column from users table");
    }
  }
}

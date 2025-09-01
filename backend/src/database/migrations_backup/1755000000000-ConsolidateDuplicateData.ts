import { MigrationInterface, QueryRunner } from "typeorm";

export class ConsolidateDuplicateData1755000000000 implements MigrationInterface {
    name = 'ConsolidateDuplicateData1755000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Step 1: Consolidate hobbies and pets data from tenant_profiles to preferences

        // First, ensure preferences exist for all users who have tenant profiles
        await queryRunner.query(`
            INSERT INTO "preferences" ("user_id", "created_at", "updated_at")
            SELECT tp."userId", tp."created_at", tp."updated_at"
            FROM "tenant_profiles" tp
            LEFT JOIN "preferences" p ON p."user_id" = tp."userId"
            WHERE p."id" IS NULL
        `);

        // Consolidate hobbies: Move from tenant_profiles to preferences (only if preferences.hobbies is null)
        await queryRunner.query(`
            UPDATE "preferences"
            SET "hobbies" = tp."hobbies"
            FROM "tenant_profiles" tp
            WHERE "preferences"."user_id" = tp."userId"
            AND tp."hobbies" IS NOT NULL
            AND tp."hobbies" != ''
            AND ("preferences"."hobbies" IS NULL OR "preferences"."hobbies" = '')
        `);

        // Consolidate pets: Move from tenant_profiles to preferences
        // Convert tenant_profile pets format to preferences format
        await queryRunner.query(`
            UPDATE "preferences"
            SET "pets" = CASE
                WHEN tp."pets" = 'None' THEN 'none'
                WHEN tp."pets" = 'Cat' THEN 'cat'
                WHEN tp."pets" = 'Dog' THEN 'dog'
                WHEN tp."pets" = 'Other' THEN 'small-pets'
                ELSE 'none'
            END
            FROM "tenant_profiles" tp
            WHERE "preferences"."user_id" = tp."userId"
            AND tp."pets" IS NOT NULL
            AND ("preferences"."pets" IS NULL OR "preferences"."pets" = '')
        `);

        // Consolidate smoker information: Convert boolean to string format
        await queryRunner.query(`
            UPDATE "preferences"
            SET "smoker" = CASE
                WHEN tp."smoker" = true THEN 'yes'
                WHEN tp."smoker" = false THEN 'no'
                ELSE 'no-preference'
            END
            FROM "tenant_profiles" tp
            WHERE "preferences"."user_id" = tp."userId"
            AND ("preferences"."smoker" IS NULL OR "preferences"."smoker" = '')
        `);

        // Step 2: Remove full_name from users table (keep in profiles)
        // First, ensure all users with profiles have full_name in their profile
        await queryRunner.query(`
            UPDATE "tenant_profiles"
            SET "full_name" = u."full_name"
            FROM "users" u
            WHERE "tenant_profiles"."userId" = u."id"
            AND u."full_name" IS NOT NULL
            AND ("tenant_profiles"."full_name" IS NULL OR "tenant_profiles"."full_name" = '')
        `);

        await queryRunner.query(`
            UPDATE "operator_profiles"
            SET "full_name" = u."full_name"
            FROM "users" u
            WHERE "operator_profiles"."userId" = u."id"
            AND u."full_name" IS NOT NULL
            AND ("operator_profiles"."full_name" IS NULL OR "operator_profiles"."full_name" = '')
        `);

        // Step 3: Update property types to be consistent (array format)
        // Add temporary column for properties
        await queryRunner.query(`
            ALTER TABLE "properties"
            ADD COLUMN "property_types_temp" text[]
        `);

        // Convert single property_type to array
        await queryRunner.query(`
            UPDATE "properties"
            SET "property_types_temp" =
                CASE
                    WHEN "property_type" IS NOT NULL AND "property_type" != ''
                    THEN ARRAY["property_type"]
                    ELSE ARRAY[]::text[]
                END
        `);

        // Step 4: Add missing fields that should exist
        // Add date_of_birth to operator_profiles for consistency
        await queryRunner.query(`
            ALTER TABLE "operator_profiles"
            ADD COLUMN "date_of_birth" date
        `);

        // Add nationality to operator_profiles for consistency
        await queryRunner.query(`
            ALTER TABLE "operator_profiles"
            ADD COLUMN "nationality" character varying
        `);

        // Step 5: Remove duplicate columns from tenant_profiles
        await queryRunner.query(`ALTER TABLE "tenant_profiles" DROP COLUMN IF EXISTS "hobbies"`);
        await queryRunner.query(`ALTER TABLE "tenant_profiles" DROP COLUMN IF EXISTS "pets"`);
        await queryRunner.query(`ALTER TABLE "tenant_profiles" DROP COLUMN IF EXISTS "smoker"`);

        // Step 6: Update properties table structure
        // Drop old column and rename new one
        await queryRunner.query(`ALTER TABLE "properties" DROP COLUMN "property_type"`);
        await queryRunner.query(`
            ALTER TABLE "properties"
            RENAME COLUMN "property_types_temp" TO "property_types"
        `);

        // Step 7: Remove full_name from users table
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "full_name"`);

        // Step 8: Add constraints for data integrity
        await queryRunner.query(`
            ALTER TABLE "properties"
            ADD CONSTRAINT "chk_price_positive"
            CHECK ("price" > 0)
        `);

        await queryRunner.query(`
            ALTER TABLE "properties"
            ADD CONSTRAINT "chk_bedrooms_positive"
            CHECK ("bedrooms" >= 0)
        `);

        await queryRunner.query(`
            ALTER TABLE "properties"
            ADD CONSTRAINT "chk_bathrooms_positive"
            CHECK ("bathrooms" >= 0)
        `);

        await queryRunner.query(`
            ALTER TABLE "preferences"
            ADD CONSTRAINT "chk_price_range_valid"
            CHECK ("min_price" IS NULL OR "max_price" IS NULL OR "min_price" <= "max_price")
        `);

        await queryRunner.query(`
            ALTER TABLE "preferences"
            ADD CONSTRAINT "chk_bedroom_range_valid"
            CHECK ("min_bedrooms" IS NULL OR "max_bedrooms" IS NULL OR "min_bedrooms" <= "max_bedrooms")
        `);

        // Step 9: Create indexes for better performance
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "idx_users_email_status"
            ON "users" ("email", "status")
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "idx_properties_price_bedrooms"
            ON "properties" ("price", "bedrooms")
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "idx_properties_available_from"
            ON "properties" ("available_from")
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "idx_shortlist_user_created"
            ON "shortlist" ("userId", "created_at" DESC)
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "idx_favourites_user_created"
            ON "favourites" ("userId", "created_at" DESC)
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Step 1: Drop indexes
        await queryRunner.query(`DROP INDEX IF EXISTS "idx_favourites_user_created"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "idx_shortlist_user_created"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "idx_properties_available_from"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "idx_properties_price_bedrooms"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "idx_users_email_status"`);

        // Step 2: Drop constraints
        await queryRunner.query(`
            ALTER TABLE "preferences"
            DROP CONSTRAINT IF EXISTS "chk_bedroom_range_valid"
        `);

        await queryRunner.query(`
            ALTER TABLE "preferences"
            DROP CONSTRAINT IF EXISTS "chk_price_range_valid"
        `);

        await queryRunner.query(`
            ALTER TABLE "properties"
            DROP CONSTRAINT IF EXISTS "chk_bathrooms_positive"
        `);

        await queryRunner.query(`
            ALTER TABLE "properties"
            DROP CONSTRAINT IF EXISTS "chk_bedrooms_positive"
        `);

        await queryRunner.query(`
            ALTER TABLE "properties"
            DROP CONSTRAINT IF EXISTS "chk_price_positive"
        `);

        // Step 3: Restore full_name to users table
        await queryRunner.query(`ALTER TABLE "users" ADD "full_name" character varying`);

        // Restore full_name from profiles
        await queryRunner.query(`
            UPDATE "users"
            SET "full_name" = tp."full_name"
            FROM "tenant_profiles" tp
            WHERE "users"."id" = tp."userId"
            AND tp."full_name" IS NOT NULL
        `);

        await queryRunner.query(`
            UPDATE "users"
            SET "full_name" = op."full_name"
            FROM "operator_profiles" op
            WHERE "users"."id" = op."userId"
            AND op."full_name" IS NOT NULL
            AND "users"."full_name" IS NULL
        `);

        // Step 4: Restore property_type as single string
        await queryRunner.query(`
            ALTER TABLE "properties"
            ADD COLUMN "property_type" character varying
        `);

        // Convert array back to single value (take first element)
        await queryRunner.query(`
            UPDATE "properties"
            SET "property_type" =
                CASE
                    WHEN "property_types" IS NOT NULL AND array_length("property_types", 1) > 0
                    THEN "property_types"[1]
                    ELSE 'apartment'
                END
        `);

        await queryRunner.query(`ALTER TABLE "properties" DROP COLUMN "property_types"`);

        // Step 5: Restore duplicate fields to tenant_profiles
        await queryRunner.query(`ALTER TABLE "tenant_profiles" ADD "hobbies" text`);
        await queryRunner.query(`ALTER TABLE "tenant_profiles" ADD "pets" character varying`);
        await queryRunner.query(`
            ALTER TABLE "tenant_profiles"
            ADD "smoker" boolean NOT NULL DEFAULT false
        `);

        // Restore data from preferences
        await queryRunner.query(`
            UPDATE "tenant_profiles"
            SET "hobbies" = p."hobbies"
            FROM "preferences" p
            WHERE "tenant_profiles"."userId" = p."user_id"
            AND p."hobbies" IS NOT NULL
        `);

        await queryRunner.query(`
            UPDATE "tenant_profiles"
            SET "pets" = CASE
                WHEN p."pets" = 'none' THEN 'None'
                WHEN p."pets" = 'cat' THEN 'Cat'
                WHEN p."pets" = 'dog' THEN 'Dog'
                WHEN p."pets" = 'small-pets' THEN 'Other'
                ELSE 'None'
            END
            FROM "preferences" p
            WHERE "tenant_profiles"."userId" = p."user_id"
            AND p."pets" IS NOT NULL
        `);

        await queryRunner.query(`
            UPDATE "tenant_profiles"
            SET "smoker" = CASE
                WHEN p."smoker" = 'yes' THEN true
                WHEN p."smoker" = 'no' THEN false
                ELSE false
            END
            FROM "preferences" p
            WHERE "tenant_profiles"."userId" = p."user_id"
            AND p."smoker" IS NOT NULL
        `);

        // Step 6: Remove added fields from operator_profiles
        await queryRunner.query(`ALTER TABLE "operator_profiles" DROP COLUMN IF EXISTS "nationality"`);
        await queryRunner.query(`ALTER TABLE "operator_profiles" DROP COLUMN IF EXISTS "date_of_birth"`);
    }
}

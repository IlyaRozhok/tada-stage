import { MigrationInterface, QueryRunner } from "typeorm";

export class FixPropertyTypeConsistency1755100000000 implements MigrationInterface {
    name = 'FixPropertyTypeConsistency1755100000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Step 1: Fix Property entity - change property_type from string to array

        // Add new column for property types as array
        await queryRunner.query(`
            ALTER TABLE "properties"
            ADD COLUMN "property_types" text[]
        `);

        // Convert existing single property_type values to arrays
        await queryRunner.query(`
            UPDATE "properties"
            SET "property_types" =
                CASE
                    WHEN "property_type" IS NOT NULL AND "property_type" != ''
                    THEN string_to_array("property_type", ',')
                    ELSE ARRAY[]::text[]
                END
        `);

        // Handle common property types that might be stored as single values
        await queryRunner.query(`
            UPDATE "properties"
            SET "property_types" = ARRAY["property_type"]
            WHERE "property_type" IS NOT NULL
            AND "property_type" != ''
            AND array_length("property_types", 1) IS NULL
        `);

        // Drop the old single property_type column
        await queryRunner.query(`
            ALTER TABLE "properties"
            DROP COLUMN "property_type"
        `);

        // Step 2: Ensure Preferences property_type is properly formatted as array
        // Check if property_type in preferences is still stored as simple-array (comma-separated)
        // and convert to proper array format if needed

        // First, let's check the current column type
        const preferencesTable = await queryRunner.getTable("preferences");
        const propertyTypeColumn = preferencesTable?.findColumnByName("property_type");

        if (propertyTypeColumn && propertyTypeColumn.type !== 'text[]') {
            // Add temporary column for array format
            await queryRunner.query(`
                ALTER TABLE "preferences"
                ADD COLUMN "property_types_temp" text[]
            `);

            // Convert simple-array (comma-separated) to proper array
            await queryRunner.query(`
                UPDATE "preferences"
                SET "property_types_temp" =
                    CASE
                        WHEN "property_type" IS NOT NULL AND "property_type" != ''
                        THEN string_to_array("property_type", ',')
                        ELSE NULL
                    END
            `);

            // Drop old column
            await queryRunner.query(`
                ALTER TABLE "preferences"
                DROP COLUMN "property_type"
            `);

            // Rename new column
            await queryRunner.query(`
                ALTER TABLE "preferences"
                RENAME COLUMN "property_types_temp" TO "property_type"
            `);
        }

        // Step 3: Add validation constraints for property types
        await queryRunner.query(`
            ALTER TABLE "properties"
            ADD CONSTRAINT "chk_property_types_not_empty"
            CHECK (array_length("property_types", 1) > 0)
        `);

        // Step 4: Create index for property types search
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "idx_properties_property_types"
            ON "properties" USING GIN ("property_types")
        `);

        // Step 5: Create index for preferences property types search
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "idx_preferences_property_type"
            ON "preferences" USING GIN ("property_type")
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Step 1: Drop indexes
        await queryRunner.query(`DROP INDEX IF EXISTS "idx_preferences_property_type"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "idx_properties_property_types"`);

        // Step 2: Drop constraints
        await queryRunner.query(`
            ALTER TABLE "properties"
            DROP CONSTRAINT IF EXISTS "chk_property_types_not_empty"
        `);

        // Step 3: Restore single property_type column in properties
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

        // Drop the array column
        await queryRunner.query(`
            ALTER TABLE "properties"
            DROP COLUMN "property_types"
        `);

        // Step 4: Restore preferences property_type to simple-array format
        // Add temporary column
        await queryRunner.query(`
            ALTER TABLE "preferences"
            ADD COLUMN "property_type_temp" text
        `);

        // Convert array to comma-separated string
        await queryRunner.query(`
            UPDATE "preferences"
            SET "property_type_temp" =
                CASE
                    WHEN "property_type" IS NOT NULL AND array_length("property_type", 1) > 0
                    THEN array_to_string("property_type", ',')
                    ELSE NULL
                END
        `);

        // Drop array column
        await queryRunner.query(`
            ALTER TABLE "preferences"
            DROP COLUMN "property_type"
        `);

        // Rename back
        await queryRunner.query(`
            ALTER TABLE "preferences"
            RENAME COLUMN "property_type_temp" TO "property_type"
        `);
    }
}

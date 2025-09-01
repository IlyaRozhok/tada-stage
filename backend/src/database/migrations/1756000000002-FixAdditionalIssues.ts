import { MigrationInterface, QueryRunner } from "typeorm";

export class FixAdditionalIssues1756000000002 implements MigrationInterface {
  name = "FixAdditionalIssues1756000000002";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Ensure property_types column exists and is properly formatted
    await queryRunner.query(`
            DO $$
            BEGIN
                -- Check if property_types column exists
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'properties' 
                    AND column_name = 'property_types'
                ) THEN
                    ALTER TABLE "properties" ADD COLUMN "property_types" text[];
                END IF;
            END $$;
        `);

    // Ensure property_types is not null and has default value
    await queryRunner.query(`
            UPDATE "properties" 
            SET "property_types" = ARRAY['apartment']
            WHERE "property_types" IS NULL
        `);

    // Add NOT NULL constraint to property_types
    await queryRunner.query(`
            ALTER TABLE "properties" 
            ALTER COLUMN "property_types" SET NOT NULL
        `);

    // Add default value for property_types
    await queryRunner.query(`
            ALTER TABLE "properties" 
            ALTER COLUMN "property_types" SET DEFAULT ARRAY['apartment']
        `);

    // Ensure lifestyle_features is properly formatted as simple-array
    await queryRunner.query(`
            DO $$
            BEGIN
                -- Check if lifestyle_features column exists and is text type
                IF EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'properties' 
                    AND column_name = 'lifestyle_features'
                    AND data_type = 'text'
                ) THEN
                    -- Convert text to simple-array format if needed
                    UPDATE "properties" 
                    SET "lifestyle_features" = string_to_array("lifestyle_features", ',')
                    WHERE "lifestyle_features" IS NOT NULL 
                    AND "lifestyle_features" != ''
                    AND "lifestyle_features" NOT LIKE '%,%';
                END IF;
            END $$;
        `);

    // Add indexes for better performance
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_properties_property_types_gin" ON "properties" USING GIN ("property_types")`
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_properties_lifestyle_features" ON "properties" ("lifestyle_features")`
    );

    // Add indexes for preferences
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_preferences_property_type_gin" ON "preferences" USING GIN ("property_type")`
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_preferences_user_id" ON "preferences" ("user_id")`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_preferences_user_id"`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_preferences_property_type_gin"`
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_properties_lifestyle_features"`
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_properties_property_types_gin"`
    );

    // Remove default and NOT NULL constraints
    await queryRunner.query(`
            ALTER TABLE "properties" 
            ALTER COLUMN "property_types" DROP NOT NULL
        `);

    await queryRunner.query(`
            ALTER TABLE "properties" 
            ALTER COLUMN "property_types" DROP DEFAULT
        `);
  }
}

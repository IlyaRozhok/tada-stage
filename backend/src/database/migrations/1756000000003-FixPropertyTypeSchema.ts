import { MigrationInterface, QueryRunner } from "typeorm";

export class FixPropertyTypeSchema1756000000003 implements MigrationInterface {
  name = "FixPropertyTypeSchema1756000000003";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop the property_types column if it exists
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'properties' 
          AND column_name = 'property_types'
        ) THEN
          ALTER TABLE "properties" DROP COLUMN "property_types";
        END IF;
      END $$;
    `);

    // Ensure property_type column exists and is properly configured
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'properties' 
          AND column_name = 'property_type'
        ) THEN
          ALTER TABLE "properties" ADD COLUMN "property_type" character varying NOT NULL DEFAULT 'apartment';
        ELSE
          -- Update existing property_type to be NOT NULL with default
          ALTER TABLE "properties" ALTER COLUMN "property_type" SET NOT NULL;
          ALTER TABLE "properties" ALTER COLUMN "property_type" SET DEFAULT 'apartment';
        END IF;
      END $$;
    `);

    // Update any NULL values to default
    await queryRunner.query(`
      UPDATE "properties" 
      SET "property_type" = 'apartment'
      WHERE "property_type" IS NULL
    `);

    // Drop old indexes related to property_types
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_properties_property_types_gin"`
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_properties_property_type"`
    );

    // Create new index for property_type
    await queryRunner.query(
      `CREATE INDEX "IDX_properties_property_type" ON "properties" ("property_type")`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop the new index
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_properties_property_type"`
    );

    // Recreate property_types column
    await queryRunner.query(`
      ALTER TABLE "properties" 
      ADD COLUMN "property_types" text[] DEFAULT ARRAY['apartment']
    `);

    // Convert property_type back to property_types array
    await queryRunner.query(`
      UPDATE "properties" 
      SET "property_types" = ARRAY["property_type"]
      WHERE "property_type" IS NOT NULL
    `);

    // Make property_types NOT NULL
    await queryRunner.query(`
      ALTER TABLE "properties" 
      ALTER COLUMN "property_types" SET NOT NULL
    `);

    // Drop property_type column
    await queryRunner.query(
      `ALTER TABLE "properties" DROP COLUMN "property_type"`
    );

    // Recreate old indexes
    await queryRunner.query(
      `CREATE INDEX "IDX_properties_property_types_gin" ON "properties" USING GIN ("property_types")`
    );
  }
}

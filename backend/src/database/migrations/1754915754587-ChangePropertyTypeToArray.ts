import { MigrationInterface, QueryRunner } from "typeorm";

export class ChangePropertyTypeToArray1754915754587
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // First, add a new column for the array
    await queryRunner.query(`
            ALTER TABLE "preferences" 
            ADD COLUMN "property_type_temp" text[] DEFAULT NULL
        `);

    // Convert existing single values to arrays
    await queryRunner.query(`
            UPDATE "preferences" 
            SET "property_type_temp" = 
                CASE 
                    WHEN "property_type" IS NOT NULL AND "property_type" != ''
                    THEN ARRAY["property_type"]
                    ELSE NULL
                END
        `);

    // Drop the old column
    await queryRunner.query(`
            ALTER TABLE "preferences" 
            DROP COLUMN "property_type"
        `);

    // Rename the new column to the original name
    await queryRunner.query(`
            ALTER TABLE "preferences" 
            RENAME COLUMN "property_type_temp" TO "property_type"
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Add a temporary column for the string
    await queryRunner.query(`
            ALTER TABLE "preferences" 
            ADD COLUMN "property_type_temp" varchar(255) DEFAULT NULL
        `);

    // Convert array back to single value (take first element)
    await queryRunner.query(`
            UPDATE "preferences" 
            SET "property_type_temp" = 
                CASE 
                    WHEN "property_type" IS NOT NULL AND array_length("property_type", 1) > 0
                    THEN "property_type"[1]
                    ELSE NULL
                END
        `);

    // Drop the array column
    await queryRunner.query(`
            ALTER TABLE "preferences" 
            DROP COLUMN "property_type"
        `);

    // Rename back to original name
    await queryRunner.query(`
            ALTER TABLE "preferences" 
            RENAME COLUMN "property_type_temp" TO "property_type"
        `);
  }
}

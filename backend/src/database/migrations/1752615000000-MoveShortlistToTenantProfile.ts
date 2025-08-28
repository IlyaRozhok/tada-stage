import { MigrationInterface, QueryRunner } from "typeorm";

export class MoveShortlistToTenantProfile1752615000000
  implements MigrationInterface
{
  name = "MoveShortlistToTenantProfile1752615000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if shortlisted_properties column already exists
    const hasShortlistedPropertiesColumn = await queryRunner.hasColumn(
      "tenant_profiles",
      "shortlisted_properties"
    );

    if (!hasShortlistedPropertiesColumn) {
      // Add shortlisted_properties column to tenant_profiles
      await queryRunner.query(
        `ALTER TABLE "tenant_profiles" ADD "shortlisted_properties" text`
      );
    }

    // Check if shortlist table exists before migrating data
    const hasShortlistTable = await queryRunner.hasTable("shortlist");
    if (hasShortlistTable) {
      // Migrate existing shortlist data to tenant_profiles
      // This query groups shortlist entries by userId and creates a comma-separated list
      await queryRunner.query(`
        UPDATE "tenant_profiles" 
        SET "shortlisted_properties" = subquery.property_ids 
        FROM (
          SELECT 
            u.id as user_id,
            tp.id as tenant_profile_id,
            STRING_AGG(s."propertyId"::text, ',') as property_ids
          FROM "users" u
          JOIN "tenant_profiles" tp ON u.id = tp."userId"
          LEFT JOIN "shortlist" s ON u.id = s."userId"
          WHERE u.role = 'tenant'
          GROUP BY u.id, tp.id
          HAVING COUNT(s."propertyId") > 0
        ) as subquery
        WHERE "tenant_profiles".id = subquery.tenant_profile_id
      `);
    }

    // Optional: Add index for better performance (if needed)
    // await queryRunner.query(`CREATE INDEX "IDX_tenant_profiles_shortlisted_properties" ON "tenant_profiles" ("shortlisted_properties")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Restore shortlist data back to the shortlist table
    // First, make sure shortlist table exists
    const shortlistTableExists = await queryRunner.hasTable("shortlist");

    if (shortlistTableExists) {
      // Clear existing shortlist data
      await queryRunner.query(`DELETE FROM "shortlist"`);

      // Restore data from tenant_profiles back to shortlist
      await queryRunner.query(`
        INSERT INTO "shortlist" ("userId", "propertyId", "created_at")
        SELECT 
          u.id as "userId",
          UNNEST(STRING_TO_ARRAY(tp.shortlisted_properties, ','))::uuid as "propertyId",
          NOW() as "created_at"
        FROM "tenant_profiles" tp
        JOIN "users" u ON tp."userId" = u.id
        WHERE tp.shortlisted_properties IS NOT NULL AND tp.shortlisted_properties != ''
      `);
    }

    // Remove the column from tenant_profiles
    await queryRunner.query(
      `ALTER TABLE "tenant_profiles" DROP COLUMN IF EXISTS "shortlisted_properties"`
    );
  }
}

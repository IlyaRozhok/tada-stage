import { MigrationInterface, QueryRunner } from "typeorm";

export class AddNewPreferencesFields1735420000000
  implements MigrationInterface
{
  name = "AddNewPreferencesFields1735420000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add max bedroom and bathroom columns
    await queryRunner.query(
      `ALTER TABLE "preferences" ADD "max_bedrooms" integer`
    );
    await queryRunner.query(
      `ALTER TABLE "preferences" ADD "max_bathrooms" integer`
    );

    // Add new building style and advanced filters
    await queryRunner.query(
      `ALTER TABLE "preferences" ADD "building_style" text`
    );
    await queryRunner.query(
      `ALTER TABLE "preferences" ADD "designer_furniture" boolean`
    );
    await queryRunner.query(
      `ALTER TABLE "preferences" ADD "house_shares" character varying`
    );
    await queryRunner.query(
      `ALTER TABLE "preferences" ADD "date_property_added" character varying`
    );

    // Rename existing columns
    await queryRunner.query(
      `ALTER TABLE "preferences" RENAME COLUMN "bedrooms" TO "min_bedrooms"`
    );
    await queryRunner.query(
      `ALTER TABLE "preferences" RENAME COLUMN "bathrooms" TO "min_bathrooms"`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Rename columns back
    await queryRunner.query(
      `ALTER TABLE "preferences" RENAME COLUMN "min_bathrooms" TO "bathrooms"`
    );
    await queryRunner.query(
      `ALTER TABLE "preferences" RENAME COLUMN "min_bedrooms" TO "bedrooms"`
    );

    // Remove new columns
    await queryRunner.query(
      `ALTER TABLE "preferences" DROP COLUMN "date_property_added"`
    );
    await queryRunner.query(
      `ALTER TABLE "preferences" DROP COLUMN "house_shares"`
    );
    await queryRunner.query(
      `ALTER TABLE "preferences" DROP COLUMN "designer_furniture"`
    );
    await queryRunner.query(
      `ALTER TABLE "preferences" DROP COLUMN "building_style"`
    );
    await queryRunner.query(
      `ALTER TABLE "preferences" DROP COLUMN "max_bathrooms"`
    );
    await queryRunner.query(
      `ALTER TABLE "preferences" DROP COLUMN "max_bedrooms"`
    );
  }
}

import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUserProfileFields1735440000000 implements MigrationInterface {
  name = "AddUserProfileFields1735440000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add ideal_living_environment field if it doesn't exist
    const hasIdealLiving = await queryRunner.hasColumn(
      "users",
      "ideal_living_environment"
    );
    if (!hasIdealLiving) {
      await queryRunner.query(
        `ALTER TABLE "users" ADD "ideal_living_environment" character varying`
      );
    }

    // Add additional_info field if it doesn't exist
    const hasAdditionalInfo = await queryRunner.hasColumn(
      "users",
      "additional_info"
    );
    if (!hasAdditionalInfo) {
      await queryRunner.query(`ALTER TABLE "users" ADD "additional_info" text`);
    }

    // Rename work_style to work_arrangement if needed
    const hasWorkStyle = await queryRunner.hasColumn("users", "work_style");
    const hasWorkArrangement = await queryRunner.hasColumn(
      "users",
      "work_arrangement"
    );

    if (hasWorkStyle && !hasWorkArrangement) {
      await queryRunner.query(
        `ALTER TABLE "users" RENAME COLUMN "work_style" TO "work_arrangement"`
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Rename back if needed
    const hasWorkArrangement = await queryRunner.hasColumn(
      "users",
      "work_arrangement"
    );
    if (hasWorkArrangement) {
      await queryRunner.query(
        `ALTER TABLE "users" RENAME COLUMN "work_arrangement" TO "work_style"`
      );
    }

    // Remove new fields
    const hasAdditionalInfo = await queryRunner.hasColumn(
      "users",
      "additional_info"
    );
    if (hasAdditionalInfo) {
      await queryRunner.query(
        `ALTER TABLE "users" DROP COLUMN "additional_info"`
      );
    }

    const hasIdealLiving = await queryRunner.hasColumn(
      "users",
      "ideal_living_environment"
    );
    if (hasIdealLiving) {
      await queryRunner.query(
        `ALTER TABLE "users" DROP COLUMN "ideal_living_environment"`
      );
    }
  }
}

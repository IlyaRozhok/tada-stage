import { MigrationInterface, QueryRunner } from "typeorm";

export class RenameWorkArrangementToWorkStyle1735450000000
  implements MigrationInterface
{
  name = "RenameWorkArrangementToWorkStyle1735450000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Rename work_arrangement to work_style
    const hasWorkArrangement = await queryRunner.hasColumn(
      "users",
      "work_arrangement"
    );
    const hasWorkStyle = await queryRunner.hasColumn("users", "work_style");

    if (hasWorkArrangement && !hasWorkStyle) {
      await queryRunner.query(
        `ALTER TABLE "users" RENAME COLUMN "work_arrangement" TO "work_style"`
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Rename back to work_arrangement
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
}

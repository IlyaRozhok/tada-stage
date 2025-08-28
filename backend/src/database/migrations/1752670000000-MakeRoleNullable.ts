import { MigrationInterface, QueryRunner } from "typeorm";

export class MakeRoleNullable1752670000000 implements MigrationInterface {
  name = "MakeRoleNullable1752670000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Make role column nullable and remove default
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT`
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "role" DROP NOT NULL`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert: set default tenant for null roles first, then make NOT NULL
    await queryRunner.query(
      `UPDATE "users" SET "role" = 'tenant' WHERE "role" IS NULL`
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "role" SET NOT NULL`
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'tenant'`
    );
  }
}

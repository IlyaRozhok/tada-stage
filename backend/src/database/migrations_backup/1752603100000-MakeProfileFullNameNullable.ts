import { MigrationInterface, QueryRunner } from "typeorm";

export class MakeProfileFullNameNullable1752603100000
  implements MigrationInterface
{
  name = "MakeProfileFullNameNullable1752603100000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Make full_name nullable in tenant_profiles if column exists
    const hasTenantFullName = await queryRunner.hasColumn(
      "tenant_profiles",
      "full_name"
    );
    if (hasTenantFullName) {
      await queryRunner.query(`
                ALTER TABLE "tenant_profiles" ALTER COLUMN "full_name" DROP NOT NULL
            `);
      console.log("✅ Made full_name nullable in tenant_profiles");
    }

    // Make full_name nullable in operator_profiles if column exists
    const hasOperatorFullName = await queryRunner.hasColumn(
      "operator_profiles",
      "full_name"
    );
    if (hasOperatorFullName) {
      await queryRunner.query(`
                ALTER TABLE "operator_profiles" ALTER COLUMN "full_name" DROP NOT NULL
            `);
      console.log("✅ Made full_name nullable in operator_profiles");
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Restore NOT NULL constraint for full_name in tenant_profiles if column exists
    const hasTenantFullName = await queryRunner.hasColumn(
      "tenant_profiles",
      "full_name"
    );
    if (hasTenantFullName) {
      await queryRunner.query(`
                ALTER TABLE "tenant_profiles" ALTER COLUMN "full_name" SET NOT NULL
            `);
      console.log(
        "✅ Restored NOT NULL constraint for full_name in tenant_profiles"
      );
    }

    // Restore NOT NULL constraint for full_name in operator_profiles if column exists
    const hasOperatorFullName = await queryRunner.hasColumn(
      "operator_profiles",
      "full_name"
    );
    if (hasOperatorFullName) {
      await queryRunner.query(`
                ALTER TABLE "operator_profiles" ALTER COLUMN "full_name" SET NOT NULL
            `);
      console.log(
        "✅ Restored NOT NULL constraint for full_name in operator_profiles"
      );
    }
  }
}

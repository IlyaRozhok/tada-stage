import { MigrationInterface, QueryRunner } from "typeorm";

export class AddGoogleOAuthFields1752610000000 implements MigrationInterface {
  name = "AddGoogleOAuthFields1752610000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check and add provider column
    const hasProviderColumn = await queryRunner.hasColumn("users", "provider");
    if (!hasProviderColumn) {
      await queryRunner.query(
        `ALTER TABLE "users" ADD "provider" character varying NOT NULL DEFAULT 'local'`
      );
    }

    // Check and add google_id column
    const hasGoogleIdColumn = await queryRunner.hasColumn("users", "google_id");
    if (!hasGoogleIdColumn) {
      await queryRunner.query(
        `ALTER TABLE "users" ADD "google_id" character varying`
      );
    }

    // Check and add avatar_url column
    const hasAvatarUrlColumn = await queryRunner.hasColumn(
      "users",
      "avatar_url"
    );
    if (!hasAvatarUrlColumn) {
      await queryRunner.query(
        `ALTER TABLE "users" ADD "avatar_url" character varying`
      );
    }

    // Check and add email_verified column
    const hasEmailVerifiedColumn = await queryRunner.hasColumn(
      "users",
      "email_verified"
    );
    if (!hasEmailVerifiedColumn) {
      await queryRunner.query(
        `ALTER TABLE "users" ADD "email_verified" boolean NOT NULL DEFAULT false`
      );
    }

    // Make password nullable for OAuth users if it isn't already
    const table = await queryRunner.getTable("users");
    const passwordColumn = table?.findColumnByName("password");
    if (passwordColumn && !passwordColumn.isNullable) {
      await queryRunner.query(
        `ALTER TABLE "users" ALTER COLUMN "password" DROP NOT NULL`
      );
    }

    // Add indexes only if they don't exist
    const indexes = await queryRunner.query(
      `SELECT indexname FROM pg_indexes WHERE tablename = 'users' AND indexname = 'IDX_users_google_id'`
    );
    if (indexes.length === 0) {
      await queryRunner.query(
        `CREATE INDEX "IDX_users_google_id" ON "users" ("google_id")`
      );
    }

    const providerIndexes = await queryRunner.query(
      `SELECT indexname FROM pg_indexes WHERE tablename = 'users' AND indexname = 'IDX_users_provider'`
    );
    if (providerIndexes.length === 0) {
      await queryRunner.query(
        `CREATE INDEX "IDX_users_provider" ON "users" ("provider")`
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove indexes
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_users_provider"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_users_google_id"`);

    // Make password NOT NULL again (only for local users)
    await queryRunner.query(
      `UPDATE "users" SET "password" = 'oauth_user' WHERE "provider" != 'local' AND "password" IS NULL`
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "password" SET NOT NULL`
    );

    // Remove columns
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN IF EXISTS "email_verified"`
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN IF EXISTS "avatar_url"`
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN IF EXISTS "google_id"`
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN IF EXISTS "provider"`
    );
  }
}

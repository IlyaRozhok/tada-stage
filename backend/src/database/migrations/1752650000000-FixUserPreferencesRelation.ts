import { MigrationInterface, QueryRunner } from "typeorm";

export class FixUserPreferencesRelation1752650000000
  implements MigrationInterface
{
  name = "FixUserPreferencesRelation1752650000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop the foreign key constraint from users table that references preferences
    // This removes the circular dependency
    await queryRunner.query(`
            ALTER TABLE "users" 
            DROP CONSTRAINT IF EXISTS "FK_e43331081e8de087618267b07a5"
        `);

    // Drop the preferencesId column from users table if it exists
    await queryRunner.query(`
            ALTER TABLE "users" 
            DROP COLUMN IF EXISTS "preferencesId"
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // In case we need to rollback, re-add the column and constraint
    // Note: This might not work if there are existing data conflicts
    await queryRunner.query(`
            ALTER TABLE "users" 
            ADD COLUMN "preferencesId" uuid
        `);

    await queryRunner.query(`
            ALTER TABLE "users" 
            ADD CONSTRAINT "FK_e43331081e8de087618267b07a5" 
            FOREIGN KEY ("preferencesId") 
            REFERENCES "preferences"("id") 
            ON DELETE NO ACTION 
            ON UPDATE NO ACTION
        `);
  }
}

import { MigrationInterface, QueryRunner } from "typeorm";

export class RefactorUserModel1752601418409 implements MigrationInterface {
  name = "RefactorUserModel1752601418409";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create tenant_profiles table
    await queryRunner.query(`
            CREATE TABLE "tenant_profiles" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "full_name" character varying NOT NULL,
                "age_range" character varying,
                "phone" character varying,
                "date_of_birth" date,
                "nationality" character varying,
                "occupation" character varying,
                "industry" character varying,
                "work_style" character varying,
                "lifestyle" text,
                "pets" character varying,
                "smoker" boolean NOT NULL DEFAULT false,
                "hobbies" text,
                "ideal_living_environment" character varying,
                "additional_info" text,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "userId" uuid,
                CONSTRAINT "PK_tenant_profiles" PRIMARY KEY ("id"),
                CONSTRAINT "UQ_tenant_profiles_userId" UNIQUE ("userId")
            )
        `);

    // Create operator_profiles table
    await queryRunner.query(`
            CREATE TABLE "operator_profiles" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "full_name" character varying NOT NULL,
                "company_name" character varying,
                "phone" character varying,
                "business_address" character varying,
                "company_registration" character varying,
                "vat_number" character varying,
                "license_number" character varying,
                "years_experience" integer,
                "operating_areas" text,
                "property_types" text,
                "services" text,
                "business_description" text,
                "website" character varying,
                "linkedin" character varying,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "userId" uuid,
                CONSTRAINT "PK_operator_profiles" PRIMARY KEY ("id"),
                CONSTRAINT "UQ_operator_profiles_userId" UNIQUE ("userId")
            )
        `);

    // Migrate existing user data to profiles
    await queryRunner.query(`
            INSERT INTO "tenant_profiles" (
                "full_name", "age_range", "phone", "date_of_birth", "nationality", 
                "occupation", "industry", "work_style", "lifestyle", "pets", 
                "smoker", "hobbies", "ideal_living_environment", "additional_info", 
                "created_at", "updated_at", "userId"
            )
            SELECT 
                "full_name", "age_range", "phone", "date_of_birth", "nationality", 
                "occupation", "industry", "work_style", "lifestyle", "pets", 
                "smoker", "hobbies", "ideal_living_environment", "additional_info", 
                "created_at", "updated_at", "id"
            FROM "users"
            WHERE 'tenant' = ANY(string_to_array("roles", ','))
        `);

    await queryRunner.query(`
            INSERT INTO "operator_profiles" (
                "full_name", "phone", "created_at", "updated_at", "userId"
            )
            SELECT 
                "full_name", "phone", "created_at", "updated_at", "id"
            FROM "users"
            WHERE 'operator' = ANY(string_to_array("roles", ','))
        `);

    // Add new columns to users table
    await queryRunner.query(
      `ALTER TABLE "users" ADD "role" character varying NOT NULL DEFAULT 'tenant'`
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "status" character varying NOT NULL DEFAULT 'active'`
    );

    // Update role column based on existing roles
    await queryRunner.query(`
            UPDATE "users" SET "role" = 'admin' WHERE 'admin' = ANY(string_to_array("roles", ','))
        `);
    await queryRunner.query(`
            UPDATE "users" SET "role" = 'operator' WHERE 'operator' = ANY(string_to_array("roles", ',')) AND "role" != 'admin'
        `);

    // Remove old columns from users table
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "full_name"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "age_range"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "phone"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "date_of_birth"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "nationality"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "occupation"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "industry"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "work_style"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "lifestyle"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "pets"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "smoker"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "hobbies"`);
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN "ideal_living_environment"`
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN "additional_info"`
    );
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "roles"`);

    // Add foreign key constraints
    await queryRunner.query(`
            ALTER TABLE "tenant_profiles" 
            ADD CONSTRAINT "FK_tenant_profiles_userId" 
            FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
        `);

    await queryRunner.query(`
            ALTER TABLE "operator_profiles" 
            ADD CONSTRAINT "FK_operator_profiles_userId" 
            FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove foreign key constraints
    await queryRunner.query(
      `ALTER TABLE "operator_profiles" DROP CONSTRAINT "FK_operator_profiles_userId"`
    );
    await queryRunner.query(
      `ALTER TABLE "tenant_profiles" DROP CONSTRAINT "FK_tenant_profiles_userId"`
    );

    // Add back old columns to users table
    await queryRunner.query(
      `ALTER TABLE "users" ADD "full_name" character varying`
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "age_range" character varying`
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "phone" character varying`
    );
    await queryRunner.query(`ALTER TABLE "users" ADD "date_of_birth" date`);
    await queryRunner.query(
      `ALTER TABLE "users" ADD "nationality" character varying`
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "occupation" character varying`
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "industry" character varying`
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "work_style" character varying`
    );
    await queryRunner.query(`ALTER TABLE "users" ADD "lifestyle" text`);
    await queryRunner.query(`ALTER TABLE "users" ADD "pets" character varying`);
    await queryRunner.query(
      `ALTER TABLE "users" ADD "smoker" boolean NOT NULL DEFAULT false`
    );
    await queryRunner.query(`ALTER TABLE "users" ADD "hobbies" text`);
    await queryRunner.query(
      `ALTER TABLE "users" ADD "ideal_living_environment" character varying`
    );
    await queryRunner.query(`ALTER TABLE "users" ADD "additional_info" text`);
    await queryRunner.query(
      `ALTER TABLE "users" ADD "roles" text NOT NULL DEFAULT 'tenant'`
    );

    // Migrate data back from profiles
    await queryRunner.query(`
            UPDATE "users" SET 
                "full_name" = tp."full_name",
                "age_range" = tp."age_range",
                "phone" = tp."phone",
                "date_of_birth" = tp."date_of_birth",
                "nationality" = tp."nationality",
                "occupation" = tp."occupation",
                "industry" = tp."industry",
                "work_style" = tp."work_style",
                "lifestyle" = tp."lifestyle",
                "pets" = tp."pets",
                "smoker" = tp."smoker",
                "hobbies" = tp."hobbies",
                "ideal_living_environment" = tp."ideal_living_environment",
                "additional_info" = tp."additional_info"
            FROM "tenant_profiles" tp
            WHERE "users"."id" = tp."userId"
        `);

    await queryRunner.query(`
            UPDATE "users" SET 
                "full_name" = op."full_name",
                "phone" = op."phone"
            FROM "operator_profiles" op
            WHERE "users"."id" = op."userId"
        `);

    // Update roles column based on role
    await queryRunner.query(`UPDATE "users" SET "roles" = "role"`);

    // Remove new columns
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "status"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "role"`);

    // Drop profile tables
    await queryRunner.query(`DROP TABLE "operator_profiles"`);
    await queryRunner.query(`DROP TABLE "tenant_profiles"`);
  }
}

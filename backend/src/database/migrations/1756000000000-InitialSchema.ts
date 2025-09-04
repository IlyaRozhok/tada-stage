import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1756000000000 implements MigrationInterface {
  name = "InitialSchema1756000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Enable required extensions
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // Create enum types
    await queryRunner.query(`
            CREATE TYPE "public"."users_role_enum" AS ENUM('admin', 'operator', 'tenant')
        `);
    await queryRunner.query(`
            CREATE TYPE "public"."users_status_enum" AS ENUM('active', 'inactive', 'suspended')
        `);

    // Create users table
    await queryRunner.query(`
            CREATE TABLE "users" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "email" character varying NOT NULL,
                "password" character varying,
                "role" "public"."users_role_enum",
                "status" "public"."users_status_enum" NOT NULL DEFAULT 'active',
                "provider" character varying NOT NULL DEFAULT 'local',
                "google_id" character varying,
                "avatar_url" character varying,
                "email_verified" boolean NOT NULL DEFAULT false,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"),
                CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email")
            )
        `);

    // Create tenant_profiles table
    await queryRunner.query(`
            CREATE TABLE "tenant_profiles" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "full_name" character varying,
                "age_range" character varying,
                "phone" character varying,
                "date_of_birth" date,
                "nationality" character varying,
                "occupation" character varying,
                "industry" character varying,
                "work_style" character varying,
                "lifestyle" text,
                "ideal_living_environment" character varying,
                "additional_info" text,
                "shortlisted_properties" text,
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
                "full_name" character varying,
                "company_name" character varying,
                "phone" character varying,
                "date_of_birth" date,
                "nationality" character varying,
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

    // Create preferences table
    await queryRunner.query(`
            CREATE TABLE "preferences" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "user_id" uuid NOT NULL,
                "primary_postcode" character varying,
                "secondary_location" character varying,
                "commute_location" character varying,
                "commute_time_walk" integer,
                "commute_time_cycle" integer,
                "commute_time_tube" integer,
                "move_in_date" date,
                "move_out_date" date,
                "min_price" integer,
                "max_price" integer,
                "min_bedrooms" integer,
                "max_bedrooms" integer,
                "min_bathrooms" integer,
                "max_bathrooms" integer,
                "furnishing" character varying,
                "let_duration" character varying,
                "property_type" text[],
                "building_style" text[],
                "designer_furniture" boolean,
                "house_shares" character varying,
                "date_property_added" character varying,
                "lifestyle_features" text[],
                "social_features" text[],
                "work_features" text[],
                "convenience_features" text[],
                "pet_friendly_features" text[],
                "luxury_features" text[],
                "hobbies" text[],
                "ideal_living_environment" json,
                "pets" character varying,
                "smoker" character varying,
                "additional_info" text,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_preferences" PRIMARY KEY ("id")
            )
        `);

    // Create properties table
    await queryRunner.query(`
            CREATE TABLE "properties" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "title" character varying NOT NULL,
                "description" text NOT NULL,
                "address" character varying NOT NULL,
                "price" numeric(10,2) NOT NULL,
                "bedrooms" integer NOT NULL,
                "bathrooms" integer NOT NULL,
                "property_types" text[],
                "furnishing" character varying NOT NULL,
                "lifestyle_features" text,
                "available_from" date NOT NULL,
                "images" text,
                "is_btr" boolean NOT NULL DEFAULT false,
                "lat" numeric(10,7),
                "lng" numeric(10,7),
                "operator_id" uuid NOT NULL,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_properties" PRIMARY KEY ("id")
            )
        `);

    // Create property_media table
    await queryRunner.query(`
            CREATE TABLE "property_media" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "property_id" uuid NOT NULL,
                "url" character varying NOT NULL,
                "s3_key" character varying NOT NULL,
                "type" character varying NOT NULL DEFAULT 'image',
                "mime_type" character varying NOT NULL,
                "original_filename" character varying NOT NULL,
                "file_size" bigint NOT NULL,
                "order_index" integer NOT NULL DEFAULT 0,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_property_media" PRIMARY KEY ("id")
            )
        `);

    // Create shortlist table
    await queryRunner.query(`
            CREATE TABLE "shortlist" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "userId" uuid NOT NULL,
                "propertyId" uuid NOT NULL,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_shortlist" PRIMARY KEY ("id"),
                CONSTRAINT "unique_user_property" UNIQUE ("userId", "propertyId")
            )
        `);

    // Create indexes
    await queryRunner.query(
      `CREATE INDEX "IDX_users_email" ON "users" ("email")`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_users_google_id" ON "users" ("google_id")`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_properties_price" ON "properties" ("price")`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_properties_bedrooms" ON "properties" ("bedrooms")`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_properties_available_from" ON "properties" ("available_from")`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_shortlist_userId" ON "shortlist" ("userId")`
    );

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

    await queryRunner.query(`
            ALTER TABLE "preferences"
            ADD CONSTRAINT "FK_preferences_user_id"
            FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
        `);

    await queryRunner.query(`
            ALTER TABLE "properties"
            ADD CONSTRAINT "FK_properties_operator_id"
            FOREIGN KEY ("operator_id") REFERENCES "users"("id") ON DELETE CASCADE
        `);

    await queryRunner.query(`
            ALTER TABLE "property_media"
            ADD CONSTRAINT "FK_property_media_property_id"
            FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE CASCADE
        `);

    await queryRunner.query(`
            ALTER TABLE "shortlist"
            ADD CONSTRAINT "FK_shortlist_userId"
            FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
        `);

    await queryRunner.query(`
            ALTER TABLE "shortlist"
            ADD CONSTRAINT "FK_shortlist_propertyId"
            FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE CASCADE
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key constraints
    await queryRunner.query(
      `ALTER TABLE "shortlist" DROP CONSTRAINT "FK_shortlist_propertyId"`
    );
    await queryRunner.query(
      `ALTER TABLE "shortlist" DROP CONSTRAINT "FK_shortlist_userId"`
    );
    await queryRunner.query(
      `ALTER TABLE "property_media" DROP CONSTRAINT "FK_property_media_property_id"`
    );
    await queryRunner.query(
      `ALTER TABLE "properties" DROP CONSTRAINT "FK_properties_operator_id"`
    );
    await queryRunner.query(
      `ALTER TABLE "preferences" DROP CONSTRAINT "FK_preferences_user_id"`
    );
    await queryRunner.query(
      `ALTER TABLE "operator_profiles" DROP CONSTRAINT "FK_operator_profiles_userId"`
    );
    await queryRunner.query(
      `ALTER TABLE "tenant_profiles" DROP CONSTRAINT "FK_tenant_profiles_userId"`
    );

    // Drop indexes
    await queryRunner.query(`DROP INDEX "IDX_shortlist_userId"`);
    await queryRunner.query(`DROP INDEX "IDX_properties_available_from"`);
    await queryRunner.query(`DROP INDEX "IDX_properties_bedrooms"`);
    await queryRunner.query(`DROP INDEX "IDX_properties_price"`);
    await queryRunner.query(`DROP INDEX "IDX_users_google_id"`);
    await queryRunner.query(`DROP INDEX "IDX_users_email"`);

    // Drop tables
    await queryRunner.query(`DROP TABLE "shortlist"`);
    await queryRunner.query(`DROP TABLE "property_media"`);
    await queryRunner.query(`DROP TABLE "properties"`);
    await queryRunner.query(`DROP TABLE "preferences"`);
    await queryRunner.query(`DROP TABLE "operator_profiles"`);
    await queryRunner.query(`DROP TABLE "tenant_profiles"`);
    await queryRunner.query(`DROP TABLE "users"`);

    // Drop enum types
    await queryRunner.query(`DROP TYPE "public"."users_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
  }
}

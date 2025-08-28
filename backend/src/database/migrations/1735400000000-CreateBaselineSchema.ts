import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateBaselineSchema1735400000000 implements MigrationInterface {
  name = "CreateBaselineSchema1735400000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Enable UUID extension
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // Check if users table exists
    const hasUsersTable = await queryRunner.hasTable("users");
    if (!hasUsersTable) {
      console.log("Creating users table...");
      await queryRunner.query(`
        CREATE TABLE "users" (
          "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
          "email" character varying NOT NULL,
          "password" character varying,
          "google_id" character varying,
          "full_name" character varying,
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
          "roles" text NOT NULL DEFAULT 'tenant',
          "is_verified" boolean NOT NULL DEFAULT false,
          "verification_token" character varying,
          "reset_password_token" character varying,
          "reset_password_expires" TIMESTAMP,
          "last_login" TIMESTAMP,
          "created_at" TIMESTAMP NOT NULL DEFAULT now(),
          "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
          CONSTRAINT "PK_users" PRIMARY KEY ("id"),
          CONSTRAINT "UQ_users_email" UNIQUE ("email"),
          CONSTRAINT "UQ_users_google_id" UNIQUE ("google_id")
        )
      `);
    }

    // Check if preferences table exists
    const hasPreferencesTable = await queryRunner.hasTable("preferences");
    if (!hasPreferencesTable) {
      console.log("Creating preferences table...");
      await queryRunner.query(`
        CREATE TABLE "preferences" (
          "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
          "user_id" uuid NOT NULL,
          "min_bedrooms" integer,
          "max_bedrooms" integer,
          "min_bathrooms" integer,
          "max_bathrooms" integer,
          "min_price" decimal(10,2),
          "max_price" decimal(10,2),
          "property_type" text,
          "furnishing" text,
          "location" text,
          "building_style" text,
          "designer_furniture" boolean,
          "house_shares" character varying,
          "date_property_added" character varying,
          "created_at" TIMESTAMP NOT NULL DEFAULT now(),
          "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
          CONSTRAINT "PK_preferences" PRIMARY KEY ("id"),
          CONSTRAINT "FK_preferences_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
        )
      `);
    }

    // Check if properties table exists
    const hasPropertiesTable = await queryRunner.hasTable("properties");
    if (!hasPropertiesTable) {
      console.log("Creating properties table...");
      await queryRunner.query(`
        CREATE TABLE "properties" (
          "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
          "title" character varying NOT NULL,
          "description" text NOT NULL,
          "address" character varying NOT NULL,
          "price" decimal(10,2) NOT NULL,
          "bedrooms" integer NOT NULL,
          "bathrooms" integer NOT NULL,
          "property_type" character varying NOT NULL,
          "furnishing" character varying NOT NULL,
          "lifestyle_features" text,
          "available_from" date NOT NULL,
          "images" text,
          "is_btr" boolean DEFAULT false,
          "operator_id" uuid NOT NULL,
          "created_at" TIMESTAMP NOT NULL DEFAULT now(),
          "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
          CONSTRAINT "PK_properties" PRIMARY KEY ("id"),
          CONSTRAINT "FK_properties_operator_id" FOREIGN KEY ("operator_id") REFERENCES "users"("id") ON DELETE CASCADE
        )
      `);
    }

    // Check if property_media table exists
    const hasPropertyMediaTable = await queryRunner.hasTable("property_media");
    if (!hasPropertyMediaTable) {
      console.log("Creating property_media table...");
      await queryRunner.query(`
        CREATE TABLE "property_media" (
          "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
          "property_id" uuid NOT NULL,
          "url" character varying,
          "s3_key" character varying,
          "type" character varying DEFAULT 'image',
          "mime_type" character varying,
          "original_filename" character varying,
          "file_size" bigint,
          "order_index" integer DEFAULT 0,
          "is_featured" boolean DEFAULT false,
          "created_at" TIMESTAMP NOT NULL DEFAULT now(),
          "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
          CONSTRAINT "PK_property_media" PRIMARY KEY ("id"),
          CONSTRAINT "FK_property_media_property_id" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE CASCADE
        )
      `);
    }

    // Check if shortlist table exists
    const hasShortlistTable = await queryRunner.hasTable("shortlist");
    if (!hasShortlistTable) {
      console.log("Creating shortlist table...");
      await queryRunner.query(`
        CREATE TABLE "shortlist" (
          "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
          "userId" uuid NOT NULL,
          "propertyId" uuid NOT NULL,
          "notes" text,
          "created_at" TIMESTAMP NOT NULL DEFAULT now(),
          "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
          CONSTRAINT "PK_shortlist" PRIMARY KEY ("id"),
          CONSTRAINT "FK_shortlist_userId" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE,
          CONSTRAINT "FK_shortlist_propertyId" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE CASCADE,
          CONSTRAINT "UQ_shortlist_user_property" UNIQUE ("userId", "propertyId")
        )
      `);
    }

    // Check if favourites table exists
    const hasFavouritesTable = await queryRunner.hasTable("favourites");
    if (!hasFavouritesTable) {
      console.log("Creating favourites table...");
      await queryRunner.query(`
        CREATE TABLE "favourites" (
          "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
          "userId" uuid NOT NULL,
          "propertyId" uuid NOT NULL,
          "created_at" TIMESTAMP NOT NULL DEFAULT now(),
          "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
          CONSTRAINT "PK_favourites" PRIMARY KEY ("id"),
          CONSTRAINT "FK_favourites_userId" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE,
          CONSTRAINT "FK_favourites_propertyId" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE CASCADE,
          CONSTRAINT "UQ_favourites_user_property" UNIQUE ("userId", "propertyId")
        )
      `);
    }

    // Check if tenant_profiles table exists
    const hasTenantProfilesTable =
      await queryRunner.hasTable("tenant_profiles");
    if (!hasTenantProfilesTable) {
      console.log("Creating tenant_profiles table...");
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
    }

    // Check if operator_profiles table exists
    const hasOperatorProfilesTable =
      await queryRunner.hasTable("operator_profiles");
    if (!hasOperatorProfilesTable) {
      console.log("Creating operator_profiles table...");
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
    }

    // Create indexes only if they don't exist
    await this.createIndexesIfNotExist(queryRunner);
  }

  private async createIndexesIfNotExist(
    queryRunner: QueryRunner
  ): Promise<void> {
    // Users indexes
    await this.createIndexIfNotExists(
      queryRunner,
      "IDX_users_email",
      "users",
      "email"
    );
    await this.createIndexIfNotExists(
      queryRunner,
      "IDX_users_google_id",
      "users",
      "google_id"
    );
    await this.createIndexIfNotExists(
      queryRunner,
      "IDX_users_role",
      "users",
      "role"
    );

    // Preferences indexes
    await this.createIndexIfNotExists(
      queryRunner,
      "IDX_preferences_user_id",
      "preferences",
      "user_id"
    );

    // Properties indexes
    await this.createIndexIfNotExists(
      queryRunner,
      "IDX_properties_operator_id",
      "properties",
      "operator_id"
    );
    await this.createIndexIfNotExists(
      queryRunner,
      "IDX_properties_price",
      "properties",
      "price"
    );
    await this.createIndexIfNotExists(
      queryRunner,
      "IDX_properties_bedrooms",
      "properties",
      "bedrooms"
    );
    await this.createIndexIfNotExists(
      queryRunner,
      "IDX_properties_property_type",
      "properties",
      "property_type"
    );

    // Property media indexes
    await this.createIndexIfNotExists(
      queryRunner,
      "IDX_property_media_property_id",
      "property_media",
      "property_id"
    );

    // Shortlist indexes
    await this.createIndexIfNotExists(
      queryRunner,
      "IDX_shortlist_userId",
      "shortlist",
      "userId"
    );

    // Favourites indexes
    await this.createIndexIfNotExists(
      queryRunner,
      "IDX_favourites_userId",
      "favourites",
      "userId"
    );
  }

  private async createIndexIfNotExists(
    queryRunner: QueryRunner,
    indexName: string,
    tableName: string,
    columnName: string
  ): Promise<void> {
    try {
      const indexExists = await queryRunner.query(
        `
        SELECT EXISTS (
          SELECT 1 FROM pg_indexes 
          WHERE indexname = $1
        )
      `,
        [indexName]
      );

      if (!indexExists[0].exists) {
        await queryRunner.query(
          `CREATE INDEX "${indexName}" ON "${tableName}" ("${columnName}")`
        );
        console.log(`Created index: ${indexName}`);
      }
    } catch (error) {
      console.log(`Index ${indexName} already exists or could not be created`);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // This is a baseline migration, so down migration should be careful
    // We'll only drop tables if they were created by this migration
    console.log("Baseline migration down - this will not drop existing tables");
  }
}

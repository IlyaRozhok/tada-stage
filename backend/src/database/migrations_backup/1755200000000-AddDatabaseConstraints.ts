import { MigrationInterface, QueryRunner } from "typeorm";

export class AddDatabaseConstraints1755200000000 implements MigrationInterface {
    name = 'AddDatabaseConstraints1755200000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Step 1: Add constraints for Properties table

        // Price must be positive
        await queryRunner.query(`
            ALTER TABLE "properties"
            ADD CONSTRAINT "chk_price_positive"
            CHECK ("price" > 0)
        `);

        // Bedrooms must be non-negative
        await queryRunner.query(`
            ALTER TABLE "properties"
            ADD CONSTRAINT "chk_bedrooms_non_negative"
            CHECK ("bedrooms" >= 0)
        `);

        // Bathrooms must be non-negative
        await queryRunner.query(`
            ALTER TABLE "properties"
            ADD CONSTRAINT "chk_bathrooms_non_negative"
            CHECK ("bathrooms" >= 0)
        `);

        // Available from date should not be too far in the past
        await queryRunner.query(`
            ALTER TABLE "properties"
            ADD CONSTRAINT "chk_available_from_reasonable"
            CHECK ("available_from" >= DATE '2020-01-01')
        `);

        // Furnishing must be valid
        await queryRunner.query(`
            ALTER TABLE "properties"
            ADD CONSTRAINT "chk_furnishing_valid"
            CHECK ("furnishing" IN ('furnished', 'unfurnished', 'part-furnished'))
        `);

        // Coordinates validation (London area approximately)
        await queryRunner.query(`
            ALTER TABLE "properties"
            ADD CONSTRAINT "chk_coordinates_valid"
            CHECK (
                ("lat" IS NULL AND "lng" IS NULL) OR
                ("lat" IS NOT NULL AND "lng" IS NOT NULL AND
                 "lat" BETWEEN 51.2 AND 51.8 AND
                 "lng" BETWEEN -0.6 AND 0.3)
            )
        `);

        // Step 2: Add constraints for Preferences table

        // Price range validation
        await queryRunner.query(`
            ALTER TABLE "preferences"
            ADD CONSTRAINT "chk_price_range_valid"
            CHECK (
                ("min_price" IS NULL OR "min_price" > 0) AND
                ("max_price" IS NULL OR "max_price" > 0) AND
                ("min_price" IS NULL OR "max_price" IS NULL OR "min_price" <= "max_price")
            )
        `);

        // Bedroom range validation
        await queryRunner.query(`
            ALTER TABLE "preferences"
            ADD CONSTRAINT "chk_bedroom_range_valid"
            CHECK (
                ("min_bedrooms" IS NULL OR "min_bedrooms" >= 0) AND
                ("max_bedrooms" IS NULL OR "max_bedrooms" >= 0) AND
                ("min_bedrooms" IS NULL OR "max_bedrooms" IS NULL OR "min_bedrooms" <= "max_bedrooms")
            )
        `);

        // Bathroom range validation
        await queryRunner.query(`
            ALTER TABLE "preferences"
            ADD CONSTRAINT "chk_bathroom_range_valid"
            CHECK (
                ("min_bathrooms" IS NULL OR "min_bathrooms" >= 0) AND
                ("max_bathrooms" IS NULL OR "max_bathrooms" >= 0) AND
                ("min_bathrooms" IS NULL OR "max_bathrooms" IS NULL OR "min_bathrooms" <= "max_bathrooms")
            )
        `);

        // Commute time validation
        await queryRunner.query(`
            ALTER TABLE "preferences"
            ADD CONSTRAINT "chk_commute_times_valid"
            CHECK (
                ("commute_time_walk" IS NULL OR ("commute_time_walk" > 0 AND "commute_time_walk" <= 120)) AND
                ("commute_time_cycle" IS NULL OR ("commute_time_cycle" > 0 AND "commute_time_cycle" <= 120)) AND
                ("commute_time_tube" IS NULL OR ("commute_time_tube" > 0 AND "commute_time_tube" <= 240))
            )
        `);

        // Move-in date should be reasonable
        await queryRunner.query(`
            ALTER TABLE "preferences"
            ADD CONSTRAINT "chk_move_in_date_reasonable"
            CHECK (
                "move_in_date" IS NULL OR
                "move_in_date" BETWEEN CURRENT_DATE - INTERVAL '1 year' AND CURRENT_DATE + INTERVAL '2 years'
            )
        `);

        // Move-out date should be after move-in date
        await queryRunner.query(`
            ALTER TABLE "preferences"
            ADD CONSTRAINT "chk_move_out_after_move_in"
            CHECK (
                ("move_in_date" IS NULL OR "move_out_date" IS NULL) OR
                "move_out_date" > "move_in_date"
            )
        `);

        // Valid furnishing preference
        await queryRunner.query(`
            ALTER TABLE "preferences"
            ADD CONSTRAINT "chk_furnishing_preference_valid"
            CHECK (
                "furnishing" IS NULL OR
                "furnishing" IN ('furnished', 'unfurnished', 'part-furnished', 'no-preference')
            )
        `);

        // Valid let duration
        await queryRunner.query(`
            ALTER TABLE "preferences"
            ADD CONSTRAINT "chk_let_duration_valid"
            CHECK (
                "let_duration" IS NULL OR
                "let_duration" IN ('6-months', '12-months', '18-months', '24-months', 'flexible')
            )
        `);

        // Valid house shares preference
        await queryRunner.query(`
            ALTER TABLE "preferences"
            ADD CONSTRAINT "chk_house_shares_valid"
            CHECK (
                "house_shares" IS NULL OR
                "house_shares" IN ('show-all', 'only-house-shares', 'no-house-shares')
            )
        `);

        // Valid pets preference
        await queryRunner.query(`
            ALTER TABLE "preferences"
            ADD CONSTRAINT "chk_pets_valid"
            CHECK (
                "pets" IS NULL OR
                "pets" IN ('none', 'dog', 'cat', 'small-pets', 'planning-to-get')
            )
        `);

        // Valid smoker preference
        await queryRunner.query(`
            ALTER TABLE "preferences"
            ADD CONSTRAINT "chk_smoker_valid"
            CHECK (
                "smoker" IS NULL OR
                "smoker" IN ('no', 'yes', 'no-but-okay', 'no-prefer-non-smoking', 'no-preference')
            )
        `);

        // Step 3: Add constraints for User table

        // Email format validation (basic)
        await queryRunner.query(`
            ALTER TABLE "users"
            ADD CONSTRAINT "chk_email_format"
            CHECK ("email" ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
        `);

        // Valid user role
        await queryRunner.query(`
            ALTER TABLE "users"
            ADD CONSTRAINT "chk_role_valid"
            CHECK (
                "role" IS NULL OR
                "role" IN ('admin', 'operator', 'tenant')
            )
        `);

        // Valid user status
        await queryRunner.query(`
            ALTER TABLE "users"
            ADD CONSTRAINT "chk_status_valid"
            CHECK ("status" IN ('active', 'inactive', 'suspended'))
        `);

        // Valid provider
        await queryRunner.query(`
            ALTER TABLE "users"
            ADD CONSTRAINT "chk_provider_valid"
            CHECK ("provider" IN ('local', 'google'))
        `);

        // Step 4: Add constraints for Profile tables

        // TenantProfile age range validation
        await queryRunner.query(`
            ALTER TABLE "tenant_profiles"
            ADD CONSTRAINT "chk_age_range_valid"
            CHECK (
                "age_range" IS NULL OR
                "age_range" IN ('under-25', '25-34', '35-44', '45-54', '55+')
            )
        `);

        // Date of birth should be reasonable
        await queryRunner.query(`
            ALTER TABLE "tenant_profiles"
            ADD CONSTRAINT "chk_date_of_birth_reasonable"
            CHECK (
                "date_of_birth" IS NULL OR
                ("date_of_birth" >= DATE '1920-01-01' AND "date_of_birth" <= CURRENT_DATE - INTERVAL '16 years')
            )
        `);

        // OperatorProfile date of birth validation
        await queryRunner.query(`
            ALTER TABLE "operator_profiles"
            ADD CONSTRAINT "chk_operator_date_of_birth_reasonable"
            CHECK (
                "date_of_birth" IS NULL OR
                ("date_of_birth" >= DATE '1920-01-01' AND "date_of_birth" <= CURRENT_DATE - INTERVAL '18 years')
            )
        `);

        // Years of experience should be reasonable
        await queryRunner.query(`
            ALTER TABLE "operator_profiles"
            ADD CONSTRAINT "chk_years_experience_reasonable"
            CHECK (
                "years_experience" IS NULL OR
                ("years_experience" >= 0 AND "years_experience" <= 70)
            )
        `);

        // Step 5: Add constraints for PropertyMedia table

        // File size should be reasonable (max 50MB)
        await queryRunner.query(`
            ALTER TABLE "property_media"
            ADD CONSTRAINT "chk_file_size_reasonable"
            CHECK ("file_size" > 0 AND "file_size" <= 52428800)
        `);

        // Valid media type
        await queryRunner.query(`
            ALTER TABLE "property_media"
            ADD CONSTRAINT "chk_media_type_valid"
            CHECK ("type" IN ('image', 'video'))
        `);

        // Order index should be non-negative
        await queryRunner.query(`
            ALTER TABLE "property_media"
            ADD CONSTRAINT "chk_order_index_non_negative"
            CHECK ("order_index" >= 0)
        `);

        // Only one featured image per property
        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_property_media_one_featured_per_property"
            ON "property_media" ("property_id")
            WHERE "is_featured" = true
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop unique index
        await queryRunner.query(`DROP INDEX IF EXISTS "idx_property_media_one_featured_per_property"`);

        // Drop PropertyMedia constraints
        await queryRunner.query(`ALTER TABLE "property_media" DROP CONSTRAINT IF EXISTS "chk_order_index_non_negative"`);
        await queryRunner.query(`ALTER TABLE "property_media" DROP CONSTRAINT IF EXISTS "chk_media_type_valid"`);
        await queryRunner.query(`ALTER TABLE "property_media" DROP CONSTRAINT IF EXISTS "chk_file_size_reasonable"`);

        // Drop OperatorProfile constraints
        await queryRunner.query(`ALTER TABLE "operator_profiles" DROP CONSTRAINT IF EXISTS "chk_years_experience_reasonable"`);
        await queryRunner.query(`ALTER TABLE "operator_profiles" DROP CONSTRAINT IF EXISTS "chk_operator_date_of_birth_reasonable"`);

        // Drop TenantProfile constraints
        await queryRunner.query(`ALTER TABLE "tenant_profiles" DROP CONSTRAINT IF EXISTS "chk_date_of_birth_reasonable"`);
        await queryRunner.query(`ALTER TABLE "tenant_profiles" DROP CONSTRAINT IF EXISTS "chk_age_range_valid"`);

        // Drop User constraints
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "chk_provider_valid"`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "chk_status_valid"`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "chk_role_valid"`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "chk_email_format"`);

        // Drop Preferences constraints
        await queryRunner.query(`ALTER TABLE "preferences" DROP CONSTRAINT IF EXISTS "chk_smoker_valid"`);
        await queryRunner.query(`ALTER TABLE "preferences" DROP CONSTRAINT IF EXISTS "chk_pets_valid"`);
        await queryRunner.query(`ALTER TABLE "preferences" DROP CONSTRAINT IF EXISTS "chk_house_shares_valid"`);
        await queryRunner.query(`ALTER TABLE "preferences" DROP CONSTRAINT IF EXISTS "chk_let_duration_valid"`);
        await queryRunner.query(`ALTER TABLE "preferences" DROP CONSTRAINT IF EXISTS "chk_furnishing_preference_valid"`);
        await queryRunner.query(`ALTER TABLE "preferences" DROP CONSTRAINT IF EXISTS "chk_move_out_after_move_in"`);
        await queryRunner.query(`ALTER TABLE "preferences" DROP CONSTRAINT IF EXISTS "chk_move_in_date_reasonable"`);
        await queryRunner.query(`ALTER TABLE "preferences" DROP CONSTRAINT IF EXISTS "chk_commute_times_valid"`);
        await queryRunner.query(`ALTER TABLE "preferences" DROP CONSTRAINT IF EXISTS "chk_bathroom_range_valid"`);
        await queryRunner.query(`ALTER TABLE "preferences" DROP CONSTRAINT IF EXISTS "chk_bedroom_range_valid"`);
        await queryRunner.query(`ALTER TABLE "preferences" DROP CONSTRAINT IF EXISTS "chk_price_range_valid"`);

        // Drop Properties constraints
        await queryRunner.query(`ALTER TABLE "properties" DROP CONSTRAINT IF EXISTS "chk_coordinates_valid"`);
        await queryRunner.query(`ALTER TABLE "properties" DROP CONSTRAINT IF EXISTS "chk_furnishing_valid"`);
        await queryRunner.query(`ALTER TABLE "properties" DROP CONSTRAINT IF EXISTS "chk_available_from_reasonable"`);
        await queryRunner.query(`ALTER TABLE "properties" DROP CONSTRAINT IF EXISTS "chk_bathrooms_non_negative"`);
        await queryRunner.query(`ALTER TABLE "properties" DROP CONSTRAINT IF EXISTS "chk_bedrooms_non_negative"`);
        await queryRunner.query(`ALTER TABLE "properties" DROP CONSTRAINT IF EXISTS "chk_price_positive"`);
    }
}

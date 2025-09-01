import { MigrationInterface, QueryRunner } from "typeorm";

export class AddLocationAndSearchOptimization1755300000000 implements MigrationInterface {
    name = 'AddLocationAndSearchOptimization1755300000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Step 1: Add PostGIS extension for advanced geospatial operations
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "postgis"`);

        // Step 2: Add geospatial column for properties (point geometry)
        await queryRunner.query(`
            ALTER TABLE "properties"
            ADD COLUMN "location" GEOMETRY(POINT, 4326)
        `);

        // Step 3: Update location column based on existing lat/lng data
        await queryRunner.query(`
            UPDATE "properties"
            SET "location" = ST_SetSRID(ST_MakePoint("lng", "lat"), 4326)
            WHERE "lat" IS NOT NULL AND "lng" IS NOT NULL
        `);

        // Step 4: Create spatial index for location-based queries
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "idx_properties_location_spatial"
            ON "properties" USING GIST ("location")
        `);

        // Step 5: Add full-text search columns
        await queryRunner.query(`
            ALTER TABLE "properties"
            ADD COLUMN "search_vector" tsvector
        `);

        // Step 6: Update search vector with searchable text
        await queryRunner.query(`
            UPDATE "properties"
            SET "search_vector" =
                setweight(to_tsvector('english', COALESCE("title", '')), 'A') ||
                setweight(to_tsvector('english', COALESCE("description", '')), 'B') ||
                setweight(to_tsvector('english', COALESCE("address", '')), 'C') ||
                setweight(to_tsvector('english', COALESCE(array_to_string("lifestyle_features", ' '), '')), 'D')
        `);

        // Step 7: Create GIN index for full-text search
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "idx_properties_search_vector"
            ON "properties" USING GIN ("search_vector")
        `);

        // Step 8: Create trigger to automatically update search vector on changes
        await queryRunner.query(`
            CREATE OR REPLACE FUNCTION update_properties_search_vector()
            RETURNS TRIGGER AS $$
            BEGIN
                NEW."search_vector" :=
                    setweight(to_tsvector('english', COALESCE(NEW."title", '')), 'A') ||
                    setweight(to_tsvector('english', COALESCE(NEW."description", '')), 'B') ||
                    setweight(to_tsvector('english', COALESCE(NEW."address", '')), 'C') ||
                    setweight(to_tsvector('english', COALESCE(array_to_string(NEW."lifestyle_features", ' '), '')), 'D');
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;
        `);

        await queryRunner.query(`
            CREATE TRIGGER tr_properties_search_vector_update
            BEFORE INSERT OR UPDATE ON "properties"
            FOR EACH ROW EXECUTE FUNCTION update_properties_search_vector();
        `);

        // Step 9: Create trigger to automatically update location on lat/lng changes
        await queryRunner.query(`
            CREATE OR REPLACE FUNCTION update_properties_location()
            RETURNS TRIGGER AS $$
            BEGIN
                IF NEW."lat" IS NOT NULL AND NEW."lng" IS NOT NULL THEN
                    NEW."location" := ST_SetSRID(ST_MakePoint(NEW."lng", NEW."lat"), 4326);
                ELSE
                    NEW."location" := NULL;
                END IF;
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;
        `);

        await queryRunner.query(`
            CREATE TRIGGER tr_properties_location_update
            BEFORE INSERT OR UPDATE ON "properties"
            FOR EACH ROW EXECUTE FUNCTION update_properties_location();
        `);

        // Step 10: Add optimized indexes for common property search patterns

        // Price and bedroom combination (most common search)
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "idx_properties_price_bedrooms_available"
            ON "properties" ("price", "bedrooms", "available_from")
            WHERE "available_from" >= CURRENT_DATE
        `);

        // Furnishing and property type combination
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "idx_properties_furnishing_types"
            ON "properties" USING GIN ("furnishing", "property_types")
        `);

        // Available properties index
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "idx_properties_available_date"
            ON "properties" ("available_from")
            WHERE "available_from" >= CURRENT_DATE
        `);

        // Operator properties index
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "idx_properties_operator_active"
            ON "properties" ("operator_id", "created_at" DESC)
        `);

        // Step 11: Add indexes for user-related queries

        // User email and status (authentication)
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "idx_users_email_status_active"
            ON "users" ("email", "status")
            WHERE "status" = 'active'
        `);

        // User role index
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "idx_users_role"
            ON "users" ("role")
            WHERE "role" IS NOT NULL
        `);

        // Google OAuth users
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "idx_users_google_id"
            ON "users" ("google_id")
            WHERE "google_id" IS NOT NULL
        `);

        // Step 12: Add indexes for preferences search optimization

        // Price range index
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "idx_preferences_price_range"
            ON "preferences" ("min_price", "max_price")
            WHERE "min_price" IS NOT NULL OR "max_price" IS NOT NULL
        `);

        // Location preferences
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "idx_preferences_location"
            ON "preferences" ("primary_postcode", "secondary_location", "commute_location")
        `);

        // Property preferences
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "idx_preferences_property_specs"
            ON "preferences" ("min_bedrooms", "max_bedrooms", "furnishing")
        `);

        // Step 13: Add indexes for shortlist and favourites performance

        // User shortlists (most recent first)
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "idx_shortlist_user_recent"
            ON "shortlist" ("userId", "created_at" DESC)
        `);

        // User favourites (most recent first)
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "idx_favourites_user_recent"
            ON "favourites" ("userId", "created_at" DESC)
        `);

        // Property popularity (how many users shortlisted/favourited)
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "idx_shortlist_property_count"
            ON "shortlist" ("propertyId")
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "idx_favourites_property_count"
            ON "favourites" ("propertyId")
        `);

        // Step 14: Add indexes for property media optimization

        // Property media ordering
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "idx_property_media_order"
            ON "property_media" ("property_id", "order_index" ASC, "is_featured" DESC)
        `);

        // Featured images only
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "idx_property_media_featured"
            ON "property_media" ("property_id", "is_featured")
            WHERE "is_featured" = true
        `);

        // Step 15: Create helper functions for common queries

        // Function to search properties within distance
        await queryRunner.query(`
            CREATE OR REPLACE FUNCTION search_properties_near_point(
                search_lat DECIMAL,
                search_lng DECIMAL,
                distance_km INTEGER DEFAULT 5
            )
            RETURNS TABLE (
                property_id UUID,
                distance_meters DECIMAL
            ) AS $$
            BEGIN
                RETURN QUERY
                SELECT
                    p.id as property_id,
                    ST_Distance(
                        p.location::geography,
                        ST_SetSRID(ST_MakePoint(search_lng, search_lat), 4326)::geography
                    ) as distance_meters
                FROM properties p
                WHERE p.location IS NOT NULL
                AND ST_DWithin(
                    p.location::geography,
                    ST_SetSRID(ST_MakePoint(search_lng, search_lat), 4326)::geography,
                    distance_km * 1000
                )
                ORDER BY distance_meters;
            END;
            $$ LANGUAGE plpgsql;
        `);

        // Function for full-text search with ranking
        await queryRunner.query(`
            CREATE OR REPLACE FUNCTION search_properties_fulltext(
                search_query TEXT,
                limit_results INTEGER DEFAULT 50
            )
            RETURNS TABLE (
                property_id UUID,
                rank REAL
            ) AS $$
            BEGIN
                RETURN QUERY
                SELECT
                    p.id as property_id,
                    ts_rank_cd(p.search_vector, plainto_tsquery('english', search_query)) as rank
                FROM properties p
                WHERE p.search_vector @@ plainto_tsquery('english', search_query)
                ORDER BY rank DESC
                LIMIT limit_results;
            END;
            $$ LANGUAGE plpgsql;
        `);

        // Step 16: Add statistics for query optimization
        await queryRunner.query(`ANALYZE "properties"`);
        await queryRunner.query(`ANALYZE "users"`);
        await queryRunner.query(`ANALYZE "preferences"`);
        await queryRunner.query(`ANALYZE "shortlist"`);
        await queryRunner.query(`ANALYZE "favourites"`);
        await queryRunner.query(`ANALYZE "property_media"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop helper functions
        await queryRunner.query(`DROP FUNCTION IF EXISTS search_properties_fulltext(TEXT, INTEGER)`);
        await queryRunner.query(`DROP FUNCTION IF EXISTS search_properties_near_point(DECIMAL, DECIMAL, INTEGER)`);

        // Drop property media indexes
        await queryRunner.query(`DROP INDEX IF EXISTS "idx_property_media_featured"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "idx_property_media_order"`);

        // Drop shortlist/favourites indexes
        await queryRunner.query(`DROP INDEX IF EXISTS "idx_favourites_property_count"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "idx_shortlist_property_count"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "idx_favourites_user_recent"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "idx_shortlist_user_recent"`);

        // Drop preferences indexes
        await queryRunner.query(`DROP INDEX IF EXISTS "idx_preferences_property_specs"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "idx_preferences_location"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "idx_preferences_price_range"`);

        // Drop user indexes
        await queryRunner.query(`DROP INDEX IF EXISTS "idx_users_google_id"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "idx_users_role"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "idx_users_email_status_active"`);

        // Drop property search indexes
        await queryRunner.query(`DROP INDEX IF EXISTS "idx_properties_operator_active"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "idx_properties_available_date"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "idx_properties_furnishing_types"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "idx_properties_price_bedrooms_available"`);

        // Drop triggers and functions
        await queryRunner.query(`DROP TRIGGER IF EXISTS tr_properties_location_update ON "properties"`);
        await queryRunner.query(`DROP FUNCTION IF EXISTS update_properties_location()`);
        await queryRunner.query(`DROP TRIGGER IF EXISTS tr_properties_search_vector_update ON "properties"`);
        await queryRunner.query(`DROP FUNCTION IF EXISTS update_properties_search_vector()`);

        // Drop full-text search index and column
        await queryRunner.query(`DROP INDEX IF EXISTS "idx_properties_search_vector"`);
        await queryRunner.query(`ALTER TABLE "properties" DROP COLUMN IF EXISTS "search_vector"`);

        // Drop spatial index and location column
        await queryRunner.query(`DROP INDEX IF EXISTS "idx_properties_location_spatial"`);
        await queryRunner.query(`ALTER TABLE "properties" DROP COLUMN IF EXISTS "location"`);

        // Note: We don't drop PostGIS extension as it might be used by other parts of the application
        // await queryRunner.query(`DROP EXTENSION IF EXISTS "postgis"`);
    }
}

import { MigrationInterface, QueryRunner } from "typeorm";

export class SeedTestProperties1735470000000 implements MigrationInterface {
  name = "SeedTestProperties1735470000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // First, let's get an operator user to assign as the property owner
    const operatorUser = await queryRunner.query(
      `SELECT id FROM users WHERE role = 'operator' LIMIT 1`
    );

    if (operatorUser.length === 0) {
      // Create a test operator if none exists
      await queryRunner.query(`
        INSERT INTO users (id, email, name, role, password_hash, created_at, updated_at)
        VALUES (
          uuid_generate_v4(),
          'operator@test.com',
          'Test Operator',
          'operator',
          '$2b$10$example.hash.here',
          CURRENT_TIMESTAMP,
          CURRENT_TIMESTAMP
        )
      `);

      const newOperator = await queryRunner.query(
        `SELECT id FROM users WHERE email = 'operator@test.com'`
      );

      // Insert test properties
      await queryRunner.query(`
        INSERT INTO properties (
          id, title, description, address, price, bedrooms, bathrooms, 
          property_type, furnishing, lifestyle_features, available_from, 
          images, is_btr, operator_id, created_at, updated_at
        ) VALUES 
        (
          uuid_generate_v4(),
          'Luxury City Centre Apartment',
          'A stunning 2-bedroom apartment in the heart of the city with panoramic views. Features modern amenities, high-end finishes, and access to premium facilities including a gym and rooftop terrace.',
          '123 Oxford Street, London W1D 2HX',
          2800.00,
          2,
          2,
          'apartment',
          'furnished',
          'gym,pool,concierge,rooftop_terrace,parking',
          '2024-02-01',
          '/property1-1.jpg,/property1-2.jpg,/property1-3.jpg',
          true,
          '${newOperator[0].id}',
          CURRENT_TIMESTAMP,
          CURRENT_TIMESTAMP
        ),
        (
          uuid_generate_v4(),
          'Modern Studio in Tech District',
          'Perfect for young professionals! This contemporary studio features smart home technology, high-speed internet, and is located in the vibrant tech district with excellent transport links.',
          '456 Tech Boulevard, Manchester M1 1AA',
          1200.00,
          1,
          1,
          'studio',
          'furnished',
          'high_speed_internet,smart_home,co_working_space,bike_storage',
          '2024-02-15',
          '/property2-1.jpg,/property2-2.jpg',
          false,
          '${newOperator[0].id}',
          CURRENT_TIMESTAMP,
          CURRENT_TIMESTAMP
        ),
        (
          uuid_generate_v4(),
          'Spacious Family Home with Garden',
          'Beautiful 3-bedroom house perfect for families. Features a large garden, modern kitchen, and is located in a quiet residential area with excellent schools nearby.',
          '789 Family Lane, Birmingham B15 2TT',
          1800.00,
          3,
          2,
          'house',
          'part-furnished',
          'garden,parking,family_friendly,pet_friendly',
          '2024-03-01',
          '/property3-1.jpg,/property3-2.jpg,/property3-3.jpg,/property3-4.jpg',
          false,
          '${newOperator[0].id}',
          CURRENT_TIMESTAMP,
          CURRENT_TIMESTAMP
        )
      `);
    } else {
      // Use existing operator
      await queryRunner.query(`
        INSERT INTO properties (
          id, title, description, address, price, bedrooms, bathrooms, 
          property_type, furnishing, lifestyle_features, available_from, 
          images, is_btr, operator_id, created_at, updated_at
        ) VALUES 
        (
          uuid_generate_v4(),
          'Luxury City Centre Apartment',
          'A stunning 2-bedroom apartment in the heart of the city with panoramic views. Features modern amenities, high-end finishes, and access to premium facilities including a gym and rooftop terrace.',
          '123 Oxford Street, London W1D 2HX',
          2800.00,
          2,
          2,
          'apartment',
          'furnished',
          'gym,pool,concierge,rooftop_terrace,parking',
          '2024-02-01',
          '/property1-1.jpg,/property1-2.jpg,/property1-3.jpg',
          true,
          '${operatorUser[0].id}',
          CURRENT_TIMESTAMP,
          CURRENT_TIMESTAMP
        ),
        (
          uuid_generate_v4(),
          'Modern Studio in Tech District',
          'Perfect for young professionals! This contemporary studio features smart home technology, high-speed internet, and is located in the vibrant tech district with excellent transport links.',
          '456 Tech Boulevard, Manchester M1 1AA',
          1200.00,
          1,
          1,
          'studio',
          'furnished',
          'high_speed_internet,smart_home,co_working_space,bike_storage',
          '2024-02-15',
          '/property2-1.jpg,/property2-2.jpg',
          false,
          '${operatorUser[0].id}',
          CURRENT_TIMESTAMP,
          CURRENT_TIMESTAMP
        ),
        (
          uuid_generate_v4(),
          'Spacious Family Home with Garden',
          'Beautiful 3-bedroom house perfect for families. Features a large garden, modern kitchen, and is located in a quiet residential area with excellent schools nearby.',
          '789 Family Lane, Birmingham B15 2TT',
          1800.00,
          3,
          2,
          'house',
          'part-furnished',
          'garden,parking,family_friendly,pet_friendly',
          '2024-03-01',
          '/property3-1.jpg,/property3-2.jpg,/property3-3.jpg,/property3-4.jpg',
          false,
          '${operatorUser[0].id}',
          CURRENT_TIMESTAMP,
          CURRENT_TIMESTAMP
        )
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM properties WHERE title IN (
      'Luxury City Centre Apartment',
      'Modern Studio in Tech District',
      'Spacious Family Home with Garden'
    )`);
  }
}

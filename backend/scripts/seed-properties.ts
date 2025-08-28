import AppDataSource from "../src/database/data-source";
import { Property } from "../src/entities/property.entity";
import { User } from "../src/entities/user.entity";
import { OperatorProfile } from "../src/entities/operator-profile.entity";
import { Shortlist } from "../src/entities/shortlist.entity";
import { Favourite } from "../src/entities/favourite.entity";
import { Like } from "typeorm";

async function seedProperties() {
  try {
    // Initialize the database connection
    await AppDataSource.initialize();
    console.log("Database connected successfully");

    const propertyRepository = AppDataSource.getRepository(Property);
    const userRepository = AppDataSource.getRepository(User);
    const operatorProfileRepository =
      AppDataSource.getRepository(OperatorProfile);
    const shortlistRepository = AppDataSource.getRepository(Shortlist);
    const favouriteRepository = AppDataSource.getRepository(Favourite);

    // Check if properties already exist
    const existingProperties = await propertyRepository.count();
    if (existingProperties > 0) {
      console.log(
        `Found ${existingProperties} existing properties. Clearing all data for fresh seed...`
      );
      // Use DELETE instead of TRUNCATE to avoid foreign key constraint issues
      await AppDataSource.query('DELETE FROM "favourites"');
      console.log("Favourites data cleared.");
      await AppDataSource.query('DELETE FROM "shortlist"');
      console.log("Shortlist data cleared.");
      await AppDataSource.query('DELETE FROM "properties"');
      console.log("Existing properties cleared.");
    }

    // Find or create an operator user
    let operator = await userRepository.findOne({
      where: { role: "operator" },
      relations: ["operatorProfile"],
    });

    if (!operator) {
      // Create a test operator if none exists
      operator = userRepository.create({
        email: "operator@test.com",
        role: "operator",
        status: "active",
        password: "$2b$10$test.hash.here", // This is just for testing
      });
      await userRepository.save(operator);

      // Create operator profile
      const operatorProfile = operatorProfileRepository.create({
        full_name: "Test Operator",
        userId: operator.id,
      });
      await operatorProfileRepository.save(operatorProfile);

      console.log("Created test operator user");
    }

    // Создаем пользователя-админа, если его нет
    let admin = await userRepository.findOne({
      where: { role: "admin" },
    });
    if (!admin) {
      admin = userRepository.create({
        email: "admin@test.com",
        role: "admin",
        status: "active",
        password: "$2b$10$admin.hash.here", // This is just for testing
      });
      await userRepository.save(admin);
      console.log("Created test admin user");
    }

    // Create 7 diverse test properties for comprehensive matching testing (to reach 10 total)
    const testProperties = [
      {
        title: "Luxury City Penthouse with Premium Amenities",
        description:
          "Exquisite penthouse apartment in the heart of London's financial district. Floor-to-ceiling windows offer breathtaking city views. This luxury residence features premium finishes, smart home technology, and exclusive access to world-class amenities including a state-of-the-art gym, infinity pool, and private rooftop terrace perfect for entertaining.",
        address: "1 Canary Wharf, London E14 5AB",
        price: 4500,
        bedrooms: 3,
        bathrooms: 2,
        property_type: "apartment",
        furnishing: "furnished",
        lifestyle_features: [
          "gym",
          "pool",
          "rooftop_terrace",
          "concierge",
          "parking",
          "security",
          "smart_home",
          "high_speed_internet",
          "city_views",
        ],
        available_from: "2024-02-01",
        images: [
          "/luxury-penthouse-1.jpg",
          "/luxury-penthouse-2.jpg",
          "/luxury-penthouse-3.jpg",
        ],
        is_btr: true,
      },
      {
        title: "Tranquil Suburban Family House with Garden Oasis",
        description:
          "Charming 4-bedroom family home nestled in a peaceful suburban neighborhood. Features a beautifully landscaped garden, dedicated pet washing station, and modern co-working space perfect for remote work. This property offers the perfect blend of comfort, functionality, and tranquility for families seeking a serene lifestyle.",
        address: "42 Maple Grove, Richmond TW9 4QF",
        price: 2200,
        bedrooms: 4,
        bathrooms: 3,
        property_type: "house",
        furnishing: "part-furnished",
        lifestyle_features: [
          "garden",
          "pet_washing_station",
          "co_working_space",
          "pet_friendly",
          "family_friendly",
          "parking",
          "quiet_area",
          "storage_space",
        ],
        available_from: "2024-02-15",
        images: [
          "/suburban-house-1.jpg",
          "/suburban-house-2.jpg",
          "/suburban-house-3.jpg",
          "/suburban-house-4.jpg",
        ],
        is_btr: false,
      },
      {
        title: "Ultra-Modern Studio with Business Facilities",
        description:
          "Cutting-edge studio apartment designed for the modern professional. Features ultra-high-speed fiber internet, in-unit laundry facilities, and access to professional meeting rooms. Located in the vibrant tech quarter with excellent transport connections and surrounded by cafes, restaurants, and networking opportunities.",
        address: "88 Silicon Street, Cambridge CB1 2JD",
        price: 1400,
        bedrooms: 1,
        bathrooms: 1,
        property_type: "studio",
        furnishing: "furnished",
        lifestyle_features: [
          "high_speed_internet",
          "laundry_facilities",
          "meeting_rooms",
          "co_working_space",
          "smart_home",
          "security",
          "bike_storage",
        ],
        available_from: "2024-03-01",
        images: ["/modern-studio-1.jpg", "/modern-studio-2.jpg"],
        is_btr: false,
      },
      {
        title: "Budget-Friendly Room in Shared House",
        description:
          "Affordable single room in a friendly shared house, perfect for students or young professionals on a budget. Clean, comfortable accommodation with shared kitchen and bathroom facilities. No additional amenities, but excellent value for money in a convenient location with good transport links.",
        address: "156 Budget Lane, Leeds LS2 8AA",
        price: 450,
        bedrooms: 1,
        bathrooms: 1,
        property_type: "room",
        furnishing: "unfurnished",
        lifestyle_features: [],
        available_from: "2024-02-10",
        images: ["/budget-room-1.jpg"],
        is_btr: false,
      },
      {
        title: "Premium BTR Flat with Entertainment Hub",
        description:
          "Stunning 2-bedroom apartment in a prestigious Build-to-Rent development. Enjoy luxury living with full furnishing, 24/7 concierge service, private cinema for residents, and an exclusive clubhouse with bar and lounge areas. This premium development offers a sophisticated lifestyle with all services managed professionally.",
        address: "25 Embassy Gardens, Nine Elms, London SW11 7BW",
        price: 3200,
        bedrooms: 2,
        bathrooms: 2,
        property_type: "apartment",
        furnishing: "furnished",
        lifestyle_features: [
          "concierge",
          "cinema",
          "clubhouse",
          "gym",
          "security",
          "parking",
          "high_speed_internet",
          "laundry_facilities",
          "events_space",
        ],
        available_from: "2024-02-20",
        images: ["/btr-flat-1.jpg", "/btr-flat-2.jpg", "/btr-flat-3.jpg"],
        is_btr: true,
      },
      {
        title: "Student Flatshare with Study-Focused Amenities",
        description:
          "Purpose-built student accommodation featuring shared living spaces designed for academic success. Includes dedicated study zones with quiet study pods, communal laundry facilities, and secure bike storage. Located near major universities with excellent student support and a vibrant community atmosphere perfect for student life.",
        address: "12 University Square, Manchester M13 9PL",
        price: 650,
        bedrooms: 1,
        bathrooms: 1,
        property_type: "room",
        furnishing: "furnished",
        lifestyle_features: [
          "study_zones",
          "laundry_facilities",
          "bike_storage",
          "student_community",
          "high_speed_internet",
          "security",
          "communal_kitchen",
          "social_spaces",
        ],
        available_from: "2024-09-01",
        images: ["/student-flat-1.jpg", "/student-flat-2.jpg"],
        is_btr: false,
      },
      {
        title: "Eco-Friendly Townhouse with Smart Features",
        description:
          "Sustainable 3-bedroom townhouse featuring solar panels, smart energy management, and eco-friendly materials throughout. Perfect for environmentally conscious families with electric car charging, rainwater harvesting, and energy-efficient appliances. Located in a green community with excellent schools nearby.",
        address: "15 Green Valley Close, Bristol BS8 3HJ",
        price: 1950,
        bedrooms: 3,
        bathrooms: 2,
        property_type: "house",
        furnishing: "part-furnished",
        lifestyle_features: [
          "eco_friendly",
          "smart_home",
          "electric_car_charging",
          "garden",
          "family_friendly",
          "energy_efficient",
          "parking",
          "quiet_area",
        ],
        available_from: "2024-03-15",
        images: [
          "/eco-townhouse-1.jpg",
          "/eco-townhouse-2.jpg",
          "/eco-townhouse-3.jpg",
        ],
        is_btr: false,
      },
      {
        title: "Minimalist Loft with Creative Workspace",
        description:
          "Unique converted warehouse loft featuring high ceilings, exposed brick walls, and abundant natural light. Includes a dedicated creative workspace, artist studio area, and modern minimalist design. Perfect for creative professionals, artists, or entrepreneurs seeking an inspiring living environment in the arts district.",
        address: "34 Warehouse Quarter, Sheffield S1 4GP",
        price: 1600,
        bedrooms: 2,
        bathrooms: 1,
        property_type: "apartment",
        furnishing: "unfurnished",
        lifestyle_features: [
          "creative_workspace",
          "artist_studio",
          "high_ceilings",
          "natural_light",
          "bike_storage",
          "arts_community",
          "flexible_space",
        ],
        available_from: "2024-02-28",
        images: ["/creative-loft-1.jpg", "/creative-loft-2.jpg"],
        is_btr: false,
      },
      {
        title: "Waterfront Apartment with Marina Views",
        description:
          "Spectacular 2-bedroom apartment overlooking the marina with floor-to-ceiling windows and private balcony. Features premium finishes, waterfront access, and exclusive marina privileges. Perfect for water sports enthusiasts with boat storage available and easy access to sailing, kayaking, and waterfront dining.",
        address: "7 Marina Point, Portsmouth PO1 3AX",
        price: 2400,
        bedrooms: 2,
        bathrooms: 2,
        property_type: "apartment",
        furnishing: "furnished",
        lifestyle_features: [
          "waterfront_access",
          "marina_views",
          "boat_storage",
          "balcony",
          "water_sports",
          "parking",
          "security",
          "luxury_finishes",
        ],
        available_from: "2024-02-05",
        images: [
          "/waterfront-apt-1.jpg",
          "/waterfront-apt-2.jpg",
          "/waterfront-apt-3.jpg",
        ],
        is_btr: false,
      },
      {
        title: "Tech-Enabled Micro Studio for Digital Nomads",
        description:
          "Ultra-compact but highly efficient micro studio designed for digital nomads and remote workers. Features murphy bed, ultra-fast fiber internet, smart storage solutions, and a dedicated workspace corner. Located in the heart of the tech district with 24/7 cafes, co-working spaces, and excellent transport links.",
        address: "99 Digital Hub, London EC2A 4NE",
        price: 1100,
        bedrooms: 1,
        bathrooms: 1,
        property_type: "studio",
        furnishing: "furnished",
        lifestyle_features: [
          "high_speed_internet",
          "smart_storage",
          "murphy_bed",
          "co_working_space",
          "24_7_access",
          "tech_district",
          "compact_living",
          "security",
        ],
        available_from: "2024-02-12",
        images: ["/micro-studio-1.jpg", "/micro-studio-2.jpg"],
        is_btr: true,
      },
    ];

    // Save properties to database
    const properties = propertyRepository.create(
      testProperties.map((property) => ({
        ...property,
        operator_id: operator.id,
      }))
    );
    await propertyRepository.save(properties);

    console.log(
      `\n🎉 Successfully seeded ${properties.length} diverse test properties for matching testing!`
    );
    console.log("\n📋 Property Summary:");
    console.log("==================");
    properties.forEach((property, index) => {
      console.log(`${index + 1}. ${property.title}`);
      console.log(`   💰 Price: £${property.price}/month`);
      console.log(
        `   🏠 Type: ${property.property_type} | 🛏️ ${property.bedrooms} bed | 🛁 ${property.bathrooms} bath`
      );
      console.log(
        `   ✨ Features: ${property.lifestyle_features.length > 0 ? property.lifestyle_features.join(", ") : "None"}`
      );
      console.log(`   🏢 BTR: ${property.is_btr ? "Yes" : "No"}`);
      console.log("");
    });

    console.log("🔍 Matching Test Coverage:");
    console.log("=========================");
    console.log("✅ Price range: £450 - £4,500 (Budget to Luxury)");
    console.log("✅ Property types: Studio, Room, Apartment, House");
    console.log("✅ Bedrooms: 1-4 bedrooms");
    console.log("✅ Furnishing: Unfurnished, Part-furnished, Furnished");
    console.log("✅ BTR options: Both BTR and non-BTR properties");
    console.log("✅ Lifestyle features: 35+ unique feature combinations");
    console.log(
      "✅ Target demographics: Students, Professionals, Families, Creatives, Digital Nomads"
    );
    console.log(
      `✅ Total properties: ${properties.length} comprehensive test cases`
    );
  } catch (error) {
    console.error("❌ Error seeding properties:", error);
  } finally {
    // Close the database connection
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

// Run the seeding script
seedProperties().catch(console.error);

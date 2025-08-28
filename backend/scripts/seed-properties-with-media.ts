import AppDataSource from "../src/database/data-source";
import { Property } from "../src/entities/property.entity";
import { PropertyMedia } from "../src/entities/property-media.entity";
import { User } from "../src/entities/user.entity";
import { OperatorProfile } from "../src/entities/operator-profile.entity";
import { S3Service } from "../src/common/services/s3.service";
import { ConfigService } from "@nestjs/config";
import * as https from "https";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";
import { Like } from "typeorm";

// Load environment variables
dotenv.config();

// Unsplash image URLs for different property types
const PROPERTY_IMAGES = {
  "modern-loft": [
    "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80",
    "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80",
    "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&q=80",
  ],
  "victorian-house": [
    "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&q=80",
    "https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=800&q=80",
    "https://images.unsplash.com/photo-1613977257363-707ba9348227?w=800&q=80",
  ],
  penthouse: [
    "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80",
    "https://images.unsplash.com/photo-1564078516393-cf04bd966897?w=800&q=80",
    "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80",
  ],
  studio: [
    "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80",
    "https://images.unsplash.com/photo-1587994621515-0e4b8e7d7b26?w=800&q=80",
  ],
  "garden-flat": [
    "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&q=80",
    "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80",
    "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=800&q=80",
  ],
  cottage: [
    "https://images.unsplash.com/photo-1449844908441-8829872d2607?w=800&q=80",
    "https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=800&q=80",
  ],
  apartment: [
    "https://images.unsplash.com/photo-1502672232498-7d4b39bdfd93?w=800&q=80",
    "https://images.unsplash.com/photo-1560185893-a55cbc8c57e8?w=800&q=80",
    "https://images.unsplash.com/photo-1581858726788-75bc0f6a952d?w=800&q=80",
  ],
  townhouse: [
    "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&q=80",
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80",
  ],
  duplex: [
    "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80",
    "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&q=80",
  ],
  warehouse: [
    "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&q=80",
    "https://images.unsplash.com/photo-1600607687644-aac4c3eac7f4?w=800&q=80",
  ],
};

// Property data to seed
const PROPERTIES_DATA = [
  {
    title: "Modern Loft in Shoreditch",
    description:
      "Stunning industrial-style loft with exposed brick walls, high ceilings, and large windows flooding the space with natural light. Features an open-plan living area, modern kitchen with high-end appliances, and a mezzanine bedroom.",
    address: "123 Brick Lane, Shoreditch, London E1 6QR",
    price: 2500,
    bedrooms: 2,
    bathrooms: 2,
    property_type: "apartment",
    furnishing: "furnished",
    lifestyle_features: [
      "exposed_brick",
      "high_ceilings",
      "modern_kitchen",
      "open_plan",
      "natural_light",
    ],
    available_from: "2024-03-01",
    is_btr: false,
    imageKey: "modern-loft",
  },
  {
    title: "Victorian Townhouse in Camden",
    description:
      "Beautiful period property with original features, including ornate fireplaces, decorative moldings, and stained glass windows. Recently renovated to combine historic charm with modern comfort.",
    address: "45 Camden High Street, Camden, London NW1 7JR",
    price: 3200,
    bedrooms: 3,
    bathrooms: 2,
    property_type: "house",
    furnishing: "part-furnished",
    lifestyle_features: [
      "period_features",
      "fireplace",
      "stained_glass",
      "high_ceilings",
      "garden",
    ],
    available_from: "2024-02-15",
    is_btr: false,
    imageKey: "victorian-house",
  },
  {
    title: "Luxury Penthouse in Canary Wharf",
    description:
      "Breathtaking penthouse with panoramic city views, floor-to-ceiling windows, and access to exclusive amenities including concierge, gym, and rooftop terrace.",
    address: "78 Canary Wharf, London E14 5AB",
    price: 4500,
    bedrooms: 2,
    bathrooms: 3,
    property_type: "apartment",
    furnishing: "furnished",
    lifestyle_features: [
      "city_views",
      "concierge",
      "gym",
      "rooftop_terrace",
      "luxury_finishes",
    ],
    available_from: "2024-02-20",
    is_btr: true,
    imageKey: "penthouse",
  },
  {
    title: "Cozy Studio in King's Cross",
    description:
      "Compact yet comfortable studio apartment perfect for professionals. Features a well-designed kitchenette, clever storage solutions, and excellent transport links.",
    address: "12 King's Cross Station Rd, London N1C 4AH",
    price: 1800,
    bedrooms: 1,
    bathrooms: 1,
    property_type: "studio",
    furnishing: "furnished",
    lifestyle_features: [
      "compact_design",
      "storage_solutions",
      "transport_links",
      "modern_kitchen",
    ],
    available_from: "2024-03-10",
    is_btr: false,
    imageKey: "studio",
  },
  {
    title: "Garden Flat in Notting Hill",
    description:
      "Charming ground floor apartment with access to a private garden. Perfect for those who love outdoor space in the heart of London. Recently refurbished with modern amenities.",
    address: "89 Portobello Road, Notting Hill, London W11 2QB",
    price: 2800,
    bedrooms: 2,
    bathrooms: 1,
    property_type: "apartment",
    furnishing: "part-furnished",
    lifestyle_features: [
      "private_garden",
      "ground_floor",
      "outdoor_space",
      "refurbished",
    ],
    available_from: "2024-02-28",
    is_btr: false,
    imageKey: "garden-flat",
  },
  {
    title: "Historic Cottage in Greenwich",
    description:
      "Unique period cottage with original character features, including exposed beams and a traditional fireplace. Nestled in a quiet street near Greenwich Park.",
    address: "15 Old Mill Lane, Greenwich, London SE10 8QY",
    price: 2200,
    bedrooms: 2,
    bathrooms: 1,
    property_type: "house",
    furnishing: "unfurnished",
    lifestyle_features: [
      "exposed_beams",
      "fireplace",
      "period_cottage",
      "quiet_street",
      "near_park",
    ],
    available_from: "2024-03-15",
    is_btr: false,
    imageKey: "cottage",
  },
  {
    title: "Contemporary Apartment in Clapham",
    description:
      "Stylish modern apartment in a popular residential area. Features sleek design, fitted wardrobes, and a private balcony overlooking communal gardens.",
    address: "32 Clapham Common South Side, London SW4 7AA",
    price: 2100,
    bedrooms: 1,
    bathrooms: 1,
    property_type: "apartment",
    furnishing: "furnished",
    lifestyle_features: [
      "modern_design",
      "fitted_wardrobes",
      "private_balcony",
      "communal_gardens",
    ],
    available_from: "2024-03-05",
    is_btr: false,
    imageKey: "apartment",
  },
  {
    title: "Family Townhouse in Hampstead",
    description:
      "Spacious family home spread over three floors with a beautiful rear garden. Perfect for families, featuring multiple reception rooms and a modern kitchen extension.",
    address: "67 Hampstead High Street, London NW3 1QX",
    price: 3800,
    bedrooms: 4,
    bathrooms: 3,
    property_type: "house",
    furnishing: "unfurnished",
    lifestyle_features: [
      "family_home",
      "rear_garden",
      "multiple_reception",
      "kitchen_extension",
      "three_floors",
    ],
    available_from: "2024-04-01",
    is_btr: false,
    imageKey: "townhouse",
  },
  {
    title: "Designer Duplex in Bermondsey",
    description:
      "Ultra-modern duplex apartment with designer finishes and smart home technology. Features a private roof terrace and parking space in a converted warehouse building.",
    address: "21 Bermondsey Street, London SE1 3UW",
    price: 3500,
    bedrooms: 2,
    bathrooms: 2,
    property_type: "apartment",
    furnishing: "furnished",
    lifestyle_features: [
      "duplex",
      "designer_finishes",
      "smart_home",
      "roof_terrace",
      "parking",
      "warehouse_conversion",
    ],
    available_from: "2024-02-25",
    is_btr: true,
    imageKey: "duplex",
  },
  {
    title: "Industrial Loft in Hackney",
    description:
      "Converted warehouse loft with soaring ceilings, concrete floors, and massive windows. Features a mezzanine level and industrial kitchen perfect for entertaining.",
    address: "156 Hackney Road, London E2 7QL",
    price: 2700,
    bedrooms: 1,
    bathrooms: 1,
    property_type: "apartment",
    furnishing: "part-furnished",
    lifestyle_features: [
      "warehouse_conversion",
      "soaring_ceilings",
      "concrete_floors",
      "massive_windows",
      "mezzanine",
      "industrial_kitchen",
    ],
    available_from: "2024-03-20",
    is_btr: false,
    imageKey: "warehouse",
  },
];

// Helper function to download image as buffer
async function downloadImage(url: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download image: ${response.statusCode}`));
        return;
      }

      const chunks: Buffer[] = [];
      response.on("data", (chunk) => chunks.push(chunk));
      response.on("end", () => resolve(Buffer.concat(chunks)));
      response.on("error", reject);
    });
  });
}

// Helper function to get filename from URL
function getFilenameFromUrl(url: string, index: number): string {
  const urlParts = url.split("?")[0].split("/");
  const photoId = urlParts[urlParts.length - 1] || `image-${index}`;
  return `${photoId}.jpg`;
}

async function seedPropertiesWithMedia() {
  try {
    console.log("🚀 Starting property seeding with real media...");

    // Initialize the database connection
    await AppDataSource.initialize();
    console.log("✅ Database connected successfully");

    const propertyRepository = AppDataSource.getRepository(Property);
    const propertyMediaRepository = AppDataSource.getRepository(PropertyMedia);
    const userRepository = AppDataSource.getRepository(User);

    // Initialize S3 service with manual configuration
    const configService = new ConfigService({
      AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
      AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
      AWS_REGION: process.env.AWS_REGION || "eu-north-1",
      AWS_S3_BUCKET_NAME:
        process.env.AWS_S3_BUCKET_NAME || "tada-media-bucket-local",
    });

    console.log("🔧 Manual ConfigService setup:");
    console.log(
      `- AWS_ACCESS_KEY_ID: ${process.env.AWS_ACCESS_KEY_ID?.substring(0, 10)}...`
    );
    console.log(
      `- AWS_SECRET_ACCESS_KEY: ${process.env.AWS_SECRET_ACCESS_KEY ? "***set" : "not set"}`
    );
    console.log(`- AWS_REGION: ${process.env.AWS_REGION}`);
    console.log(`- AWS_S3_BUCKET_NAME: ${process.env.AWS_S3_BUCKET_NAME}`);

    const s3Service = new S3Service(configService);
    console.log("✅ S3 service initialized");

    // Find or create an operator user
    let operator = await userRepository.findOne({
      where: { role: "operator" },
      relations: ["operatorProfile"],
    });

    if (!operator) {
      // Create a test operator if none exists
      operator = userRepository.create({
        email: "operator@tada.com",
        role: "operator",
        status: "active",
        password: "$2b$10$test.hash.here", // This is just for testing
      });
      await userRepository.save(operator);

      // Create operator profile
      const operatorProfileRepository =
        AppDataSource.getRepository(OperatorProfile);
      const operatorProfile = operatorProfileRepository.create({
        full_name: "TaDa Property Operator",
        userId: operator.id,
      });
      await operatorProfileRepository.save(operatorProfile);

      console.log("✅ Created test operator user");
    }

    console.log(`👤 Using operator: ${operator.full_name} (${operator.email})`);

    // Check if properties already exist
    const existingProperties = await propertyRepository.count();
    if (existingProperties > 0) {
      console.log(
        `⚠️  Found ${existingProperties} existing properties. Clearing all data for fresh seed...`
      );
      await AppDataSource.query('DELETE FROM "property_media"');
      console.log("✅ Property media cleared");
      await AppDataSource.query('DELETE FROM "properties"');
      console.log("✅ Properties cleared");
    }

    console.log("🏠 Creating properties with real images...");

    for (const [index, propertyData] of PROPERTIES_DATA.entries()) {
      console.log(
        `\n📝 Processing property ${index + 1}/10: ${propertyData.title}`
      );

      try {
        // Create property first
        const property = propertyRepository.create({
          ...propertyData,
          operator_id: operator.id,
          available_from: new Date(propertyData.available_from),
          images: [], // We'll use PropertyMedia instead
        });

        const savedProperty = await propertyRepository.save(property);
        console.log(`   ✅ Property created with ID: ${savedProperty.id}`);

        // Download and upload images for this property
        const imageUrls = PROPERTY_IMAGES[propertyData.imageKey];
        console.log(`   📸 Processing ${imageUrls.length} images...`);

        for (const [imageIndex, imageUrl] of imageUrls.entries()) {
          try {
            console.log(
              `      ⬇️  Downloading image ${imageIndex + 1}/${imageUrls.length}...`
            );
            const imageBuffer = await downloadImage(imageUrl);

            const originalFilename = getFilenameFromUrl(imageUrl, imageIndex);
            const s3Key = s3Service.generateFileKey(
              originalFilename,
              `properties/${savedProperty.id}`
            );

            console.log(`      ⬆️  Uploading to S3 with key: ${s3Key}`);
            const uploadResult = await s3Service.uploadFile(
              imageBuffer,
              s3Key,
              "image/jpeg",
              originalFilename
            );

            // Create PropertyMedia record
            const propertyMedia = propertyMediaRepository.create({
              property_id: savedProperty.id,
              url: uploadResult.url,
              s3_key: uploadResult.key,
              type: "image",
              mime_type: "image/jpeg",
              original_filename: originalFilename,
              file_size: imageBuffer.length,
              order_index: imageIndex,
              is_featured: imageIndex === 0, // First image is featured
            });

            await propertyMediaRepository.save(propertyMedia);
            console.log(
              `      ✅ Media record created (featured: ${imageIndex === 0})`
            );
          } catch (imageError) {
            console.error(
              `      ❌ Error processing image ${imageIndex + 1}:`,
              imageError.message
            );
          }
        }

        console.log(
          `   ✅ Property "${propertyData.title}" completed successfully`
        );
      } catch (propertyError) {
        console.error(
          `❌ Error creating property "${propertyData.title}":`,
          propertyError.message
        );
      }
    }

    console.log("\n🎉 Property seeding completed!");

    // Show summary
    const totalProperties = await propertyRepository.count();
    const totalMedia = await propertyMediaRepository.count();
    console.log(`📊 Summary:`);
    console.log(`   - Total properties created: ${totalProperties}`);
    console.log(`   - Total media files uploaded: ${totalMedia}`);
  } catch (error) {
    console.error("💥 Fatal error during seeding:", error);
    throw error;
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      console.log("🔌 Database connection closed");
    }
  }
}

// Run the seeding script
if (require.main === module) {
  seedPropertiesWithMedia()
    .then(() => {
      console.log("✅ Seeding completed successfully!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Seeding failed:", error);
      process.exit(1);
    });
}

export default seedPropertiesWithMedia;

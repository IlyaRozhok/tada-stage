#!/usr/bin/env node

/**
 * 🏠 Database Seeding Script
 *
 * Creates operators and properties for testing the platform
 * - 5 operators with realistic data
 * - 20 properties (4 per operator)
 * - High-quality images for each property
 */

const axios = require("axios");
const FormData = require("form-data");

// Configuration
const API_BASE_URL = "http://localhost:3001/api";
const OPERATORS_COUNT = 5;
const PROPERTIES_PER_OPERATOR = 4;

// Operator data
const operators = [
  {
    email: "operator1@tada.com",
    password: "password123",
    name: "John Smith",
    company_name: "Smith Properties Ltd",
    phone: "+44 7700 900001",
    business_address: "123 Business St, London",
    years_experience: 8,
    operating_areas: ["Central London", "East London"],
    business_description:
      "We specialize in luxury residential properties in prime London locations.",
  },
  {
    email: "operator2@tada.com",
    password: "password123",
    name: "Sarah Johnson",
    company_name: "Johnson Real Estate",
    phone: "+44 7700 900002",
    business_address: "456 Property Ave, Manchester",
    years_experience: 12,
    operating_areas: ["Manchester", "Liverpool"],
    business_description:
      "Family-owned business with over a decade of experience in residential properties.",
  },
  {
    email: "operator3@tada.com",
    password: "password123",
    name: "Michael Brown",
    company_name: "Brown & Associates",
    phone: "+44 7700 900003",
    business_address: "789 Estate Rd, Birmingham",
    years_experience: 15,
    operating_areas: ["Birmingham", "Coventry"],
    business_description:
      "Premium property management with focus on student accommodation and family homes.",
  },
  {
    email: "operator4@tada.com",
    password: "password123",
    name: "Emma Wilson",
    company_name: "Wilson Properties",
    phone: "+44 7700 900004",
    business_address: "321 Property Lane, Edinburgh",
    years_experience: 10,
    operating_areas: ["Edinburgh", "Glasgow"],
    business_description:
      "Scottish property specialists with deep local knowledge and excellent tenant relations.",
  },
  {
    email: "operator5@tada.com",
    password: "password123",
    name: "David Taylor",
    company_name: "Taylor Estates",
    phone: "+44 7700 900005",
    business_address: "654 Estate Way, Bristol",
    years_experience: 6,
    operating_areas: ["Bristol", "Bath"],
    business_description:
      "Modern property solutions for young professionals and families in the South West.",
  },
];

// Property data templates
const propertyTemplates = {
  london: [
    {
      title: "Luxury Apartment in Canary Wharf",
      description:
        "Stunning modern apartment with panoramic city views. Features include floor-to-ceiling windows, premium finishes, and access to world-class amenities including gym, concierge, and rooftop terrace.",
      address: "25 Canada Square, Canary Wharf, London E14 5LQ",
      property_type: "apartment",
      bedrooms: 2,
      bathrooms: 2,
      price: 4500,
      furnishing: "fully_furnished",
      available_from: "2024-02-01",
      lifestyle_features: [
        "gym",
        "concierge",
        "rooftop_terrace",
        "parking",
        "security",
      ],
    },
    {
      title: "Modern Studio in Shoreditch",
      description:
        "Contemporary studio apartment in the heart of Shoreditch. Perfect for young professionals, featuring open-plan living, modern kitchen, and access to trendy cafes and nightlife.",
      address: "42 Brick Lane, Shoreditch, London E1 6RF",
      property_type: "studio",
      bedrooms: 0,
      bathrooms: 1,
      price: 1800,
      furnishing: "fully_furnished",
      available_from: "2024-01-15",
      lifestyle_features: [
        "high_speed_wifi",
        "co_working_space",
        "bike_storage",
      ],
    },
    {
      title: "Family House in Hampstead",
      description:
        "Beautiful Victorian house with garden in prestigious Hampstead. Perfect for families, featuring period features, modern kitchen, and private garden. Close to excellent schools and Hampstead Heath.",
      address: "15 Hampstead High Street, Hampstead, London NW3 1QP",
      property_type: "house",
      bedrooms: 4,
      bathrooms: 3,
      price: 4200,
      furnishing: "unfurnished",
      available_from: "2024-03-01",
      lifestyle_features: ["garden", "parking", "pet_friendly", "storage"],
    },
    {
      title: "Executive Apartment in Mayfair",
      description:
        "Luxurious apartment in exclusive Mayfair. Features include marble bathrooms, designer kitchen, and 24/7 concierge service. Walking distance to Bond Street and Hyde Park.",
      address: "8 Grosvenor Square, Mayfair, London W1K 6LD",
      property_type: "apartment",
      bedrooms: 3,
      bathrooms: 2,
      price: 5500,
      furnishing: "fully_furnished",
      available_from: "2024-02-15",
      lifestyle_features: [
        "concierge",
        "valet",
        "spa",
        "wine_cellar",
        "security",
      ],
    },
  ],
  manchester: [
    {
      title: "Modern Apartment in Northern Quarter",
      description:
        "Stylish apartment in Manchester's creative Northern Quarter. Features include exposed brick walls, modern kitchen, and access to trendy bars and restaurants.",
      address: "28 Thomas Street, Northern Quarter, Manchester M4 1ER",
      property_type: "apartment",
      bedrooms: 2,
      bathrooms: 1,
      price: 1200,
      furnishing: "fully_furnished",
      available_from: "2024-02-01",
      lifestyle_features: [
        "high_speed_wifi",
        "co_working_space",
        "bike_storage",
      ],
    },
    {
      title: "Student Studio near University",
      description:
        "Perfect student accommodation near Manchester University. Features include study area, modern kitchenette, and access to student facilities.",
      address: "45 Oxford Road, Manchester M1 7ED",
      property_type: "studio",
      bedrooms: 0,
      bathrooms: 1,
      price: 800,
      furnishing: "fully_furnished",
      available_from: "2024-01-15",
      lifestyle_features: ["high_speed_wifi", "study_space", "laundry"],
    },
    {
      title: "Family House in Didsbury",
      description:
        "Spacious family home in leafy Didsbury. Features include large garden, modern kitchen, and excellent schools nearby. Perfect for families.",
      address: "12 Wilmslow Road, Didsbury, Manchester M20 6RQ",
      property_type: "house",
      bedrooms: 3,
      bathrooms: 2,
      price: 1800,
      furnishing: "unfurnished",
      available_from: "2024-03-01",
      lifestyle_features: ["garden", "parking", "pet_friendly", "storage"],
    },
    {
      title: "Luxury Apartment in Spinningfields",
      description:
        "High-end apartment in Manchester's business district. Features include floor-to-ceiling windows, premium finishes, and concierge service.",
      address: "5 Hardman Square, Spinningfields, Manchester M3 3EB",
      property_type: "apartment",
      bedrooms: 2,
      bathrooms: 2,
      price: 2000,
      furnishing: "fully_furnished",
      available_from: "2024-02-15",
      lifestyle_features: ["concierge", "gym", "parking", "security"],
    },
  ],
  birmingham: [
    {
      title: "Modern Apartment in City Center",
      description:
        "Contemporary apartment in Birmingham's city center. Features include modern kitchen, open-plan living, and excellent transport links.",
      address: "25 Colmore Row, Birmingham B3 2BS",
      property_type: "apartment",
      bedrooms: 2,
      bathrooms: 1,
      price: 1000,
      furnishing: "fully_furnished",
      available_from: "2024-02-01",
      lifestyle_features: ["high_speed_wifi", "parking", "security"],
    },
    {
      title: "Student Studio near University",
      description:
        "Perfect student accommodation near Birmingham University. Features include study area, modern kitchenette, and access to student facilities.",
      address: "42 Edgbaston Park Road, Birmingham B15 2RS",
      property_type: "studio",
      bedrooms: 0,
      bathrooms: 1,
      price: 750,
      furnishing: "fully_furnished",
      available_from: "2024-01-15",
      lifestyle_features: ["high_speed_wifi", "study_space", "laundry"],
    },
    {
      title: "Family House in Moseley",
      description:
        "Spacious family home in leafy Moseley. Features include large garden, modern kitchen, and excellent schools nearby.",
      address: "8 Alcester Road, Moseley, Birmingham B13 8JP",
      property_type: "house",
      bedrooms: 3,
      bathrooms: 2,
      price: 1600,
      furnishing: "unfurnished",
      available_from: "2024-03-01",
      lifestyle_features: ["garden", "parking", "pet_friendly", "storage"],
    },
    {
      title: "Luxury Apartment in Mailbox",
      description:
        "High-end apartment in Birmingham's Mailbox complex. Features include premium finishes, concierge service, and excellent amenities.",
      address: "15 The Mailbox, Birmingham B1 1RF",
      property_type: "apartment",
      bedrooms: 2,
      bathrooms: 2,
      price: 1800,
      furnishing: "fully_furnished",
      available_from: "2024-02-15",
      lifestyle_features: ["concierge", "gym", "parking", "security"],
    },
  ],
  edinburgh: [
    {
      title: "Historic Apartment in Old Town",
      description:
        "Beautiful period apartment in Edinburgh's historic Old Town. Features include original features, modern kitchen, and stunning city views.",
      address: "15 Royal Mile, Edinburgh EH1 2RE",
      property_type: "apartment",
      bedrooms: 2,
      bathrooms: 1,
      price: 1400,
      furnishing: "fully_furnished",
      available_from: "2024-02-01",
      lifestyle_features: ["historic_features", "city_views", "storage"],
    },
    {
      title: "Student Studio near University",
      description:
        "Perfect student accommodation near Edinburgh University. Features include study area, modern kitchenette, and access to student facilities.",
      address: "28 George Square, Edinburgh EH8 9JZ",
      property_type: "studio",
      bedrooms: 0,
      bathrooms: 1,
      price: 900,
      furnishing: "fully_furnished",
      available_from: "2024-01-15",
      lifestyle_features: ["high_speed_wifi", "study_space", "laundry"],
    },
    {
      title: "Family House in Morningside",
      description:
        "Spacious family home in prestigious Morningside. Features include large garden, modern kitchen, and excellent schools nearby.",
      address: "12 Morningside Road, Edinburgh EH10 4DD",
      property_type: "house",
      bedrooms: 3,
      bathrooms: 2,
      price: 2000,
      furnishing: "unfurnished",
      available_from: "2024-03-01",
      lifestyle_features: ["garden", "parking", "pet_friendly", "storage"],
    },
    {
      title: "Luxury Apartment in New Town",
      description:
        "High-end apartment in Edinburgh's elegant New Town. Features include period features, modern kitchen, and concierge service.",
      address: "8 Charlotte Square, Edinburgh EH2 4DR",
      property_type: "apartment",
      bedrooms: 2,
      bathrooms: 2,
      price: 2200,
      furnishing: "fully_furnished",
      available_from: "2024-02-15",
      lifestyle_features: [
        "concierge",
        "period_features",
        "parking",
        "security",
      ],
    },
  ],
  bristol: [
    {
      title: "Modern Apartment in City Center",
      description:
        "Contemporary apartment in Bristol's city center. Features include modern kitchen, open-plan living, and excellent transport links.",
      address: "18 Park Street, Bristol BS1 5NG",
      property_type: "apartment",
      bedrooms: 2,
      bathrooms: 1,
      price: 1200,
      furnishing: "fully_furnished",
      available_from: "2024-02-01",
      lifestyle_features: ["high_speed_wifi", "parking", "security"],
    },
    {
      title: "Student Studio near University",
      description:
        "Perfect student accommodation near Bristol University. Features include study area, modern kitchenette, and access to student facilities.",
      address: "35 Tyndall Avenue, Bristol BS8 1TQ",
      property_type: "studio",
      bedrooms: 0,
      bathrooms: 1,
      price: 800,
      furnishing: "fully_furnished",
      available_from: "2024-01-15",
      lifestyle_features: ["high_speed_wifi", "study_space", "laundry"],
    },
    {
      title: "Family House in Clifton",
      description:
        "Spacious family home in prestigious Clifton. Features include large garden, modern kitchen, and excellent schools nearby.",
      address: "8 Clifton Down, Bristol BS8 3BY",
      property_type: "house",
      bedrooms: 3,
      bathrooms: 2,
      price: 1800,
      furnishing: "unfurnished",
      available_from: "2024-03-01",
      lifestyle_features: ["garden", "parking", "pet_friendly", "storage"],
    },
    {
      title: "Luxury Apartment in Harbourside",
      description:
        "High-end apartment in Bristol's Harbourside area. Features include premium finishes, concierge service, and excellent amenities.",
      address: "12 Harbourside, Bristol BS1 5DB",
      property_type: "apartment",
      bedrooms: 2,
      bathrooms: 2,
      price: 2000,
      furnishing: "fully_furnished",
      available_from: "2024-02-15",
      lifestyle_features: ["concierge", "gym", "parking", "security"],
    },
  ],
};

// Image URLs for different property types
const imageUrls = {
  luxury_apartment: [
    "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1560448204-603b3fc33ddc?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1560448204-5d4b0b0b0b0b?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1560448204-6b0b0b0b0b0b?w=800&h=600&fit=crop",
  ],
  studio: [
    "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1522708323590-d24dbb6b0268?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1522708323590-d24dbb6b0269?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1522708323590-d24dbb6b0270?w=800&h=600&fit=crop",
  ],
  house: [
    "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1564013799919-ab600027ffc7?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1564013799919-ab600027ffc8?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1564013799919-ab600027ffc9?w=800&h=600&fit=crop",
  ],
  modern_apartment: [
    "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1502672260266-1c1ef2d93689?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1502672260266-1c1ef2d93690?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1502672260266-1c1ef2d93691?w=800&h=600&fit=crop",
  ],
};

// Helper functions
async function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function downloadImage(url) {
  try {
    const response = await axios.get(url, { responseType: "arraybuffer" });
    return Buffer.from(response.data);
  } catch (error) {
    console.error(`❌ Failed to download image: ${url}`, error.message);
    return null;
  }
}

async function registerOperator(operatorData) {
  try {
    console.log(`📝 Registering operator: ${operatorData.name}`);
    const response = await axios.post(`${API_BASE_URL}/auth/register`, {
      email: operatorData.email,
      password: operatorData.password,
      role: "operator",
    });

    if (response.data.accessToken) {
      console.log(`✅ Operator registered: ${operatorData.email}`);
      return response.data.accessToken;
    } else {
      throw new Error("No access token received");
    }
  } catch (error) {
    if (error.response?.status === 409) {
      console.log(`⚠️  Operator already exists: ${operatorData.email}`);
      // Try to login instead
      try {
        const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
          email: operatorData.email,
          password: operatorData.password,
        });
        return loginResponse.data.accessToken;
      } catch (loginError) {
        console.error(
          `❌ Failed to login existing operator: ${operatorData.email}`
        );
        throw loginError;
      }
    } else {
      console.error(
        `❌ Failed to register operator: ${operatorData.email}`,
        error.response?.data
      );
      throw error;
    }
  }
}

async function updateOperatorProfile(token, operatorData) {
  try {
    console.log(`👤 Updating operator profile for: ${operatorData.name}`);
    const response = await axios.put(
      `${API_BASE_URL}/users/profile`,
      {
        full_name: operatorData.name,
        company_name: operatorData.company_name,
        phone: operatorData.phone,
        business_address: operatorData.business_address,
        years_experience: operatorData.years_experience,
        operating_areas: operatorData.operating_areas,
        business_description: operatorData.business_description,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    console.log(`✅ Operator profile updated: ${operatorData.name}`);
    return response.data;
  } catch (error) {
    console.error(
      `❌ Failed to update operator profile: ${operatorData.name}`,
      error.response?.data
    );
    throw error;
  }
}

async function createProperty(token, propertyData) {
  try {
    console.log(`🏠 Creating property: ${propertyData.title}`);
    const response = await axios.post(
      `${API_BASE_URL}/properties`,
      propertyData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    console.log(`✅ Property created: ${propertyData.title}`);
    return response.data;
  } catch (error) {
    console.error(
      `❌ Failed to create property: ${propertyData.title}`,
      error.response?.data
    );
    throw error;
  }
}

async function addPropertyImages(token, propertyId, images) {
  try {
    console.log(`📸 Adding images to property: ${propertyId}`);

    for (let i = 0; i < images.length; i++) {
      const imageBuffer = await downloadImage(images[i]);
      if (!imageBuffer) continue;

      const formData = new FormData();
      formData.append("file", imageBuffer, {
        filename: `property-${propertyId}-${i + 1}.jpg`,
        contentType: "image/jpeg",
      });

      await axios.post(
        `${API_BASE_URL}/properties/${propertyId}/media`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            ...formData.getHeaders(),
          },
        }
      );

      // Small delay to avoid overwhelming the server
      await delay(200);
    }

    console.log(`✅ Added ${images.length} images to property: ${propertyId}`);
  } catch (error) {
    console.error(
      `❌ Failed to add images to property: ${propertyId}`,
      error.response?.data
    );
  }
}

function getImageUrls(propertyType) {
  switch (propertyType) {
    case "apartment":
      return Math.random() > 0.5
        ? imageUrls.luxury_apartment
        : imageUrls.modern_apartment;
    case "studio":
      return imageUrls.studio;
    case "house":
      return imageUrls.house;
    default:
      return imageUrls.modern_apartment;
  }
}

// Main seeding function
async function seedDatabase() {
  console.log("🚀 Starting database seeding...");
  console.log(
    `📋 Creating ${OPERATORS_COUNT} operators with ${PROPERTIES_PER_OPERATOR} properties each`
  );
  console.log("");

  // Check if backend is running
  try {
    await axios.get(`${API_BASE_URL}/health`);
    console.log("✅ Backend server is running");
  } catch (error) {
    console.error("❌ Backend server is not running on http://localhost:3001");
    console.log("Please start the backend server first:");
    console.log("cd backend && npm run start:dev");
    process.exit(1);
  }

  const cityKeys = [
    "london",
    "manchester",
    "birmingham",
    "edinburgh",
    "bristol",
  ];
  let totalProperties = 0;
  let totalImages = 0;

  for (let i = 0; i < OPERATORS_COUNT; i++) {
    const operator = operators[i];
    const cityKey = cityKeys[i];
    const properties = propertyTemplates[cityKey];

    console.log(
      `\n🏢 Processing operator ${i + 1}/${OPERATORS_COUNT}: ${operator.name}`
    );
    console.log("=".repeat(50));

    try {
      // Register operator
      const token = await registerOperator(operator);
      await delay(500);

      // Update operator profile
      await updateOperatorProfile(token, operator);
      await delay(500);

      // Create properties
      for (let j = 0; j < PROPERTIES_PER_OPERATOR; j++) {
        const propertyData = properties[j];
        const property = await createProperty(token, propertyData);
        totalProperties++;

        // Add images
        const images = getImageUrls(propertyData.property_type);
        await addPropertyImages(token, property.id, images);
        totalImages += images.length;

        await delay(300);
      }

      console.log(
        `✅ Operator ${operator.name} completed with ${PROPERTIES_PER_OPERATOR} properties`
      );
    } catch (error) {
      console.error(
        `❌ Failed to process operator: ${operator.name}`,
        error.message
      );
    }
  }

  console.log("\n🎉 Database seeding completed!");
  console.log("=".repeat(50));
  console.log(`📊 Summary:`);
  console.log(`   • ${OPERATORS_COUNT} operators created`);
  console.log(`   • ${totalProperties} properties created`);
  console.log(`   • ${totalImages} images added`);
  console.log("");
  console.log("📝 LOGIN CREDENTIALS:");
  console.log("===================");
  operators.forEach((operator, index) => {
    console.log(`${index + 1}. ${operator.email} / password123`);
  });
  console.log("");
  console.log("🏠 Each property has 4 high-quality images");
  console.log("💰 Price range: £750 - £5500/month");
  console.log("🏢 Property types: Apartments, Studios, Houses");
  console.log("");
  console.log(
    "You can now login as any of these operators to manage their properties!"
  );
}

// Run the seeding
if (require.main === module) {
  seedDatabase().catch((error) => {
    console.error("❌ Seeding failed:", error.message);
    process.exit(1);
  });
}

module.exports = { seedDatabase };

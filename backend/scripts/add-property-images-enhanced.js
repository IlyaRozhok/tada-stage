const axios = require("axios");

// Конфигурация
const API_BASE_URL = "http://localhost:3001";

// Данные операторов для входа
const operators = [
  {
    email: "operator1@tada.com",
    password: "password123",
  },
  {
    email: "operator2@tada.com",
    password: "password123",
  },
  {
    email: "operator3@tada.com",
    password: "password123",
  },
  {
    email: "operator4@tada.com",
    password: "password123",
  },
  {
    email: "operator5@tada.com",
    password: "password123",
  },
];

// Разнообразные фотографии для разных типов недвижимости
const propertyImages = {
  // Luxury apartments (London)
  luxury_apartment: [
    "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1560448075-bb485b067938?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1560448204-603b3fc33ddc?w=800&h=600&fit=crop",
  ],
  // Studios
  studio: [
    "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1560185893-a55cbc8c57e8?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1560185127-6ed189bf02f4?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1560448204-603b3fc33ddc?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1560448075-bb485b067938?w=800&h=600&fit=crop",
  ],
  // Family houses
  house: [
    "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop",
  ],
  // Modern apartments
  apartment: [
    "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1560448075-bb485b067938?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1560448204-603b3fc33ddc?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1560185893-a55cbc8c57e8?w=800&h=600&fit=crop",
  ],
  // Student accommodation
  student: [
    "https://images.unsplash.com/photo-1560185127-6ed189bf02f4?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1560185893-a55cbc8c57e8?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1560448204-603b3fc33ddc?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1560448075-bb485b067938?w=800&h=600&fit=crop",
  ],
};

// Функция для определения типа изображений на основе названия свойства
function getImageTypeForProperty(propertyTitle) {
  const title = propertyTitle.toLowerCase();

  if (title.includes("luxury") || title.includes("premium")) {
    return "luxury_apartment";
  } else if (title.includes("studio")) {
    return "studio";
  } else if (title.includes("house") || title.includes("home")) {
    return "house";
  } else if (title.includes("student")) {
    return "student";
  } else {
    return "apartment";
  }
}

async function loginOperator(operatorData) {
  try {
    console.log(`🔍 Logging in operator: ${operatorData.email}`);

    const response = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: operatorData.email,
      password: operatorData.password,
    });

    console.log(`✅ Operator logged in: ${operatorData.email}`);
    return response.data.access_token;
  } catch (error) {
    console.error(
      `❌ Failed to login operator ${operatorData.email}:`,
      error.response?.data || error.message
    );
    return null;
  }
}

async function getOperatorProperties(accessToken) {
  try {
    const response = await axios.get(`${API_BASE_URL}/properties`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    return response.data;
  } catch (error) {
    console.error(
      `❌ Failed to get properties:`,
      error.response?.data || error.message
    );
    return [];
  }
}

async function addImagesToProperty(
  accessToken,
  propertyId,
  propertyTitle,
  images
) {
  try {
    console.log(
      `  📸 Adding ${images.length} images to property: ${propertyTitle}`
    );

    // Добавляем изображения по одному
    for (let i = 0; i < images.length; i++) {
      const imageUrl = images[i];

      try {
        const response = await axios.post(
          `${API_BASE_URL}/properties/${propertyId}/media`,
          {
            url: imageUrl,
            order_index: i,
            is_primary: i === 0, // Первое изображение как основное
          },
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
          }
        );

        console.log(`    ✅ Image ${i + 1} added successfully`);
      } catch (imageError) {
        console.error(
          `    ❌ Failed to add image ${i + 1}:`,
          imageError.response?.data || imageError.message
        );
      }
    }
  } catch (error) {
    console.error(
      `❌ Failed to add images to property ${propertyId}:`,
      error.response?.data || error.message
    );
  }
}

async function addImagesToAllProperties() {
  console.log("🚀 Starting enhanced image addition to properties...");
  console.log("📋 Adding diverse images to all properties...\n");

  for (let i = 0; i < operators.length; i++) {
    const operator = operators[i];

    console.log(
      `👤 Processing operator ${i + 1}/${operators.length}: ${operator.email}`
    );

    // Login operator
    const accessToken = await loginOperator(operator);

    if (!accessToken) {
      console.log(
        `⚠️ Skipping operator ${operator.email} due to login failure`
      );
      continue;
    }

    // Get operator's properties
    const properties = await getOperatorProperties(accessToken);

    if (!properties || properties.length === 0) {
      console.log(`⚠️ No properties found for operator ${operator.email}`);
      continue;
    }

    console.log(
      `  🏠 Found ${properties.length} properties for ${operator.email}`
    );

    // Add images to each property
    for (let j = 0; j < properties.length; j++) {
      const property = properties[j];
      const imageType = getImageTypeForProperty(property.title);
      const images = propertyImages[imageType] || propertyImages.apartment;
      const propertyImages = images.slice(0, 4); // Добавляем по 4 изображения на свойство

      console.log(
        `  🏠 Adding ${imageType} images to property: ${property.title}`
      );
      await addImagesToProperty(
        accessToken,
        property.id,
        property.title,
        propertyImages
      );
    }

    console.log(`✅ Completed operator ${i + 1}/${operators.length}\n`);
  }

  console.log("🎉 Enhanced image addition completed!");
  console.log("\n📸 Image types used:");
  console.log("- luxury_apartment: High-end apartment images");
  console.log("- studio: Compact studio images");
  console.log("- house: Family house images");
  console.log("- apartment: Modern apartment images");
  console.log("- student: Student accommodation images");
}

// Run the enhanced image addition
addImagesToAllProperties().catch(console.error);

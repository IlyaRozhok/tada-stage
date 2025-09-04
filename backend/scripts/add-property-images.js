const axios = require("axios");
const fs = require("fs");
const path = require("path");

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

// Фотографии для каждого типа недвижимости
const propertyImages = {
  // London properties
  london: [
    "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1560448075-bb485b067938?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1560448204-603b3fc33ddc?w=800&h=600&fit=crop",
  ],
  // Manchester properties
  manchester: [
    "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1560448075-bb485b067938?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1560448204-603b3fc33ddc?w=800&h=600&fit=crop",
  ],
  // Birmingham properties
  birmingham: [
    "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1560448075-bb485b067938?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1560448204-603b3fc33ddc?w=800&h=600&fit=crop",
  ],
  // Edinburgh properties
  edinburgh: [
    "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1560448075-bb485b067938?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1560448204-603b3fc33ddc?w=800&h=600&fit=crop",
  ],
  // Bristol properties
  bristol: [
    "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1560448075-bb485b067938?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1560448204-603b3fc33ddc?w=800&h=600&fit=crop",
  ],
};

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

async function addImagesToProperty(accessToken, propertyId, images) {
  try {
    console.log(
      `  📸 Adding ${images.length} images to property ${propertyId}`
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
  console.log("🚀 Starting image addition to properties...");
  console.log("📋 Adding images to all properties...\n");

  for (let i = 0; i < operators.length; i++) {
    const operator = operators[i];
    const cityKey = Object.keys(propertyImages)[i]; // london, manchester, etc.
    const images = propertyImages[cityKey];

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
      const propertyImages = images.slice(0, 3); // Добавляем по 3 изображения на свойство

      console.log(`  🏠 Adding images to property: ${property.title}`);
      await addImagesToProperty(accessToken, property.id, propertyImages);
    }

    console.log(`✅ Completed operator ${i + 1}/${operators.length}\n`);
  }

  console.log("🎉 Image addition completed!");
}

// Run the image addition
addImagesToAllProperties().catch(console.error);

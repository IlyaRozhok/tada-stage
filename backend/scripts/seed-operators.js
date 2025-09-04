const axios = require("axios");

// Конфигурация
const API_BASE_URL = "http://localhost:3001";
const OPERATORS_COUNT = 5;
const PROPERTIES_PER_OPERATOR = 5;

// Данные операторов
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
    business_address: "321 Rental St, Edinburgh",
    years_experience: 10,
    operating_areas: ["Edinburgh", "Glasgow"],
    business_description:
      "Modern properties with excellent amenities and prime locations.",
  },
  {
    email: "operator5@tada.com",
    password: "password123",
    name: "David Taylor",
    company_name: "Taylor Estates",
    phone: "+44 7700 900005",
    business_address: "654 Housing Blvd, Bristol",
    years_experience: 6,
    operating_areas: ["Bristol", "Cardiff"],
    business_description:
      "Contemporary living spaces designed for modern lifestyles.",
  },
];

// Шаблоны свойств для каждого оператора
const propertyTemplates = [
  // Оператор 1 - London
  [
    {
      title: "Luxury 2-Bedroom Apartment",
      description:
        "Stunning modern apartment in the heart of London with panoramic city views.",
      address: "15 Park Lane, Mayfair, London",
      price: 2500,
      bedrooms: 2,
      bathrooms: 2,
      property_type: "apartment",
      furnished: true,
      available_from: "2024-01-15",
      features: ["Balcony", "Gym", "Concierge", "Parking"],
    },
    {
      title: "Cozy Studio in Soho",
      description:
        "Perfect studio apartment in vibrant Soho, ideal for young professionals.",
      address: "28 Dean Street, Soho, London",
      price: 1800,
      bedrooms: 1,
      bathrooms: 1,
      property_type: "studio",
      furnished: true,
      available_from: "2024-02-01",
      features: ["High-speed internet", "Modern kitchen", "Security system"],
    },
    {
      title: "Family Home in Chelsea",
      description:
        "Beautiful 4-bedroom family home in prestigious Chelsea neighborhood.",
      address: "45 King's Road, Chelsea, London",
      price: 4500,
      bedrooms: 4,
      bathrooms: 3,
      property_type: "house",
      furnished: false,
      available_from: "2024-01-20",
      features: ["Garden", "Garage", "Fireplace", "Study"],
    },
    {
      title: "Modern 3-Bedroom Flat",
      description:
        "Contemporary 3-bedroom flat with excellent transport links.",
      address: "12 Canary Wharf, Docklands, London",
      price: 3200,
      bedrooms: 3,
      bathrooms: 2,
      property_type: "apartment",
      furnished: true,
      available_from: "2024-02-10",
      features: ["River view", "Gym", "Pool", "24/7 security"],
    },
    {
      title: "Charming 1-Bedroom Flat",
      description:
        "Charming period property with modern amenities in Kensington.",
      address: "8 Kensington High Street, Kensington, London",
      price: 2200,
      bedrooms: 1,
      bathrooms: 1,
      property_type: "apartment",
      furnished: true,
      available_from: "2024-01-25",
      features: ["Period features", "Modern kitchen", "Garden access"],
    },
  ],
  // Оператор 2 - Manchester
  [
    {
      title: "City Center Apartment",
      description:
        "Modern apartment in the heart of Manchester with excellent amenities.",
      address: "25 Deansgate, Manchester",
      price: 1200,
      bedrooms: 2,
      bathrooms: 1,
      property_type: "apartment",
      furnished: true,
      available_from: "2024-01-15",
      features: ["Gym", "Concierge", "Parking", "Balcony"],
    },
    {
      title: "Student Accommodation",
      description: "Perfect student accommodation near universities.",
      address: "15 Oxford Road, Manchester",
      price: 800,
      bedrooms: 1,
      bathrooms: 1,
      property_type: "studio",
      furnished: true,
      available_from: "2024-02-01",
      features: ["Study desk", "High-speed internet", "Laundry"],
    },
    {
      title: "Family House in Didsbury",
      description: "Spacious family home in quiet residential area.",
      address: "78 Wilmslow Road, Didsbury, Manchester",
      price: 1800,
      bedrooms: 3,
      bathrooms: 2,
      property_type: "house",
      furnished: false,
      available_from: "2024-01-20",
      features: ["Garden", "Garage", "Driveway", "Conservatory"],
    },
    {
      title: "Modern Flat in Spinningfields",
      description: "Luxury apartment in Manchester's business district.",
      address: "5 Hardman Street, Spinningfields, Manchester",
      price: 1500,
      bedrooms: 2,
      bathrooms: 2,
      property_type: "apartment",
      furnished: true,
      available_from: "2024-02-05",
      features: ["River view", "Gym", "Pool", "Concierge"],
    },
    {
      title: "Cozy Studio in Northern Quarter",
      description: "Trendy studio in Manchester's creative quarter.",
      address: "32 Oldham Street, Northern Quarter, Manchester",
      price: 900,
      bedrooms: 1,
      bathrooms: 1,
      property_type: "studio",
      furnished: true,
      available_from: "2024-01-30",
      features: ["Modern design", "High ceilings", "Artistic neighborhood"],
    },
  ],
  // Оператор 3 - Birmingham
  [
    {
      title: "City Center Apartment",
      description: "Modern apartment with excellent transport links.",
      address: "45 New Street, Birmingham",
      price: 1100,
      bedrooms: 2,
      bathrooms: 1,
      property_type: "apartment",
      furnished: true,
      available_from: "2024-01-15",
      features: ["Gym", "Concierge", "Parking", "Balcony"],
    },
    {
      title: "Student Accommodation",
      description: "Perfect for students near universities.",
      address: "12 Edgbaston Road, Birmingham",
      price: 750,
      bedrooms: 1,
      bathrooms: 1,
      property_type: "studio",
      furnished: true,
      available_from: "2024-02-01",
      features: ["Study area", "High-speed internet", "Laundry"],
    },
    {
      title: "Family Home in Solihull",
      description: "Spacious family home in prestigious area.",
      address: "23 Stratford Road, Solihull, Birmingham",
      price: 1600,
      bedrooms: 3,
      bathrooms: 2,
      property_type: "house",
      furnished: false,
      available_from: "2024-01-20",
      features: ["Garden", "Garage", "Driveway", "Conservatory"],
    },
    {
      title: "Luxury Flat in Mailbox",
      description: "High-end apartment in Birmingham's luxury district.",
      address: "8 Wharfside Street, Mailbox, Birmingham",
      price: 1400,
      bedrooms: 2,
      bathrooms: 2,
      property_type: "apartment",
      furnished: true,
      available_from: "2024-02-05",
      features: ["Canal view", "Gym", "Pool", "Concierge"],
    },
    {
      title: "Modern Studio in Jewellery Quarter",
      description: "Contemporary studio in historic area.",
      address: "15 Vyse Street, Jewellery Quarter, Birmingham",
      price: 850,
      bedrooms: 1,
      bathrooms: 1,
      property_type: "studio",
      furnished: true,
      available_from: "2024-01-30",
      features: ["Period building", "Modern interior", "Creative area"],
    },
  ],
  // Оператор 4 - Edinburgh
  [
    {
      title: "Royal Mile Apartment",
      description: "Historic apartment in Edinburgh's most famous street.",
      address: "25 Royal Mile, Edinburgh",
      price: 1300,
      bedrooms: 2,
      bathrooms: 1,
      property_type: "apartment",
      furnished: true,
      available_from: "2024-01-15",
      features: ["Historic building", "City views", "Central location"],
    },
    {
      title: "Student Accommodation",
      description: "Perfect for students near universities.",
      address: "18 George Square, Edinburgh",
      price: 800,
      bedrooms: 1,
      bathrooms: 1,
      property_type: "studio",
      furnished: true,
      available_from: "2024-02-01",
      features: ["Study desk", "High-speed internet", "Laundry"],
    },
    {
      title: "Family Home in Morningside",
      description: "Elegant family home in prestigious area.",
      address: "45 Morningside Road, Edinburgh",
      price: 1800,
      bedrooms: 3,
      bathrooms: 2,
      property_type: "house",
      furnished: false,
      available_from: "2024-01-20",
      features: ["Garden", "Garage", "Period features", "Fireplace"],
    },
    {
      title: "Modern Flat in Leith",
      description: "Contemporary apartment in trendy area.",
      address: "12 Commercial Street, Leith, Edinburgh",
      price: 1200,
      bedrooms: 2,
      bathrooms: 1,
      property_type: "apartment",
      furnished: true,
      available_from: "2024-02-05",
      features: ["Harbor view", "Modern kitchen", "Balcony"],
    },
    {
      title: "Cozy Studio in New Town",
      description: "Charming studio in Georgian New Town.",
      address: "8 Princes Street, New Town, Edinburgh",
      price: 950,
      bedrooms: 1,
      bathrooms: 1,
      property_type: "studio",
      furnished: true,
      available_from: "2024-01-30",
      features: ["Georgian architecture", "City center", "Historic charm"],
    },
  ],
  // Оператор 5 - Bristol
  [
    {
      title: "Harbor View Apartment",
      description: "Stunning apartment with harbor views.",
      address: "15 Harbourside, Bristol",
      price: 1200,
      bedrooms: 2,
      bathrooms: 1,
      property_type: "apartment",
      furnished: true,
      available_from: "2024-01-15",
      features: ["Harbor view", "Balcony", "Modern amenities"],
    },
    {
      title: "Student Accommodation",
      description: "Perfect for students near universities.",
      address: "22 Park Street, Bristol",
      price: 750,
      bedrooms: 1,
      bathrooms: 1,
      property_type: "studio",
      furnished: true,
      available_from: "2024-02-01",
      features: ["Study area", "High-speed internet", "Laundry"],
    },
    {
      title: "Family Home in Clifton",
      description: "Beautiful family home in prestigious area.",
      address: "45 Clifton Down, Bristol",
      price: 1600,
      bedrooms: 3,
      bathrooms: 2,
      property_type: "house",
      furnished: false,
      available_from: "2024-01-20",
      features: ["Garden", "Period features", "Fireplace", "Study"],
    },
    {
      title: "Modern Flat in Cabot Circus",
      description: "Contemporary apartment in shopping district.",
      address: "8 Cabot Circus, Bristol",
      price: 1100,
      bedrooms: 2,
      bathrooms: 1,
      property_type: "apartment",
      furnished: true,
      available_from: "2024-02-05",
      features: ["City view", "Modern kitchen", "Balcony"],
    },
    {
      title: "Cozy Studio in Stokes Croft",
      description: "Trendy studio in creative area.",
      address: "32 Stokes Croft, Bristol",
      price: 850,
      bedrooms: 1,
      bathrooms: 1,
      property_type: "studio",
      furnished: true,
      available_from: "2024-01-30",
      features: ["Artistic area", "Modern design", "Creative neighborhood"],
    },
  ],
];

async function registerOperator(operatorData) {
  try {
    console.log(`🔍 Registering operator: ${operatorData.email}`);

    const response = await axios.post(`${API_BASE_URL}/auth/register`, {
      email: operatorData.email,
      password: operatorData.password,
      role: "operator",
      name: operatorData.name,
      company_name: operatorData.company_name,
      phone: operatorData.phone,
      business_address: operatorData.business_address,
      years_experience: operatorData.years_experience,
      operating_areas: operatorData.operating_areas,
      business_description: operatorData.business_description,
    });

    console.log(`✅ Operator registered: ${operatorData.email}`);
    return response.data.access_token;
  } catch (error) {
    console.error(
      `❌ Failed to register operator ${operatorData.email}:`,
      error.response?.data || error.message
    );
    return null;
  }
}

async function createProperty(accessToken, propertyData) {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/properties`,
      propertyData,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log(`✅ Property created: ${propertyData.title}`);
    return response.data;
  } catch (error) {
    console.error(
      `❌ Failed to create property ${propertyData.title}:`,
      error.response?.data || error.message
    );
    return null;
  }
}

async function seedDatabase() {
  console.log("🚀 Starting database seeding...");
  console.log("📋 Creating operators and properties...\n");

  const results = [];

  for (let i = 0; i < OPERATORS_COUNT; i++) {
    const operator = operators[i];
    const properties = propertyTemplates[i];

    console.log(
      `👤 Processing operator ${i + 1}/${OPERATORS_COUNT}: ${operator.email}`
    );

    // Register operator
    const accessToken = await registerOperator(operator);

    if (!accessToken) {
      console.log(
        `⚠️ Skipping operator ${operator.email} due to registration failure`
      );
      continue;
    }

    const operatorResult = {
      operator: {
        email: operator.email,
        password: operator.password,
        name: operator.name,
        company_name: operator.company_name,
      },
      properties: [],
    };

    // Create properties for this operator
    for (let j = 0; j < PROPERTIES_PER_OPERATOR; j++) {
      const property = properties[j];
      console.log(
        `  🏠 Creating property ${j + 1}/${PROPERTIES_PER_OPERATOR}: ${
          property.title
        }`
      );

      const createdProperty = await createProperty(accessToken, property);

      if (createdProperty) {
        operatorResult.properties.push({
          title: property.title,
          address: property.address,
          price: property.price,
          bedrooms: property.bedrooms,
          property_type: property.property_type,
        });
      }
    }

    results.push(operatorResult);
    console.log(`✅ Completed operator ${i + 1}/${OPERATORS_COUNT}\n`);
  }

  // Print summary
  console.log("📊 SEEDING SUMMARY:");
  console.log("==================");

  results.forEach((result, index) => {
    console.log(`\n👤 Operator ${index + 1}:`);
    console.log(`   Email: ${result.operator.email}`);
    console.log(`   Password: ${result.operator.password}`);
    console.log(`   Name: ${result.operator.name}`);
    console.log(`   Company: ${result.operator.company_name}`);
    console.log(`   Properties created: ${result.properties.length}`);

    result.properties.forEach((prop, propIndex) => {
      console.log(
        `     ${propIndex + 1}. ${prop.title} - £${prop.price}/month`
      );
    });
  });

  console.log("\n🎉 Database seeding completed!");
  console.log("\n📝 LOGIN CREDENTIALS:");
  console.log("===================");
  results.forEach((result, index) => {
    console.log(
      `${index + 1}. ${result.operator.email} / ${result.operator.password}`
    );
  });
}

// Run the seeding
seedDatabase().catch(console.error);

# 🏠 Database Seeding Scripts

## 📋 Overview

This script creates operators and properties for testing the platform:

- **5 operators** with realistic data
- **20 properties** (4 per operator)
- **80+ high-quality images** (4 per property)

## 🚀 Quick Start

### Local Development

#### Option 1: Using the bash script (Recommended)

```bash
cd backend/scripts
./run-seed.sh
```

#### Option 2: Manual execution

```bash
cd backend/scripts
npm install axios form-data
node seed-database.js
```

### Staging Environment

#### Option 1: Using the bash script (Recommended)

```bash
cd backend/scripts
./run-seed-staging.sh
```

#### Option 2: Manual execution

```bash
cd backend/scripts
npm install axios form-data
node seed-staging.js
```

## 📊 What Will Be Created

### 👤 Operators (5)

1. **John Smith** - London (Smith Properties Ltd)
2. **Sarah Johnson** - Manchester (Johnson Real Estate)
3. **Michael Brown** - Birmingham (Brown & Associates)
4. **Emma Wilson** - Edinburgh (Wilson Properties)
5. **David Taylor** - Bristol (Taylor Estates)

### 🏠 Properties (20 total)

- **4 properties per operator**
- **Different types**: Apartments, Studios, Houses
- **Price range**: £750 - £5500/month
- **Realistic UK addresses**
- **Detailed descriptions and features**

### 📸 Images (80+ total)

- **4 images per property**
- **High-quality Unsplash photos**
- **Different image types for different property types**:
  - Luxury apartments
  - Studios
  - Family houses
  - Modern apartments

## 🔐 Login Credentials

### Local Development

```
operator1@tada.com / password123
operator2@tada.com / password123
operator3@tada.com / password123
operator4@tada.com / password123
operator5@tada.com / password123
```

### Staging Environment

```
staging-operator1@tada.com / StagingPass123!
staging-operator2@tada.com / StagingPass123!
staging-operator3@tada.com / StagingPass123!
staging-operator4@tada.com / StagingPass123!
staging-operator5@tada.com / StagingPass123!
```

## 🏢 Property Types Created

- **Apartments** - Modern city center living
- **Studios** - Perfect for students and young professionals
- **Houses** - Family homes with gardens
- **Luxury Properties** - High-end accommodations

## 💰 Price Range

- **Minimum:** £750/month (student accommodation)
- **Maximum:** £5500/month (luxury family home in London)
- **Average:** £1500-£2000/month

## 🎯 What You Can Do

1. **Login as any operator** using the credentials above
2. **View and manage their properties** through the operator dashboard
3. **Edit property details** - prices, descriptions, features
4. **Add/remove properties** from their portfolio
5. **Test the full operator workflow**

## 📝 Notes

- All operators have role: "operator"
- Each property has detailed descriptions and features
- Properties include lifestyle features (gym, parking, etc.)
- Mix of furnished and unfurnished properties
- Various property types (apartment, studio, house)
- Realistic UK addresses and pricing

## 🔧 Technical Details

- Created via API calls to `/auth/register` and `/properties`
- All properties have proper DTO validation
- Includes lifestyle_features and proper furnishing types
- Dates set for 2024 availability
- Images are high-quality Unsplash photos
- Each property has 4 images (main + 3 gallery)

## 🚨 Prerequisites

1. **Backend server must be running** on `http://localhost:3001`
2. **Database must be set up** and migrations run
3. **Node.js and npm** installed

## 🛠️ Troubleshooting

### Backend not running

```bash
cd backend
npm run start:dev
```

### Database not set up

```bash
cd backend
npm run migration:run
```

### Permission denied on script

```bash
chmod +x run-seed.sh
```

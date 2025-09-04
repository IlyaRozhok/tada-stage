# 🏠 Complete Database Seeding Guide

## 📋 Overview

This guide will help you populate your database with 5 operators, 25 properties, and 100+ high-quality images.

## 🚀 Quick Start

### Option 1: Using the bash script (Recommended)

```bash
cd tada-api-stage/backend/scripts
./run-complete-seeding.sh
```

### Option 2: Manual execution

```bash
cd tada-api-stage/backend/scripts
npm install axios
node complete-seeding.js
```

## 📊 What Will Be Created

### 👤 Operators (5)

1. **John Smith** - London (Smith Properties Ltd)
2. **Sarah Johnson** - Manchester (Johnson Real Estate)
3. **Michael Brown** - Birmingham (Brown & Associates)
4. **Emma Wilson** - Edinburgh (Wilson Properties)
5. **David Taylor** - Bristol (Taylor Estates)

### 🏠 Properties (25 total)

- **5 properties per operator**
- **Different types**: Apartments, Studios, Houses
- **Price range**: £750 - £4500/month
- **Realistic UK addresses**
- **Detailed descriptions and features**

### 📸 Images (100+ total)

- **4 images per property**
- **High-quality Unsplash photos**
- **Different image types for different property types**:
  - Luxury apartments
  - Studios
  - Family houses
  - Modern apartments
  - Student accommodation

## 🔐 Login Credentials

```
1. operator1@tada.com / password123 (London - 5 luxury properties)
2. operator2@tada.com / password123 (Manchester - 5 properties)
3. operator3@tada.com / password123 (Birmingham - 5 properties)
4. operator4@tada.com / password123 (Edinburgh - 5 properties)
5. operator5@tada.com / password123 (Bristol - 5 properties)
```

## 🏢 Property Details

### London (John Smith)

- Luxury 2-Bedroom Apartment - £2500/month
- Cozy Studio in Soho - £1800/month
- Family Home in Chelsea - £4500/month
- Modern 3-Bedroom Flat - £3200/month
- Charming 1-Bedroom Flat - £2200/month

### Manchester (Sarah Johnson)

- City Center Apartment - £1200/month
- Student Accommodation - £800/month
- Family House in Didsbury - £1800/month
- Modern Flat in Spinningfields - £1500/month
- Cozy Studio in Northern Quarter - £900/month

### Birmingham (Michael Brown)

- City Center Apartment - £1100/month
- Student Accommodation - £750/month
- Family Home in Solihull - £1600/month
- Luxury Flat in Mailbox - £1400/month
- Modern Studio in Jewellery Quarter - £850/month

### Edinburgh (Emma Wilson)

- Royal Mile Apartment - £1300/month
- Student Accommodation - £800/month
- Family Home in Morningside - £1800/month
- Modern Flat in Leith - £1200/month
- Cozy Studio in New Town - £950/month

### Bristol (David Taylor)

- Harbor View Apartment - £1200/month
- Student Accommodation - £750/month
- Family Home in Clifton - £1600/month
- Modern Flat in Cabot Circus - £1100/month
- Cozy Studio in Stokes Croft - £850/month

## 🎯 What You Can Do After Seeding

1. **Login as any operator** using the credentials above
2. **View all properties** in the operator dashboard
3. **See property images** in the property details
4. **Edit property information** - prices, descriptions, features
5. **Add/remove properties** from the portfolio
6. **Test the full operator workflow**

## 📸 Image Types Used

- **Luxury Apartments**: High-end interior shots
- **Studios**: Compact, modern living spaces
- **Houses**: Family homes with gardens
- **Modern Apartments**: Contemporary city living
- **Student Accommodation**: Functional, affordable spaces

## 🔧 Technical Details

- **API Endpoints Used**:

  - `POST /auth/register` - Create operators
  - `POST /properties` - Create properties
  - `POST /properties/{id}/media` - Add images

- **Image Sources**: Unsplash (high-quality, free-to-use)
- **Image Format**: 800x600 optimized for web
- **Primary Images**: First image set as primary for each property

## ⚠️ Prerequisites

1. **Backend server running** on `http://localhost:3001`
2. **Database connected** and migrations run
3. **Node.js** installed
4. **Internet connection** (for downloading images)

## 🛠️ Troubleshooting

### Backend not running

```bash
cd tada-api-stage/backend
npm run start:dev
```

### Database connection issues

```bash
cd tada-api-stage/backend
npm run migration:run:dev
```

### Image upload failures

- Check internet connection
- Verify API endpoints are working
- Check server logs for errors

## 📝 Notes

- All operators have role: "operator"
- Each property has unique address and characteristics
- Images are automatically categorized by property type
- All properties have detailed lifestyle features
- Mix of furnished and unfurnished properties
- Realistic UK pricing and locations

## 🎉 Success Indicators

When seeding is complete, you should see:

- ✅ 5 operators created successfully
- ✅ 25 properties created successfully
- ✅ 100+ images added to properties
- ✅ All login credentials working
- ✅ Properties visible in operator dashboard
- ✅ Images loading in property details

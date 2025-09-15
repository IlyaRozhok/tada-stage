#!/bin/bash

echo "🚀 Starting database seeding..."
echo "📋 This will create 5 operators with 4 properties each and add images"
echo ""


# Install axios if not installed
echo "📦 Installing axios if needed..."
npm install axios

# Run the seeding script
echo "🌱 Running database seeding script..."
node seed-database.js

echo ""
echo "🎉 Database seeding completed!"
echo ""
echo "📝 LOGIN CREDENTIALS:"
echo "==================="
echo "1. operator1@tada.com / password123"
echo "2. operator2@tada.com / password123"
echo "3. operator3@tada.com / password123"
echo "4. operator4@tada.com / password123"
echo "5. operator5@tada.com / password123"
echo ""
echo "📸 Each property now has 4 high-quality images"
echo "🏠 Total: 20 properties with 80+ images"
echo ""
echo "You can now login as any of these operators to manage their properties with images."
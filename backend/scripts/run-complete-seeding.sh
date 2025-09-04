#!/bin/bash

echo "🚀 Starting complete database seeding..."
echo "📋 This will create 5 operators with 5 properties each and add images"
echo ""

# Check if backend is running
echo "🔍 Checking if backend server is running..."
if curl -s http://localhost:3001/health > /dev/null 2>&1; then
    echo "✅ Backend server is running"
else
    echo "❌ Backend server is not running on http://localhost:3001"
    echo "Please start the backend server first:"
    echo "cd tada-api-stage/backend && npm run start:dev"
    exit 1
fi

# Install axios if not installed
echo "📦 Installing axios if needed..."
npm install axios

# Run the complete seeding script
echo "🌱 Running complete seeding script..."
node complete-seeding.js

echo ""
echo "🎉 Complete seeding finished!"
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
echo "🏠 Total: 25 properties with 100+ images"
echo ""
echo "You can now login as any of these operators to manage their properties with images."

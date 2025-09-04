#!/bin/bash

echo "🚀 Starting database seeding..."
echo "📋 This will create 5 operators with 5 properties each"
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

# Run the seeding script
echo "🌱 Running seeding script..."
node seed-operators.js

echo ""
echo "🎉 Seeding completed!"
echo ""
echo "📝 LOGIN CREDENTIALS:"
echo "==================="
echo "1. operator1@tada.com / password123"
echo "2. operator2@tada.com / password123"
echo "3. operator3@tada.com / password123"
echo "4. operator4@tada.com / password123"
echo "5. operator5@tada.com / password123"
echo ""
echo "You can now login as any of these operators to manage their properties."

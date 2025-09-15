#!/bin/bash

echo "🚀 Starting staging database seeding..."
echo "📋 This will create 5 operators with 4 properties each and add images"
echo "🌐 Target: https://stage.ta-da.co/api"
echo ""

# Install dependencies if not installed
echo "📦 Installing dependencies if needed..."
npm install axios form-data

# Run the staging seeding script
echo "🌱 Running staging database seeding script..."
node seed-staging.js

echo ""
echo "🎉 Staging database seeding completed!"
echo ""
echo "📝 STAGING LOGIN CREDENTIALS:"
echo "============================="
echo "1. staging-operator1@tada.com / StagingPass123!"
echo "2. staging-operator2@tada.com / StagingPass123!"
echo "3. staging-operator3@tada.com / StagingPass123!"
echo "4. staging-operator4@tada.com / StagingPass123!"
echo "5. staging-operator5@tada.com / StagingPass123!"
echo ""
echo "📸 Each property now has 4 high-quality images"
echo "🏠 Total: 20 properties with 80+ images"
echo ""
echo "You can now login as any of these operators to manage their properties with images."

#!/bin/bash

# Установка переменных окружения для разработки
export NODE_ENV=development
export PORT=5001
export JWT_SECRET=local_dev_secret_change_in_production
export JWT_ACCESS_EXPIRES_IN=15m
export JWT_REFRESH_EXPIRES_IN=7d

# Database Configuration
export DB_USERNAME=postgres
export DB_PASSWORD=password
export DB_NAME=rental_platform_local
export DB_HOST=localhost
export DB_PORT=5432

# Google OAuth Configuration (замените на реальные значения)
export GOOGLE_CLIENT_ID=your_google_client_id
export GOOGLE_CLIENT_SECRET=your_google_client_secret
export GOOGLE_CALLBACK_URL=http://localhost:5001/api/auth/google/callback

# Frontend URL
export FRONTEND_URL=http://localhost:3000

# AWS Configuration
export AWS_ACCESS_KEY_ID=test
export AWS_SECRET_ACCESS_KEY=test
export AWS_REGION=eu-north-1
export AWS_S3_BUCKET_NAME=tada-media-bucket-local
export AWS_ENDPOINT=http://localhost:4566

echo "Environment variables set for development"
echo "Starting server..."

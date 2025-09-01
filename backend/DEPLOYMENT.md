# Deployment Guide

## Production Build

### Prerequisites

- Node.js 18+
- Docker
- PostgreSQL database

### Environment Setup

1. Create environment file:

```bash
cp config/env.production.example .env.production
```

2. Configure environment variables:

```env
# Database Configuration
DB_USERNAME=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=your_db_name
DB_HOST=your_db_host
DB_PORT=5432

# Application Configuration
NODE_ENV=production
PORT=3002

# JWT Configuration
JWT_SECRET=your_secure_jwt_secret
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# AWS Configuration
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
AWS_REGION=your_aws_region
AWS_S3_BUCKET_NAME=your_s3_bucket

# Auth Configuration
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=https://your-domain.com/auth/google/callback

# Frontend URL
FRONTEND_URL=https://your-frontend-domain.com
```

## Docker Deployment

### Build Docker Image

```bash
docker build -t rental-platform-backend .
```

### Run with Docker Compose

```bash
# Start the application
docker-compose up -d

# Run migrations
docker-compose exec backend npm run typeorm:migration:run

# Check logs
docker-compose logs -f backend
```

### Manual Docker Run

```bash
# Run the container
docker run -d \
  --name rental-backend \
  -p 3002:3002 \
  --env-file .env.production \
  rental-platform-backend

# Run migrations
docker exec rental-backend npm run typeorm:migration:run
```

## Database Migrations

### Run Migrations

```bash
# Apply all pending migrations
npm run typeorm:migration:run

# Generate new migration
npm run typeorm:migration:generate -- src/database/migrations/MigrationName

# Revert last migration
npm run typeorm:migration:revert
```

### Migration Best Practices

1. Always backup database before running migrations
2. Test migrations in staging environment first
3. Run migrations during low-traffic periods
4. Monitor application logs during migration

## Health Checks

The application includes a health check endpoint:

- URL: `GET /health`
- Expected response: `200 OK`

## Monitoring

### Logs

```bash
# View application logs
docker logs rental-backend

# Follow logs in real-time
docker logs -f rental-backend
```

### Health Monitoring

```bash
# Check application health
curl http://localhost:3002/health

# Check database connection
curl http://localhost:3002/health/db
```

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check database credentials
   - Verify database is running
   - Check network connectivity

2. **Migration Errors**
   - Check database permissions
   - Verify migration files are correct
   - Check for conflicting migrations

3. **Application Won't Start**
   - Check environment variables
   - Verify port availability
   - Check application logs

### Debug Commands

```bash
# Check container status
docker ps

# Inspect container
docker inspect rental-backend

# Execute commands in container
docker exec -it rental-backend sh

# Check environment variables
docker exec rental-backend env
```

## Security Considerations

1. **Environment Variables**
   - Never commit sensitive data to version control
   - Use secure secret management
   - Rotate secrets regularly

2. **Database Security**
   - Use strong passwords
   - Limit database access
   - Enable SSL connections

3. **Application Security**
   - Keep dependencies updated
   - Use HTTPS in production
   - Implement rate limiting

## Performance Optimization

1. **Database**
   - Use connection pooling
   - Optimize queries
   - Add appropriate indexes

2. **Application**
   - Enable compression
   - Use caching where appropriate
   - Monitor memory usage

3. **Infrastructure**
   - Use load balancers
   - Implement auto-scaling
   - Monitor resource usage

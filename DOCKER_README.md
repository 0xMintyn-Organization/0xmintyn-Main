# Docker Setup Guide for 0xMintyn Platform

This guide explains how to build and run the 0xMintyn platform using Docker.

## 📋 Prerequisites

- Docker Engine 20.10+ installed
- Docker Compose 2.0+ installed
- At least 4GB of available RAM
- 10GB of free disk space

## 🏗️ Project Structure

```
0xmintyn-Main/
├── Backend/
│   ├── Dockerfile
│   └── .dockerignore
├── Frontend/
│   ├── Dockerfile
│   └── .dockerignore
└── docker-compose.yml
```

## 🚀 Quick Start

### 1. Using Docker Compose (Recommended)

This is the easiest way to run the entire stack:

```bash
# Create a .env file in the root directory
cat > .env << EOF
# MongoDB
MONGO_ROOT_USERNAME=admin
MONGO_ROOT_PASSWORD=your_secure_password
MONGO_DATABASE=0xmintyn

# Backend
DB_URI=mongodb://admin:your_secure_password@mongodb:27017/0xmintyn?authSource=admin
JWT_SECRET=your_jwt_secret_key
JWT_REFRESH_SECRET=your_jwt_refresh_secret_key
JWT_EXPIRE=7d
JWT_REFRESH_EXPIRE=30d

# Frontend
NEXT_PUBLIC_API_URL=https://appbackend.0xmintyn.com

# Add other environment variables as needed
# STRIPE_SECRET_KEY=your_stripe_secret
# REDIS_URL=redis://redis:6379
EOF

# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Stop and remove volumes (⚠️ deletes database data)
docker-compose down -v
```

### 2. Building Individual Images

#### Backend

```bash
cd Backend
docker build -t 0xmintyn-backend:latest .

# Run the backend container
docker run -d \
  --name 0xmintyn-backend \
  -p 8000:8000 \
  -e DB_URI=mongodb://localhost:27017/0xmintyn \
  -e JWT_SECRET=your_jwt_secret \
  -e JWT_REFRESH_SECRET=your_refresh_secret \
  -v $(pwd)/uploads:/app/uploads \
  -v $(pwd)/mails:/app/mails \
  0xmintyn-backend:latest
```

#### Frontend

```bash
cd Frontend
docker build -t 0xmintyn-frontend:latest .

# Run the frontend container
docker run -d \
  --name 0xmintyn-frontend \
  -p 3000:3000 \
  -e NEXT_PUBLIC_API_URL=https://appbackend.0xmintyn.com \
  0xmintyn-frontend:latest
```

## 🔧 Configuration

### Environment Variables

#### Backend Required Variables

- `DB_URI` - MongoDB connection string
- `JWT_SECRET` - Secret key for JWT tokens
- `JWT_REFRESH_SECRET` - Secret key for refresh tokens
- `JWT_EXPIRE` - JWT token expiration (default: 7d)
- `JWT_REFRESH_EXPIRE` - Refresh token expiration (default: 30d)
- `PORT` - Server port (default: 8000)

#### Frontend Required Variables

- `NEXT_PUBLIC_API_URL` - Backend API URL
- `NODE_ENV` - Environment (production/development)

### Volumes

The backend container uses volumes for:
- `uploads/` - User uploaded files (images, videos, documents)
- `mails/` - Email templates

These are mounted from your host machine to persist data.

## 📊 Health Checks

Both containers include health checks:

- **Backend**: Checks `https://appbackend.0xmintyn.com/test` endpoint
- **Frontend**: Checks `https://app.0xmintyn.com` endpoint

View health status:
```bash
docker-compose ps
```

## 🐛 Troubleshooting

### Backend won't start

1. **Check MongoDB connection:**
   ```bash
   docker-compose logs mongodb
   docker-compose logs backend
   ```

2. **Verify environment variables:**
   ```bash
   docker-compose exec backend env | grep DB_URI
   ```

3. **Check if MongoDB is ready:**
   ```bash
   docker-compose exec mongodb mongosh -u admin -p your_password --eval "db.adminCommand('ping')"
   ```

### Frontend build fails

1. **Check build logs:**
   ```bash
   docker-compose logs frontend
   ```

2. **Clear Next.js cache:**
   ```bash
   docker-compose exec frontend rm -rf .next
   docker-compose restart frontend
   ```

### Port conflicts

If ports 3000, 8000, or 27017 are already in use, modify `docker-compose.yml`:

```yaml
ports:
  - "3001:3000"  # Change host port
```

### Permission issues with uploads

```bash
# Fix permissions
sudo chown -R 1001:1001 Backend/uploads
sudo chmod -R 755 Backend/uploads
```

## 🔒 Security Best Practices

1. **Use strong passwords** for MongoDB
2. **Never commit** `.env` files to version control
3. **Use SSH keys** instead of passwords for production
4. **Enable MongoDB authentication** in production
5. **Use secrets management** (Docker secrets, AWS Secrets Manager, etc.)
6. **Run containers as non-root** (already configured)

## 📈 Production Deployment

### Using Docker Swarm

```bash
# Initialize swarm
docker swarm init

# Create secrets
echo "your_jwt_secret" | docker secret create jwt_secret -
echo "your_db_uri" | docker secret create db_uri -

# Deploy stack
docker stack deploy -c docker-compose.yml 0xmintyn
```

### Using Kubernetes

Convert `docker-compose.yml` to Kubernetes manifests:
```bash
kompose convert
```

### Using Cloud Platforms

- **AWS**: Use ECS or EKS
- **Google Cloud**: Use Cloud Run or GKE
- **Azure**: Use Container Instances or AKS
- **DigitalOcean**: Use App Platform or Kubernetes

## 🔄 Updating Containers

```bash
# Pull latest code
git pull

# Rebuild and restart
docker-compose up -d --build

# Or rebuild specific service
docker-compose build backend
docker-compose up -d backend
```

## 📝 Useful Commands

```bash
# View all running containers
docker-compose ps

# View logs
docker-compose logs -f [service_name]

# Execute command in container
docker-compose exec backend sh
docker-compose exec frontend sh

# Restart a service
docker-compose restart [service_name]

# Stop all services
docker-compose stop

# Remove all containers and volumes
docker-compose down -v

# View resource usage
docker stats

# Clean up unused images
docker image prune -a
```

## 🧪 Testing

```bash
# Test backend health
curl https://appbackend.0xmintyn.com/test

# Test frontend
curl https://app.0xmintyn.com

# Test MongoDB connection
docker-compose exec mongodb mongosh -u admin -p your_password
```

## 📚 Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Next.js Docker Deployment](https://nextjs.org/docs/deployment#docker-image)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)

## 🆘 Support

For issues or questions:
1. Check the logs: `docker-compose logs`
2. Verify environment variables
3. Ensure all prerequisites are met
4. Check Docker and Docker Compose versions

---

**Note**: Make sure to replace all placeholder values (passwords, secrets, etc.) with your actual production values before deploying.


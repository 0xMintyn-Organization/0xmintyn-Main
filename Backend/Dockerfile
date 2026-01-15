# Backend Production Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install all dependencies (needed for TypeScript build)
RUN npm ci

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Remove dev dependencies and clean cache
RUN npm prune --production && npm cache clean --force

# Create uploads directories
RUN mkdir -p uploads/files uploads/images uploads/videos

# Expose port
EXPOSE 8000

# Start application
CMD ["node", "build/server.js"]

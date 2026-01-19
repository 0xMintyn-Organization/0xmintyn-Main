FROM node:18-bullseye

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --force

# Copy source code
COPY . .

# Expose port
EXPOSE 8000

# Start application in dev mode
CMD ["npm", "run", "dev"]

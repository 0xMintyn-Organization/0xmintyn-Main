#!/bin/bash

# ============================================================================
# Clean Reinstall from Master Branch
# Removes existing installation and sets up fresh from master branch
# ============================================================================

set -e

PROJECT_DIR="/var/www/0xmintyn-Main"
BRANCH="master"

echo "=========================================="
echo "CLEAN REINSTALL FROM MASTER BRANCH"
echo "=========================================="
echo ""
echo "⚠️  WARNING: This will DELETE the existing installation!"
echo "⚠️  All local changes will be lost!"
echo ""
read -p "Are you sure you want to continue? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "Aborted."
    exit 1
fi

echo ""
echo "Step 1: Stopping PM2 processes..."
# Find PM2
if [ -d "/root/.nvm" ]; then
    export NVM_DIR="/root/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
    PM2_CMD=$(which pm2 2>/dev/null || find /root/.nvm -name pm2 2>/dev/null | head -1)
else
    PM2_CMD=$(which pm2 2>/dev/null || echo "pm2")
fi

if [ -n "$PM2_CMD" ] && [ -f "$PM2_CMD" ]; then
    $PM2_CMD delete all 2>/dev/null || true
    $PM2_CMD kill 2>/dev/null || true
    echo "✅ PM2 processes stopped"
else
    echo "⚠️  PM2 not found, skipping"
fi

echo ""
echo "Step 2: Removing existing installation..."
if [ -d "$PROJECT_DIR" ]; then
    rm -rf "$PROJECT_DIR"
    echo "✅ Removed $PROJECT_DIR"
else
    echo "⚠️  Directory doesn't exist, skipping"
fi

echo ""
echo "Step 3: Creating project directory..."
mkdir -p "$PROJECT_DIR"
cd "$PROJECT_DIR"
echo "✅ Created $PROJECT_DIR"

echo ""
echo "Step 4: Cloning repository..."
git clone https://github.com/0xMintyn-Organization/0xmintyn-Main.git .

echo ""
echo "Step 5: Checking out master branch..."
git checkout master
git pull origin master
echo "✅ Master branch checked out"

echo ""
echo "Step 6: Configuring git..."
git config --global --add safe.directory "$PROJECT_DIR" || true

echo ""
echo "Step 7: Setting up Node.js environment..."
if [ -d "/root/.nvm" ]; then
    export NVM_DIR="/root/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
    [ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"
    
    # Use default Node.js version or latest
    nvm use default 2>/dev/null || nvm use node 2>/dev/null || true
    
    NODE_VERSION=$(node --version)
    NPM_VERSION=$(npm --version)
    echo "✅ Node.js: $NODE_VERSION"
    echo "✅ npm: $NPM_VERSION"
else
    echo "❌ NVM not found. Please install Node.js first."
    exit 1
fi

echo ""
echo "Step 8: Installing Backend dependencies..."
cd "$PROJECT_DIR/Backend"
if [ -f "package.json" ]; then
    npm install
    echo "✅ Backend dependencies installed"
else
    echo "❌ Backend/package.json not found"
    exit 1
fi

echo ""
echo "Step 9: Installing Frontend dependencies..."
cd "$PROJECT_DIR/Frontend"
if [ -f "package.json" ]; then
    npm install
    echo "✅ Frontend dependencies installed"
else
    echo "❌ Frontend/package.json not found"
    exit 1
fi

echo ""
echo "Step 10: Checking environment files..."
cd "$PROJECT_DIR"

if [ ! -f "Backend/.env" ]; then
    echo "⚠️  Backend/.env not found!"
    echo "   Please create Backend/.env with required variables"
fi

if [ ! -f "Frontend/.env.local" ]; then
    echo "⚠️  Frontend/.env.local not found!"
    echo "   Please create Frontend/.env.local with required variables"
fi

echo ""
echo "Step 11: Starting PM2 processes..."
if [ -f "ecosystem.config.js" ]; then
    $PM2_CMD start ecosystem.config.js
    $PM2_CMD save
    echo "✅ PM2 processes started"
    
    # Wait a bit
    sleep 5
    
    # Show status
    echo ""
    echo "PM2 Status:"
    $PM2_CMD list
else
    echo "⚠️  ecosystem.config.js not found"
    echo "   Starting manually..."
    cd "$PROJECT_DIR/Backend"
    $PM2_CMD start npm --name backend -- run dev
    cd "$PROJECT_DIR/Frontend"
    $PM2_CMD start npm --name frontend -- run dev
    $PM2_CMD save
fi

echo ""
echo "Step 12: Verifying services..."
sleep 3

BACKEND_STATUS=$($PM2_CMD list | grep "backend" | grep -q "online" && echo "✅" || echo "❌")
FRONTEND_STATUS=$($PM2_CMD list | grep "frontend" | grep -q "online" && echo "✅" || echo "❌")

echo ""
echo "Service Status:"
echo "  Backend: $BACKEND_STATUS"
echo "  Frontend: $FRONTEND_STATUS"

if [ "$BACKEND_STATUS" = "❌" ] || [ "$FRONTEND_STATUS" = "❌" ]; then
    echo ""
    echo "⚠️  Some services failed to start. Check logs:"
    [ "$BACKEND_STATUS" = "❌" ] && $PM2_CMD logs backend --lines 20 --nostream || true
    [ "$FRONTEND_STATUS" = "❌" ] && $PM2_CMD logs frontend --lines 20 --nostream || true
fi

echo ""
echo "=========================================="
echo "REINSTALLATION COMPLETE"
echo "=========================================="
echo ""
echo "Next steps:"
echo "  1. Configure environment variables:"
echo "     - Backend/.env"
echo "     - Frontend/.env.local"
echo ""
echo "  2. If services failed, check logs:"
echo "     pm2 logs"
echo ""
echo "  3. Verify Nginx configuration:"
echo "     nginx -t"
echo "     systemctl reload nginx"
echo ""
echo "  4. Check service status:"
echo "     pm2 list"
echo "     pm2 monit"
echo ""

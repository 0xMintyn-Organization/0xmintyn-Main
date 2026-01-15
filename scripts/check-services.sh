#!/bin/bash

# ============================================================================
# Check Services Status
# Quick diagnostic script to check if services are running
# ============================================================================

echo "=========================================="
echo "SERVICE STATUS CHECK"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check PM2
echo "--- PM2 Status ---"
if command -v pm2 >/dev/null 2>&1; then
    PM2_CMD="pm2"
elif [ -f "/root/.nvm/versions/node/v24.12.0/bin/pm2" ]; then
    PM2_CMD="/root/.nvm/versions/node/v24.12.0/bin/pm2"
else
    # Try to find pm2
    PM2_CMD=$(which pm2 2>/dev/null || find /root/.nvm -name pm2 2>/dev/null | head -1)
fi

if [ -n "$PM2_CMD" ] && [ -f "$PM2_CMD" ]; then
    echo "PM2 found at: $PM2_CMD"
    echo ""
    $PM2_CMD list
    echo ""
else
    echo -e "${RED}❌ PM2 not found${NC}"
    echo "Trying to find Node.js..."
    if [ -d "/root/.nvm" ]; then
        export NVM_DIR="/root/.nvm"
        [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
        NODE_PATH=$(which node)
        echo "Node.js found at: $NODE_PATH"
        if [ -n "$NODE_PATH" ]; then
            NODE_DIR=$(dirname "$NODE_PATH")
            PM2_CMD="$NODE_DIR/pm2"
            if [ -f "$PM2_CMD" ]; then
                echo "PM2 found at: $PM2_CMD"
                $PM2_CMD list
            else
                echo -e "${RED}PM2 not installed. Install with: npm install -g pm2${NC}"
            fi
        fi
    fi
fi

echo ""
echo "--- Port Status ---"
echo "Checking if ports 3000 and 8000 are listening..."
if command -v netstat >/dev/null 2>&1; then
    netstat -tlnp | grep -E ':(3000|8000)' || echo "No processes listening on ports 3000 or 8000"
elif command -v ss >/dev/null 2>&1; then
    ss -tlnp | grep -E ':(3000|8000)' || echo "No processes listening on ports 3000 or 8000"
else
    echo "netstat/ss not available"
fi

echo ""
echo "--- Process Check ---"
echo "Node.js processes:"
ps aux | grep -E 'node|next|ts-node' | grep -v grep || echo "No Node.js processes found"

echo ""
echo "--- Nginx Status ---"
if systemctl is-active --quiet nginx; then
    echo -e "${GREEN}✅ Nginx is running${NC}"
else
    echo -e "${RED}❌ Nginx is not running${NC}"
    echo "Start with: systemctl start nginx"
fi

echo ""
echo "--- Quick Fix Commands ---"
echo "If services are not running:"
echo "  cd /var/www/0xmintyn-Main"
echo "  pm2 start ecosystem.config.js"
echo "  pm2 save"
echo ""
echo "If PM2 not found:"
echo "  export NVM_DIR=\"/root/.nvm\""
echo "  [ -s \"\$NVM_DIR/nvm.sh\" ] && \. \"\$NVM_DIR/nvm.sh\""
echo "  npm install -g pm2"
echo "  pm2 start ecosystem.config.js"

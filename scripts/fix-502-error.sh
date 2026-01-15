#!/bin/bash

# ============================================================================
# Fix 502 Bad Gateway Error
# Diagnoses and fixes common issues causing 502 errors
# ============================================================================

set -e

echo "=========================================="
echo "FIXING 502 BAD GATEWAY ERROR"
echo "=========================================="
echo ""

PROJECT_DIR="/var/www/0xmintyn-Main"

# Find PM2
if [ -d "/root/.nvm" ]; then
    export NVM_DIR="/root/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
    NODE_PATH=$(which node | sed 's|/node$||')
    PM2_CMD="$NODE_PATH/pm2"
    
    # If not found, try to find latest Node version
    if [ ! -f "$PM2_CMD" ]; then
        if [ -d "/root/.nvm/versions/node" ]; then
            LATEST_NODE=$(ls -d /root/.nvm/versions/node/v* 2>/dev/null | sort -V | tail -1)
            if [ -n "$LATEST_NODE" ]; then
                PM2_CMD="$LATEST_NODE/bin/pm2"
            fi
        fi
    fi
else
    PM2_CMD=$(which pm2 2>/dev/null || echo "pm2")
fi

echo "📍 Using PM2: $PM2_CMD"
echo ""

# Step 1: Check if PM2 processes are running
echo "Step 1: Checking PM2 processes..."
if [ -f "$PM2_CMD" ]; then
    $PM2_CMD list
    echo ""
    
    # Check if processes are errored or stopped
    if $PM2_CMD list | grep -q "errored\|stopped"; then
        echo "⚠️  Some processes are errored or stopped"
        echo "Restarting all processes..."
        cd $PROJECT_DIR
        $PM2_CMD delete all 2>/dev/null || true
        sleep 2
        $PM2_CMD start ecosystem.config.js
        $PM2_CMD save
        echo "✅ Processes restarted"
    fi
else
    echo "❌ PM2 not found at $PM2_CMD"
    echo "Trying to install or find PM2..."
    
    # Try to load NVM and install PM2
    if [ -d "/root/.nvm" ]; then
        export NVM_DIR="/root/.nvm"
        [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
        npm install -g pm2
        PM2_CMD=$(which pm2)
        echo "✅ PM2 installed at $PM2_CMD"
    else
        echo "❌ Cannot find NVM. Please install Node.js and PM2 manually."
        exit 1
    fi
fi

echo ""

# Step 2: Check if ports are listening
echo "Step 2: Checking if ports 3000 and 8000 are listening..."
if command -v ss >/dev/null 2>&1; then
    PORT_3000=$(ss -tlnp | grep ':3000' || echo "")
    PORT_8000=$(ss -tlnp | grep ':8000' || echo "")
    
    if [ -z "$PORT_3000" ]; then
        echo "❌ Port 3000 (Frontend) is not listening"
    else
        echo "✅ Port 3000 is listening"
    fi
    
    if [ -z "$PORT_8000" ]; then
        echo "❌ Port 8000 (Backend) is not listening"
    else
        echo "✅ Port 8000 is listening"
    fi
fi

echo ""

# Step 3: Check Nginx status
echo "Step 3: Checking Nginx..."
if systemctl is-active --quiet nginx; then
    echo "✅ Nginx is running"
    
    # Test Nginx config
    if nginx -t 2>&1 | grep -q "successful"; then
        echo "✅ Nginx configuration is valid"
    else
        echo "❌ Nginx configuration has errors"
        nginx -t
    fi
else
    echo "❌ Nginx is not running"
    echo "Starting Nginx..."
    systemctl start nginx
fi

echo ""

# Step 4: Restart services if needed
echo "Step 4: Ensuring services are running..."
cd $PROJECT_DIR

if [ -f "$PM2_CMD" ]; then
    # Check if processes exist
    if ! $PM2_CMD list | grep -q "backend\|frontend"; then
        echo "No PM2 processes found. Starting from ecosystem.config.js..."
        $PM2_CMD start ecosystem.config.js
        $PM2_CMD save
    else
        echo "PM2 processes found. Restarting..."
        $PM2_CMD restart all
    fi
    
    # Wait a bit
    sleep 5
    
    # Check status again
    echo ""
    echo "Final PM2 Status:"
    $PM2_CMD list
    
    # Check if services are online
    BACKEND_STATUS=$($PM2_CMD list | grep "backend" | grep -q "online" && echo "✅" || echo "❌")
    FRONTEND_STATUS=$($PM2_CMD list | grep "frontend" | grep -q "online" && echo "✅" || echo "❌")
    
    echo ""
    echo "Service Status:"
    echo "  Backend: $BACKEND_STATUS"
    echo "  Frontend: $FRONTEND_STATUS"
    
    if [ "$BACKEND_STATUS" = "❌" ] || [ "$FRONTEND_STATUS" = "❌" ]; then
        echo ""
        echo "⚠️  Some services failed to start. Checking logs..."
        [ "$BACKEND_STATUS" = "❌" ] && $PM2_CMD logs backend --lines 20 --nostream || true
        [ "$FRONTEND_STATUS" = "❌" ] && $PM2_CMD logs frontend --lines 20 --nostream || true
    fi
fi

echo ""
echo "=========================================="
echo "DIAGNOSIS COMPLETE"
echo "=========================================="
echo ""
echo "If services are still not working:"
echo "  1. Check logs: pm2 logs"
echo "  2. Check environment variables:"
echo "     cd Backend && cat .env"
echo "     cd Frontend && cat .env.local"
echo "  3. Check Nginx config: nginx -t"
echo "  4. Check if ports are in use: ss -tlnp | grep -E ':(3000|8000)'"
echo ""

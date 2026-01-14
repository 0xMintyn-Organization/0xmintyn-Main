#!/bin/bash

# ============================================================================
# Fix NPM and Restart Services
# Addresses npm compatibility issues and restarts PM2 services
# ============================================================================

echo "=========================================="
echo "FIXING NPM AND RESTARTING SERVICES"
echo "=========================================="
echo ""

PM2_CMD="/root/.nvm/versions/node/v24.12.0/bin/pm2"
NODE_PATH="/root/.nvm/versions/node/v24.12.0/bin"
NPM_PATH="/root/.nvm/versions/node/v24.12.0/bin/npm"

# 1. Check Node.js and npm versions
echo "--- Checking Node.js and npm ---"
$NODE_PATH/node --version
$NPM_PATH --version 2>&1 || echo "npm has issues"
echo ""

# 2. Fix npm if needed
echo "--- Fixing npm ---"
if ! $NPM_PATH --version >/dev/null 2>&1; then
    echo "npm is broken, reinstalling..."
    cd /root/.nvm/versions/node/v24.12.0
    curl -L https://www.npmjs.com/install.sh | sh 2>/dev/null || {
        echo "Downloading npm directly..."
        $NODE_PATH/node --version
        # Try to reinstall npm
        $NODE_PATH/npm install -g npm@latest 2>&1 || echo "npm reinstall failed, may need manual fix"
    }
else
    echo "✓ npm is working"
fi
echo ""

# 3. Check PM2 logs for errors
echo "--- Checking PM2 Error Logs ---"
echo "Backend errors (last 10 lines):"
$PM2_CMD logs backend --err --lines 10 --nostream 2>/dev/null | tail -10 || echo "No backend errors"
echo ""

echo "Frontend errors (last 10 lines):"
$PM2_CMD logs frontend --err --lines 10 --nostream 2>/dev/null | tail -10 || echo "No frontend errors"
echo ""

# 4. Stop all processes
echo "--- Stopping All PM2 Processes ---"
$PM2_CMD stop all
sleep 2
$PM2_CMD delete all
echo ""

# 5. Restart with ecosystem config
echo "--- Starting Services with ecosystem.config.js ---"
cd /var/www/0xmintyn-Main

# Verify ecosystem.config.js exists
if [ ! -f ecosystem.config.js ]; then
    echo "❌ ecosystem.config.js not found!"
    exit 1
fi

$PM2_CMD start ecosystem.config.js
echo ""

# 6. Wait for processes to start
echo "Waiting 5 seconds for processes to initialize..."
sleep 5

# 7. Check status
echo "--- PM2 Status ---"
$PM2_CMD list
echo ""

# 8. Check if processes are running
echo "--- Process Details ---"
$PM2_CMD describe backend | grep -E "status|restarts|uptime|interpreter|error" || echo "Backend not running"
echo ""
$PM2_CMD describe frontend | grep -E "status|restarts|uptime|interpreter|error" || echo "Frontend not running"
echo ""

# 9. If still having issues, show recent logs
if $PM2_CMD list | grep -qE "errored|stopped"; then
    echo "⚠️  Some processes have issues. Recent logs:"
    $PM2_CMD logs --lines 30 --nostream | tail -30
fi

echo ""
echo "=========================================="
echo "FIX COMPLETE"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Check PM2 status: $PM2_CMD list"
echo "2. Monitor logs: $PM2_CMD logs"
echo "3. Install curl for testing: apt install curl"
echo ""

#!/bin/bash

# ============================================================================
# Fix PM2 Errors
# Restarts PM2 processes with correct Node.js version
# ============================================================================

echo "=========================================="
echo "FIXING PM2 ERRORS"
echo "=========================================="
echo ""

PM2_CMD="/root/.nvm/versions/node/v24.12.0/bin/pm2"

# 1. Check current PM2 status
echo "--- Current PM2 Status ---"
$PM2_CMD list
echo ""

# 2. Check PM2 logs for errors
echo "--- Backend Error Log (Last 20 lines) ---"
$PM2_CMD logs backend --err --lines 20 --nostream 2>/dev/null || echo "No error log found"
echo ""

echo "--- Frontend Error Log (Last 20 lines) ---"
$PM2_CMD logs frontend --err --lines 20 --nostream 2>/dev/null || echo "No error log found"
echo ""

# 3. Delete all processes
echo "--- Deleting All PM2 Processes ---"
$PM2_CMD delete all
echo ""

# 4. Verify Node.js version
echo "--- Verifying Node.js Version ---"
/root/.nvm/versions/node/v24.12.0/bin/node --version
/root/.nvm/versions/node/v24.12.0/bin/npm --version
echo ""

# 5. Check if ecosystem.config.js exists
if [ ! -f /var/www/0xmintyn-Main/ecosystem.config.js ]; then
    echo "❌ ecosystem.config.js not found!"
    echo "Please ensure ecosystem.config.js is in /var/www/0xmintyn-Main/"
    exit 1
fi

# 6. Start with ecosystem config
echo "--- Starting PM2 with ecosystem.config.js ---"
cd /var/www/0xmintyn-Main
$PM2_CMD start ecosystem.config.js
echo ""

# 7. Wait a moment for processes to start
sleep 3

# 8. Check status again
echo "--- PM2 Status After Restart ---"
$PM2_CMD list
echo ""

# 9. Check if processes are running
echo "--- Process Details ---"
$PM2_CMD describe backend | grep -E "status|restarts|uptime|interpreter" || echo "Backend not running"
echo ""
$PM2_CMD describe frontend | grep -E "status|restarts|uptime|interpreter" || echo "Frontend not running"
echo ""

# 10. If still errored, show recent logs
if $PM2_CMD list | grep -q "errored"; then
    echo "⚠️  Some processes are still errored. Recent logs:"
    $PM2_CMD logs --lines 50 --nostream | tail -30
fi

echo ""
echo "=========================================="
echo "FIX COMPLETE"
echo "=========================================="

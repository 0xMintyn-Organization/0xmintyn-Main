#!/bin/bash

# ============================================================================
# Emergency Memory Fix Script
# Run this immediately when OOM killer is active
# ============================================================================

echo "=========================================="
echo "EMERGENCY MEMORY DIAGNOSIS"
echo "=========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 1. Check current memory status
echo "--- Current Memory Status ---"
free -h
echo ""

MEM_AVAILABLE=$(free | grep Mem | awk '{print $7}')
MEM_TOTAL=$(free | grep Mem | awk '{print $2}')
MEM_PERCENT=$((MEM_AVAILABLE * 100 / MEM_TOTAL))

if [ $MEM_PERCENT -lt 5 ]; then
    echo -e "${RED}⚠ CRITICAL: Only ${MEM_PERCENT}% memory available!${NC}"
    echo "OOM killer is active. Immediate action required!"
elif [ $MEM_PERCENT -lt 10 ]; then
    echo -e "${RED}⚠ WARNING: Low memory (${MEM_PERCENT}% available)${NC}"
else
    echo -e "${GREEN}✓ Memory status: ${MEM_PERCENT}% available${NC}"
fi
echo ""

# 2. Check OOM killer history
echo "--- OOM Killer History (Last 20) ---"
dmesg | grep -i "out of memory\|oom" | tail -20
echo ""

# 3. Top memory consumers
echo "--- Top 10 Memory Consumers ---"
ps aux --sort=-%mem | head -11
echo ""

# 4. Check PM2 processes
echo "--- PM2 Process Memory Usage ---"
if command -v pm2 >/dev/null 2>&1; then
    pm2 list
    echo ""
    echo "--- PM2 Memory Details ---"
    pm2 list | grep -E "backend|frontend" | awk '{print $2, "Memory:", $6}'
else
    /root/.nvm/versions/node/v24.12.0/bin/pm2 list 2>/dev/null || echo "PM2 not accessible"
fi
echo ""

# 5. Check for memory leaks in Node processes
echo "--- Node.js Process Memory ---"
ps aux | grep -E "node|ts-node" | grep -v grep | awk '{print $2, $4"%", $6/1024"MB", $11}'
echo ""

# 6. Check swap usage
echo "--- Swap Usage ---"
swapon --show
free | grep Swap
echo ""

# 7. Immediate actions
echo "=========================================="
echo "IMMEDIATE ACTIONS"
echo "=========================================="
echo ""

if [ $MEM_PERCENT -lt 10 ]; then
    echo -e "${YELLOW}Recommended immediate actions:${NC}"
    echo ""
    echo "1. Restart PM2 processes to free memory:"
    echo "   pm2 restart all"
    echo ""
    echo "2. If that doesn't help, restart the server:"
    echo "   reboot"
    echo ""
    echo "3. Check for memory leaks in application code"
    echo ""
    echo "4. Consider increasing server RAM"
    echo ""
else
    echo -e "${GREEN}Memory is not critically low, but monitor closely${NC}"
fi

echo ""
echo "=========================================="
echo "DIAGNOSIS COMPLETE"
echo "=========================================="

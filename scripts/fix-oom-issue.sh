#!/bin/bash

# ============================================================================
# Fix OOM Killer Issue
# Addresses the problem where processes are killed even with available memory
# ============================================================================

echo "=========================================="
echo "FIXING OOM KILLER ISSUE"
echo "=========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 1. Check /etc/profile for problematic scripts
echo "--- Checking /etc/profile ---"
if [ -f /etc/profile ]; then
    echo "Checking line 32 of /etc/profile:"
    sed -n '30,35p' /etc/profile
    echo ""
    
    # Check for sleep commands in profile
    if grep -q "sleep 30" /etc/profile; then
        echo -e "${YELLOW}⚠ Found 'sleep 30' in /etc/profile${NC}"
        echo "This might be causing the issue if it's in a loop or being called repeatedly"
    fi
else
    echo "/etc/profile not found"
fi
echo ""

# 2. Check for memory spikes
echo "--- Checking for Memory Spikes ---"
echo "Monitoring memory for 10 seconds..."
for i in {1..10}; do
    MEM_AVAILABLE=$(free | grep Mem | awk '{print $7}')
    MEM_TOTAL=$(free | grep Mem | awk '{print $2}')
    MEM_PERCENT=$((MEM_AVAILABLE * 100 / MEM_TOTAL))
    echo "Second $i: ${MEM_PERCENT}% available"
    sleep 1
done
echo ""

# 3. Check OOM killer configuration
echo "--- OOM Killer Configuration ---"
if [ -f /proc/sys/vm/oom_kill_allocating_task ]; then
    echo "oom_kill_allocating_task: $(cat /proc/sys/vm/oom_kill_allocating_task)"
fi
if [ -f /proc/sys/vm/overcommit_memory ]; then
    echo "overcommit_memory: $(cat /proc/sys/vm/overcommit_memory)"
    echo "  (0 = heuristic, 1 = always, 2 = never)"
fi
if [ -f /proc/sys/vm/overcommit_ratio ]; then
    echo "overcommit_ratio: $(cat /proc/sys/vm/overcommit_ratio)%"
fi
echo ""

# 4. Check PM2 process limits
echo "--- PM2 Process Limits ---"
if command -v pm2 >/dev/null 2>&1; then
    PM2_CMD=pm2
else
    PM2_CMD=/root/.nvm/versions/node/v24.12.0/bin/pm2
fi

$PM2_CMD describe backend 2>/dev/null | grep -E "memory|max_memory" || echo "No memory limits set"
$PM2_CMD describe frontend 2>/dev/null | grep -E "memory|max_memory" || echo "No memory limits set"
echo ""

# 5. Check for processes with high memory usage
echo "--- Processes with High Memory Usage ---"
ps aux --sort=-%mem | head -15
echo ""

# 6. Check systemd OOM settings
echo "--- Systemd OOM Settings ---"
if command -v systemctl >/dev/null 2>&1; then
    systemctl show --property=MemoryLimit --property=MemoryHigh --property=MemoryMax 2>/dev/null | head -5 || echo "No systemd memory limits configured"
fi
echo ""

# 7. Recommendations
echo "=========================================="
echo "RECOMMENDATIONS"
echo "=========================================="
echo ""

MEM_AVAILABLE=$(free | grep Mem | awk '{print $7}')
MEM_TOTAL=$(free | grep Mem | awk '{print $2}')
MEM_PERCENT=$((MEM_AVAILABLE * 100 / MEM_TOTAL))

echo "1. Add Swap Space (Temporary Fix):"
echo "   This will prevent OOM kills by using disk as backup memory"
echo "   Run: scripts/add-swap.sh"
echo ""

echo "2. Set PM2 Memory Limits:"
echo "   This will prevent processes from consuming too much memory"
echo "   Edit ecosystem.config.js or PM2 config to add max_memory_restart"
echo ""

echo "3. Check /etc/profile:"
echo "   Review line 32 and surrounding lines for problematic scripts"
echo "   If 'sleep 30' is in a loop, remove or fix it"
echo ""

echo "4. Monitor Memory Continuously:"
echo "   watch -n 1 free -h"
echo ""

echo "5. Adjust OOM Killer Sensitivity:"
echo "   echo 1 > /proc/sys/vm/oom_kill_allocating_task"
echo "   (Makes OOM killer more selective)"
echo ""

echo "=========================================="
echo "DIAGNOSIS COMPLETE"
echo "=========================================="

#!/bin/bash

# ============================================================================
# Server Diagnostic Script
# Comprehensive analysis of server downtime issues
# ============================================================================

echo "=========================================="
echo "SERVER DIAGNOSTIC REPORT"
echo "Generated: $(date)"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print section headers
print_section() {
    echo ""
    echo "=========================================="
    echo "$1"
    echo "=========================================="
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# ============================================================================
# 1. SYSTEM RESOURCE CHECK
# ============================================================================
print_section "1. SYSTEM RESOURCE ANALYSIS"

echo "--- CPU Usage ---"
top -bn1 | grep "Cpu(s)" | sed "s/.*, *\([0-9.]*\)%* id.*/\1/" | awk '{print "CPU Idle: " 100 - $1"%"}'
echo ""

echo "--- Memory Usage ---"
free -h
echo ""

echo "--- Memory Details ---"
cat /proc/meminfo | grep -E "MemTotal|MemFree|MemAvailable|SwapTotal|SwapFree"
echo ""

echo "--- Disk Usage ---"
df -h
echo ""

echo "--- Disk I/O ---"
iostat -x 1 2 2>/dev/null || echo "iostat not available. Install sysstat: apt-get install sysstat"
echo ""

echo "--- Load Average ---"
uptime
echo ""

# Check for OOM (Out of Memory) killer
echo "--- OOM Killer History ---"
if [ -f /var/log/kern.log ]; then
    grep -i "out of memory\|oom" /var/log/kern.log | tail -20
elif [ -f /var/log/syslog ]; then
    grep -i "out of memory\|oom" /var/log/syslog | tail -20
else
    dmesg | grep -i "out of memory\|oom" | tail -20
fi
echo ""

# ============================================================================
# 2. PROCESS STATUS
# ============================================================================
print_section "2. PROCESS STATUS"

echo "--- PM2 Process List ---"
if command_exists pm2; then
    pm2 list
    echo ""
    echo "--- PM2 Process Details ---"
    pm2 describe all
    echo ""
    echo "--- PM2 Process Memory Usage ---"
    pm2 list | grep -E "backend|frontend" | awk '{print $2, $6}'
else
    echo "PM2 not found in PATH. Checking with full path..."
    /root/.nvm/versions/node/v24.12.0/bin/pm2 list 2>/dev/null || echo "PM2 not accessible"
fi
echo ""

echo "--- Node.js Processes ---"
ps aux | grep -E "node|ts-node" | grep -v grep
echo ""

echo "--- Process Tree ---"
pstree -p 2>/dev/null || ps auxf | head -30
echo ""

echo "--- Top Memory Consumers ---"
ps aux --sort=-%mem | head -10
echo ""

echo "--- Top CPU Consumers ---"
ps aux --sort=-%cpu | head -10
echo ""

# ============================================================================
# 3. APPLICATION LOGS
# ============================================================================
print_section "3. APPLICATION LOGS ANALYSIS"

echo "--- PM2 Logs (Last 100 lines) ---"
if command_exists pm2; then
    echo "Backend logs:"
    pm2 logs backend --lines 100 --nostream 2>/dev/null | tail -50
    echo ""
    echo "Frontend logs:"
    pm2 logs frontend --lines 100 --nostream 2>/dev/null | tail -50
else
    /root/.nvm/versions/node/v24.12.0/bin/pm2 logs backend --lines 100 --nostream 2>/dev/null | tail -50
    echo ""
    /root/.nvm/versions/node/v24.12.0/bin/pm2 logs frontend --lines 100 --nostream 2>/dev/null | tail -50
fi
echo ""

echo "--- Error Patterns in Logs ---"
if command_exists pm2; then
    pm2 logs backend --lines 1000 --nostream 2>/dev/null | grep -iE "error|exception|fatal|crash|memory|leak|timeout" | tail -30
else
    /root/.nvm/versions/node/v24.12.0/bin/pm2 logs backend --lines 1000 --nostream 2>/dev/null | grep -iE "error|exception|fatal|crash|memory|leak|timeout" | tail -30
fi
echo ""

# ============================================================================
# 4. NETWORK STATUS
# ============================================================================
print_section "4. NETWORK STATUS"

echo "--- Listening Ports ---"
netstat -tulpn 2>/dev/null | grep -E "8000|3000|443|80" || ss -tulpn | grep -E "8000|3000|443|80"
echo ""

echo "--- Active Connections ---"
netstat -an 2>/dev/null | grep ESTABLISHED | wc -l | awk '{print "Active connections: " $1}'
echo ""

echo "--- Nginx Status ---"
systemctl status nginx --no-pager -l 2>/dev/null | head -20
echo ""

echo "--- Nginx Error Log (Last 50 lines) ---"
tail -50 /var/log/nginx/error.log 2>/dev/null || echo "Nginx error log not accessible"
echo ""

# ============================================================================
# 5. DATABASE CONNECTION
# ============================================================================
print_section "5. DATABASE CONNECTION STATUS"

echo "--- MongoDB Connection Test ---"
if command_exists mongosh; then
    mongosh --eval "db.adminCommand('ping')" 2>/dev/null || echo "MongoDB connection failed"
else
    echo "MongoDB shell not available (using Atlas - connection check via app)"
fi
echo ""

echo "--- Active Database Connections ---"
# Check if there are MongoDB connections
netstat -an 2>/dev/null | grep -E "27017|mongodb" | wc -l | awk '{print "MongoDB connections: " $1}'
echo ""

# ============================================================================
# 6. SYSTEM LOGS
# ============================================================================
print_section "6. SYSTEM LOGS ANALYSIS"

echo "--- System Log (Last 50 lines) ---"
tail -50 /var/log/syslog 2>/dev/null || tail -50 /var/log/messages 2>/dev/null || echo "System log not accessible"
echo ""

echo "--- Recent System Errors ---"
journalctl -p err -n 50 --no-pager 2>/dev/null || echo "journalctl not available"
echo ""

echo "--- Recent Crashes ---"
journalctl --since "2 hours ago" | grep -iE "crash|killed|segfault|core dump" | tail -20
echo ""

# ============================================================================
# 7. FILE SYSTEM CHECK
# ============================================================================
print_section "7. FILE SYSTEM CHECK"

echo "--- Inode Usage ---"
df -i
echo ""

echo "--- Large Files (Top 10) ---"
find /var/www -type f -size +100M 2>/dev/null | head -10
echo ""

echo "--- Log File Sizes ---"
du -sh /var/log/* 2>/dev/null | sort -h | tail -10
echo ""

# ============================================================================
# 8. PM2 SPECIFIC CHECKS
# ============================================================================
print_section "8. PM2 DETAILED ANALYSIS"

if command_exists pm2; then
    PM2_CMD=pm2
else
    PM2_CMD=/root/.nvm/versions/node/v24.12.0/bin/pm2
fi

echo "--- PM2 Process Info ---"
$PM2_CMD describe backend 2>/dev/null
echo ""

echo "--- PM2 Process Info (Frontend) ---"
$PM2_CMD describe frontend 2>/dev/null
echo ""

echo "--- PM2 Restart Count ---"
$PM2_CMD list | grep -E "backend|frontend" | awk '{print $2 " restarts: " $12}'
echo ""

echo "--- PM2 Uptime ---"
$PM2_CMD list | grep -E "backend|frontend" | awk '{print $2 " uptime: " $9}'
echo ""

# ============================================================================
# 9. ENVIRONMENT CHECK
# ============================================================================
print_section "9. ENVIRONMENT CHECK"

echo "--- Node.js Version ---"
node --version 2>/dev/null || /root/.nvm/versions/node/v24.12.0/bin/node --version
echo ""

echo "--- NPM Version ---"
npm --version 2>/dev/null || /root/.nvm/versions/node/v24.12.0/bin/npm --version
echo ""

echo "--- Environment Variables Check ---"
cd /var/www/0xmintyn-Main/Backend 2>/dev/null
if [ -f .env ]; then
    echo "Backend .env exists"
    # Check critical vars without exposing values
    grep -E "^DB_URI|^PORT|^NODE_ENV" .env | sed 's/=.*/=***/' 2>/dev/null
else
    echo "Backend .env not found"
fi
echo ""

# ============================================================================
# 10. MEMORY LEAK DETECTION
# ============================================================================
print_section "10. MEMORY LEAK DETECTION"

echo "--- Process Memory Growth (if PM2 monitoring available) ---"
$PM2_CMD monit 2>/dev/null | head -20 || echo "PM2 monit not available"
echo ""

echo "--- Heap Memory Usage (if available) ---"
# Check if we can get heap stats from Node processes
ps aux | grep node | grep -v grep | head -1 | awk '{print "PID: " $2}'
echo ""

# ============================================================================
# 11. RECOMMENDATIONS
# ============================================================================
print_section "11. QUICK DIAGNOSTIC SUMMARY"

echo "Checking critical issues..."
echo ""

# Check memory
MEM_AVAILABLE=$(free | grep Mem | awk '{print $7}')
MEM_TOTAL=$(free | grep Mem | awk '{print $2}')
MEM_PERCENT=$((MEM_AVAILABLE * 100 / MEM_TOTAL))

if [ $MEM_PERCENT -lt 10 ]; then
    echo -e "${RED}⚠ WARNING: Low available memory (${MEM_PERCENT}% available)${NC}"
else
    echo -e "${GREEN}✓ Memory status: OK (${MEM_PERCENT}% available)${NC}"
fi

# Check disk
DISK_USAGE=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
if [ $DISK_USAGE -gt 90 ]; then
    echo -e "${RED}⚠ WARNING: Disk usage high (${DISK_USAGE}%)${NC}"
else
    echo -e "${GREEN}✓ Disk usage: OK (${DISK_USAGE}%)${NC}"
fi

# Check if processes are running
if $PM2_CMD list 2>/dev/null | grep -q "backend.*online"; then
    echo -e "${GREEN}✓ Backend process: Running${NC}"
else
    echo -e "${RED}⚠ WARNING: Backend process not running${NC}"
fi

if $PM2_CMD list 2>/dev/null | grep -q "frontend.*online"; then
    echo -e "${GREEN}✓ Frontend process: Running${NC}"
else
    echo -e "${RED}⚠ WARNING: Frontend process not running${NC}"
fi

# Check load average
LOAD=$(uptime | awk -F'load average:' '{print $2}' | awk '{print $1}' | sed 's/,//')
CPU_COUNT=$(nproc)
LOAD_THRESHOLD=$(echo "$CPU_COUNT * 2" | bc)

if (( $(echo "$LOAD > $LOAD_THRESHOLD" | bc -l) )); then
    echo -e "${RED}⚠ WARNING: High load average (${LOAD})${NC}"
else
    echo -e "${GREEN}✓ Load average: OK (${LOAD})${NC}"
fi

echo ""
echo "=========================================="
echo "DIAGNOSTIC COMPLETE"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Review the sections above for errors"
echo "2. Check PM2 logs: pm2 logs backend --lines 500"
echo "3. Check system logs: journalctl -xe"
echo "4. Monitor resources: pm2 monit"
echo "5. Check for memory leaks in application code"
echo ""

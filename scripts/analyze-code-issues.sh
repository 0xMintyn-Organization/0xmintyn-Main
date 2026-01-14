#!/bin/bash

# ============================================================================
# Code Analysis Script
# Checks for common issues that can cause server crashes
# ============================================================================

echo "=========================================="
echo "CODE ANALYSIS REPORT"
echo "Generated: $(date)"
echo "=========================================="
echo ""

cd /var/www/0xmintyn-Main/Backend || exit 1

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_section() {
    echo ""
    echo "=========================================="
    echo "$1"
    echo "=========================================="
}

# ============================================================================
# 1. MEMORY LEAK PATTERNS
# ============================================================================
print_section "1. MEMORY LEAK PATTERNS"

echo "--- setInterval/setTimeout without cleanup ---"
grep -rn "setInterval\|setTimeout" --include="*.ts" --include="*.js" . | grep -v "node_modules" | grep -v "\.d\.ts" | while read line; do
    file=$(echo "$line" | cut -d: -f1)
    content=$(echo "$line" | cut -d: -f2-)
    if ! grep -q "clearInterval\|clearTimeout" "$file" 2>/dev/null; then
        echo -e "${YELLOW}⚠ Potential issue:${NC} $line"
    fi
done
echo ""

echo "--- Event listeners without cleanup ---"
grep -rn "\.on(" --include="*.ts" --include="*.js" . | grep -v "node_modules" | grep -v "\.d\.ts" | head -20
echo ""

echo "--- Socket connections ---"
grep -rn "socket\.on\|io\.on" --include="*.ts" --include="*.js" . | grep -v "node_modules" | grep -v "\.d\.ts"
echo ""

# ============================================================================
# 2. ERROR HANDLING
# ============================================================================
print_section "2. ERROR HANDLING CHECK"

echo "--- Missing try-catch in async functions ---"
grep -rn "async.*=>" --include="*.ts" --include="*.js" . | grep -v "node_modules" | grep -v "\.d\.ts" | head -10
echo ""

echo "--- Unhandled promise rejections ---"
grep -rn "Promise\.\|\.then\|\.catch" --include="*.ts" --include="*.js" . | grep -v "node_modules" | grep -v "\.d\.ts" | grep -v "\.catch" | head -10
echo ""

echo "--- Global error handlers check ---"
if grep -q "unhandledRejection\|uncaughtException" server.ts 2>/dev/null; then
    echo -e "${GREEN}✓ Global error handlers found${NC}"
else
    echo -e "${RED}⚠ No global error handlers found${NC}"
fi
echo ""

# ============================================================================
# 3. DATABASE CONNECTIONS
# ============================================================================
print_section "3. DATABASE CONNECTION CHECK"

echo "--- Multiple mongoose.connect calls ---"
grep -rn "mongoose\.connect\|createConnection" --include="*.ts" --include="*.js" . | grep -v "node_modules" | grep -v "\.d\.ts"
echo ""

echo "--- Connection cleanup on shutdown ---"
if grep -q "SIGTERM\|SIGINT" utils/db.ts 2>/dev/null; then
    echo -e "${GREEN}✓ Connection cleanup handlers found${NC}"
else
    echo -e "${YELLOW}⚠ No connection cleanup handlers found${NC}"
fi
echo ""

# ============================================================================
# 4. INFINITE LOOPS
# ============================================================================
print_section "4. INFINITE LOOP PATTERNS"

echo "--- While loops without breaks ---"
grep -rn "while.*true\|while.*1" --include="*.ts" --include="*.js" . | grep -v "node_modules" | grep -v "\.d\.ts"
echo ""

echo "--- Recursive functions without base case ---"
grep -rn "function.*{" --include="*.ts" --include="*.js" . | grep -v "node_modules" | grep -v "\.d\.ts" | head -5
echo ""

# ============================================================================
# 5. RESOURCE USAGE
# ============================================================================
print_section "5. RESOURCE USAGE PATTERNS"

echo "--- Large file operations ---"
grep -rn "readFileSync\|writeFileSync" --include="*.ts" --include="*.js" . | grep -v "node_modules" | grep -v "\.d\.ts"
echo ""

echo "--- Large array operations ---"
grep -rn "\.map\|\.filter\|\.forEach" --include="*.ts" --include="*.js" . | grep -v "node_modules" | grep -v "\.d\.ts" | wc -l | awk '{print "Array operations found: " $1}'
echo ""

# ============================================================================
# 6. LOGGING ISSUES
# ============================================================================
print_section "6. LOGGING ANALYSIS"

echo "--- Excessive console.log in production code ---"
LOG_COUNT=$(grep -rn "console\.log" --include="*.ts" --include="*.js" . | grep -v "node_modules" | grep -v "\.d\.ts" | wc -l)
echo "Total console.log statements: $LOG_COUNT"
if [ $LOG_COUNT -gt 100 ]; then
    echo -e "${YELLOW}⚠ High number of console.log statements${NC}"
fi
echo ""

# ============================================================================
# 7. RATE LIMITING
# ============================================================================
print_section "7. RATE LIMITING CHECK"

if grep -q "rateLimit\|express-rate-limit" app.ts 2>/dev/null; then
    echo -e "${GREEN}✓ Rate limiting configured${NC}"
else
    echo -e "${YELLOW}⚠ No rate limiting found${NC}"
fi
echo ""

# ============================================================================
# 8. SUMMARY
# ============================================================================
print_section "8. CODE ANALYSIS SUMMARY"

echo "Files analyzed:"
find . -name "*.ts" -o -name "*.js" | grep -v node_modules | wc -l | awk '{print "  - TypeScript/JavaScript files: " $1}'

echo ""
echo "Common issues to review:"
echo "  1. Check for memory leaks in event listeners"
echo "  2. Ensure all async operations have error handling"
echo "  3. Verify database connections are properly closed"
echo "  4. Review infinite loops and recursive functions"
echo "  5. Check for excessive logging"
echo ""

echo "=========================================="
echo "ANALYSIS COMPLETE"
echo "=========================================="

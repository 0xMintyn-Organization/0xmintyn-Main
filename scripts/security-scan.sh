#!/bin/bash

# ============================================================================
# Security Scan - Check for Other Malicious Code
# Scans for common malware patterns
# ============================================================================

echo "=========================================="
echo "SECURITY SCAN - MALWARE DETECTION"
echo "=========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

FOUND_ISSUES=0

# 1. Check for suspicious processes
echo "--- Checking for Suspicious Processes ---"
SUSPICIOUS=$(ps aux | grep -E "sleep 30|while true|\.sh.*&$" | grep -v grep)
if [ -n "$SUSPICIOUS" ]; then
    echo -e "${RED}⚠️  Found suspicious processes:${NC}"
    echo "$SUSPICIOUS"
    FOUND_ISSUES=$((FOUND_ISSUES + 1))
else
    echo -e "${GREEN}✓ No suspicious processes found${NC}"
fi
echo ""

# 2. Check /etc/profile for malicious patterns
echo "--- Checking /etc/profile ---"
if grep -qE "while true|sleep.*&|\.sh.*&" /etc/profile; then
    echo -e "${RED}⚠️  Found suspicious patterns in /etc/profile:${NC}"
    grep -nE "while true|sleep.*&|\.sh.*&" /etc/profile
    FOUND_ISSUES=$((FOUND_ISSUES + 1))
else
    echo -e "${GREEN}✓ /etc/profile looks clean${NC}"
fi
echo ""

# 3. Check /etc/profile.d/ for malicious scripts
echo "--- Checking /etc/profile.d/ ---"
MALICIOUS_FILES=$(grep -rE "while true|sleep.*&|\.sh.*&" /etc/profile.d/ 2>/dev/null)
if [ -n "$MALICIOUS_FILES" ]; then
    echo -e "${RED}⚠️  Found suspicious patterns in /etc/profile.d/:${NC}"
    echo "$MALICIOUS_FILES"
    FOUND_ISSUES=$((FOUND_ISSUES + 1))
else
    echo -e "${GREEN}✓ /etc/profile.d/ looks clean${NC}"
fi
echo ""

# 4. Check ~/.bashrc and ~/.bash_profile
echo "--- Checking User Profile Files ---"
for file in ~/.bashrc ~/.bash_profile ~/.profile; do
    if [ -f "$file" ]; then
        if grep -qE "while true|sleep.*&|\.sh.*&" "$file"; then
            echo -e "${RED}⚠️  Found suspicious patterns in $file:${NC}"
            grep -nE "while true|sleep.*&|\.sh.*&" "$file"
            FOUND_ISSUES=$((FOUND_ISSUES + 1))
        fi
    fi
done
if [ $FOUND_ISSUES -eq 0 ]; then
    echo -e "${GREEN}✓ User profile files look clean${NC}"
fi
echo ""

# 5. Check cron jobs
echo "--- Checking Cron Jobs ---"
SUSPICIOUS_CRON=$(crontab -l 2>/dev/null | grep -E "sleep.*&|while true|\.sh.*&")
if [ -n "$SUSPICIOUS_CRON" ]; then
    echo -e "${RED}⚠️  Found suspicious cron jobs:${NC}"
    echo "$SUSPICIOUS_CRON"
    FOUND_ISSUES=$((FOUND_ISSUES + 1))
else
    echo -e "${GREEN}✓ No suspicious cron jobs found${NC}"
fi

# Check system cron
if [ -d /etc/cron.d ]; then
    SUSPICIOUS_SYSTEM_CRON=$(grep -rE "sleep.*&|while true|\.sh.*&" /etc/cron.d/ 2>/dev/null)
    if [ -n "$SUSPICIOUS_SYSTEM_CRON" ]; then
        echo -e "${RED}⚠️  Found suspicious system cron jobs:${NC}"
        echo "$SUSPICIOUS_SYSTEM_CRON"
        FOUND_ISSUES=$((FOUND_ISSUES + 1))
    fi
fi
echo ""

# 6. Check for known malware patterns
echo "--- Checking for Known Malware Patterns ---"
KNOWN_MALWARE=$(ps aux | grep -E "x86_64\.kok|wd1|powershell|svchost" | grep -v grep)
if [ -n "$KNOWN_MALWARE" ]; then
    echo -e "${RED}⚠️  Found known malware processes:${NC}"
    echo "$KNOWN_MALWARE"
    FOUND_ISSUES=$((FOUND_ISSUES + 1))
else
    echo -e "${GREEN}✓ No known malware processes found${NC}"
fi
echo ""

# Summary
echo "=========================================="
echo "SCAN SUMMARY"
echo "=========================================="
if [ $FOUND_ISSUES -eq 0 ]; then
    echo -e "${GREEN}✓ No security issues found${NC}"
else
    echo -e "${RED}⚠️  Found $FOUND_ISSUES potential security issue(s)${NC}"
    echo "Review the output above and take appropriate action"
fi
echo ""

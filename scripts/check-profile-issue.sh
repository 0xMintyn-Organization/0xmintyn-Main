#!/bin/bash

# ============================================================================
# Check /etc/profile Issue
# Investigates the sleep 30 issue in /etc/profile
# ============================================================================

echo "=========================================="
echo "CHECKING /etc/profile ISSUE"
echo "=========================================="
echo ""

# Check if /etc/profile exists
if [ ! -f /etc/profile ]; then
    echo "❌ /etc/profile not found"
    exit 1
fi

echo "--- /etc/profile Content (lines 25-40) ---"
sed -n '25,40p' /etc/profile
echo ""

echo "--- Checking for 'sleep 30' ---"
if grep -n "sleep 30" /etc/profile; then
    echo ""
    echo "⚠️  Found 'sleep 30' in /etc/profile"
    echo "Line numbers above show where it appears"
else
    echo "No 'sleep 30' found in /etc/profile"
fi
echo ""

echo "--- Checking for problematic patterns ---"
echo "Checking for loops or repeated commands:"
grep -n "while\|for\|sleep" /etc/profile | head -10
echo ""

echo "--- Checking sourced files ---"
echo "Files sourced by /etc/profile:"
grep -n "source\|\\." /etc/profile | grep -v "^#" | head -10
echo ""

echo "--- Checking /etc/profile.d/ ---"
if [ -d /etc/profile.d ]; then
    echo "Files in /etc/profile.d/:"
    ls -la /etc/profile.d/
    echo ""
    echo "Checking for sleep commands in profile.d:"
    grep -r "sleep 30" /etc/profile.d/ 2>/dev/null || echo "No 'sleep 30' found in profile.d"
fi
echo ""

echo "=========================================="
echo "RECOMMENDATIONS"
echo "=========================================="
echo ""
echo "If 'sleep 30' is found:"
echo "1. Comment it out or remove it"
echo "2. Check if it's in a loop - if so, fix the loop"
echo "3. If it's needed, add proper error handling"
echo ""
echo "To fix:"
echo "  sudo nano /etc/profile"
echo "  # Comment out or remove the problematic line"
echo ""

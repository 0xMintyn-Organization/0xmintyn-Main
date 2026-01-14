#!/bin/bash

# ============================================================================
# Remove Malicious Code from /etc/profile
# Removes the infinite loop that's causing OOM kills
# ============================================================================

echo "=========================================="
echo "REMOVING MALICIOUS CODE FROM /etc/profile"
echo "=========================================="
echo ""

# Backup /etc/profile first
if [ ! -f /etc/profile.backup ]; then
    echo "Creating backup of /etc/profile..."
    cp /etc/profile /etc/profile.backup
    echo "✅ Backup created: /etc/profile.backup"
else
    echo "⚠️  Backup already exists: /etc/profile.backup"
fi
echo ""

# Check current content
echo "--- Current problematic section (lines 29-33) ---"
sed -n '29,33p' /etc/profile
echo ""

# Remove the malicious loop
echo "Removing malicious infinite loop..."
sed -i '/^while true$/,/^done &$/d' /etc/profile

# Verify removal
echo ""
echo "--- After removal (lines 29-33) ---"
sed -n '29,33p' /etc/profile
echo ""

# Check if removal was successful
if grep -q "while true" /etc/profile; then
    echo "❌ ERROR: Malicious code still present!"
    echo "Manual removal required"
    exit 1
else
    echo "✅ Malicious code removed successfully!"
fi

echo ""
echo "=========================================="
echo "CLEANUP COMPLETE"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Kill any existing sleep processes: pkill -f 'sleep 30'"
echo "2. Start a new shell session to verify fix"
echo "3. Add swap space: ./add-swap.sh"
echo "4. Update PM2 config with memory limits"
echo ""

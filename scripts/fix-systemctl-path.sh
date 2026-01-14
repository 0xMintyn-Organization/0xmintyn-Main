#!/bin/bash

# ============================================================================
# Fix systemctl PATH Issue
# Finds systemctl and makes it accessible
# ============================================================================

echo "=========================================="
echo "FIXING SYSTEMCTL PATH"
echo "=========================================="
echo ""

# Find systemctl
echo "--- Finding systemctl ---"
SYSTEMCTL_PATH=$(find /usr /bin /sbin -name systemctl 2>/dev/null | head -1)

if [ -n "$SYSTEMCTL_PATH" ]; then
    echo "✅ Found systemctl at: $SYSTEMCTL_PATH"
    echo ""
    
    # Test it
    echo "--- Testing systemctl ---"
    $SYSTEMCTL_PATH --version
    echo ""
    
    # Create symlink in /usr/local/bin
    echo "--- Creating symlink ---"
    ln -sf "$SYSTEMCTL_PATH" /usr/local/bin/systemctl
    echo "✅ Symlink created: /usr/local/bin/systemctl -> $SYSTEMCTL_PATH"
    echo ""
    
    # Verify
    echo "--- Verifying ---"
    systemctl --version
    echo ""
    
    echo "✅ systemctl is now accessible!"
else
    echo "❌ systemctl not found"
    echo "Checking if systemd is properly installed..."
    dpkg -L systemd | grep systemctl
fi

echo ""
echo "=========================================="
echo "FIX COMPLETE"
echo "=========================================="

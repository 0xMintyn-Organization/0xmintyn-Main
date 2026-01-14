#!/bin/bash

# ============================================================================
# Fix systemctl - Final Solution
# Creates correct symlink to /bin/systemctl
# ============================================================================

echo "=========================================="
echo "FIXING SYSTEMCTL"
echo "=========================================="
echo ""

# Remove broken symlink
if [ -L /usr/local/bin/systemctl ]; then
    rm -f /usr/local/bin/systemctl
    echo "✅ Removed broken symlink"
fi

# Create correct symlink
if [ -f /bin/systemctl ]; then
    ln -sf /bin/systemctl /usr/local/bin/systemctl
    echo "✅ Created symlink: /usr/local/bin/systemctl -> /bin/systemctl"
    echo ""
    
    # Test it
    echo "--- Testing systemctl ---"
    systemctl --version
    echo ""
    
    echo "✅ systemctl is now accessible!"
else
    echo "❌ /bin/systemctl not found"
    exit 1
fi

echo ""
echo "=========================================="
echo "NOW YOU CAN USE:"
echo "=========================================="
echo ""
echo "  systemctl status fail2ban"
echo "  systemctl start fail2ban"
echo "  systemctl enable fail2ban"
echo ""

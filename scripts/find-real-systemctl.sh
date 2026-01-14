#!/bin/bash

# ============================================================================
# Find Real systemctl Location
# ============================================================================

echo "=========================================="
echo "FINDING REAL SYSTEMCTL"
echo "=========================================="
echo ""

# Remove broken symlink
rm -f /usr/local/bin/systemctl

# Check what dpkg says
echo "--- What dpkg says about systemctl ---"
dpkg -L systemd 2>/dev/null | grep systemctl
echo ""

# Check if it's in a snap
echo "--- Checking snap locations ---"
find /snap -name systemctl -type f 2>/dev/null | head -3
echo ""

# Check if we can use snap's systemctl
SNAP_SYSTEMCTL=$(find /snap -name systemctl -type f 2>/dev/null | head -1)
if [ -n "$SNAP_SYSTEMCTL" ]; then
    echo "Found in snap: $SNAP_SYSTEMCTL"
    echo "Testing..."
    $SNAP_SYSTEMCTL --version 2>/dev/null && {
        ln -sf "$SNAP_SYSTEMCTL" /usr/local/bin/systemctl
        echo "✅ Created symlink to snap systemctl"
    }
fi

# Check if we need to reinstall systemd
echo ""
echo "--- Checking systemd installation ---"
dpkg -l | grep systemd | head -5
echo ""

# Check if files are missing
echo "--- Checking for missing systemd files ---"
dpkg -L systemd 2>/dev/null | grep -E "bin/systemctl|sbin/systemctl" | while read file; do
    if [ ! -f "$file" ]; then
        echo "Missing: $file"
    fi
done
echo ""

echo "=========================================="
echo "RECOMMENDATION"
echo "=========================================="
echo ""
echo "Since systemctl is missing, use alternatives:"
echo ""
echo "1. Use service command:"
echo "   service fail2ban start"
echo "   service fail2ban status"
echo ""
echo "2. Use init.d:"
echo "   /etc/init.d/fail2ban start"
echo ""
echo "3. Use fail2ban-client:"
echo "   fail2ban-client status"
echo ""
echo "4. Reinstall systemd (if needed):"
echo "   apt install --reinstall systemd"
echo ""

#!/bin/bash

# ============================================================================
# Find systemctl or use alternatives
# ============================================================================

echo "=========================================="
echo "FINDING SYSTEMCTL OR ALTERNATIVES"
echo "=========================================="
echo ""

# Check if we're in a container
if [ -f /.dockerenv ] || grep -q docker /proc/1/cgroup 2>/dev/null; then
    echo "⚠️  Running in container environment"
    echo "systemctl may not be available"
fi

# Find systemctl in all common locations
echo "--- Searching for systemctl ---"
find / -name systemctl -type f 2>/dev/null | head -5
echo ""

# Check what's in /usr/bin
echo "--- Checking /usr/bin for systemd commands ---"
ls -la /usr/bin/system* 2>/dev/null | head -10
echo ""

# Check if systemctl is a symlink that's broken
echo "--- Checking for broken symlinks ---"
find /usr /bin /sbin -type l -name "*systemctl*" 2>/dev/null | while read link; do
    if [ ! -e "$link" ]; then
        echo "Broken symlink: $link -> $(readlink "$link")"
    fi
done
echo ""

# Check systemd package files
echo "--- Checking systemd package files ---"
dpkg -L systemd 2>/dev/null | grep -E "bin/systemctl|sbin/systemctl" | head -5
echo ""

# Alternative: Use service command
echo "--- Using service command as alternative ---"
if command -v service >/dev/null 2>&1; then
    echo "✅ service command available"
    echo ""
    echo "To manage fail2ban:"
    echo "  service fail2ban status"
    echo "  service fail2ban start"
    echo "  service fail2ban restart"
else
    echo "❌ service command not available"
fi

# Alternative: Use init.d directly
echo ""
echo "--- Using init.d directly ---"
if [ -f /etc/init.d/fail2ban ]; then
    echo "✅ /etc/init.d/fail2ban exists"
    echo ""
    echo "To manage fail2ban:"
    echo "  /etc/init.d/fail2ban status"
    echo "  /etc/init.d/fail2ban start"
    echo "  /etc/init.d/fail2ban restart"
    echo "  update-rc.d fail2ban enable  # Enable on boot"
else
    echo "❌ /etc/init.d/fail2ban not found"
fi

# Check fail2ban directly
echo ""
echo "--- Checking fail2ban directly ---"
if command -v fail2ban-client >/dev/null 2>&1; then
    echo "✅ fail2ban-client available"
    echo ""
    echo "To manage fail2ban:"
    echo "  fail2ban-client status"
    echo "  fail2ban-client start"
    echo "  fail2ban-server -x -f start  # Start in foreground for testing"
else
    echo "❌ fail2ban-client not found"
fi

echo ""
echo "=========================================="
echo "RECOMMENDATION"
echo "=========================================="
echo ""
echo "Since systemctl is not available, use one of these:"
echo ""
echo "1. service command (if available):"
echo "   service fail2ban start"
echo "   service fail2ban status"
echo ""
echo "2. init.d directly:"
echo "   /etc/init.d/fail2ban start"
echo "   update-rc.d fail2ban enable"
echo ""
echo "3. fail2ban-client:"
echo "   fail2ban-client status"
echo "   fail2ban-server -x -f start"
echo ""

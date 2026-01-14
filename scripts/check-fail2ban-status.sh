#!/bin/bash

# ============================================================================
# Check and Configure fail2ban
# Alternative methods if systemctl is not available
# ============================================================================

echo "=========================================="
echo "CHECKING FAIL2BAN STATUS"
echo "=========================================="
echo ""

# Check if fail2ban is installed
if command -v fail2ban-client >/dev/null 2>&1; then
    echo "✅ fail2ban is installed"
    echo ""
    
    # Check fail2ban status
    echo "--- fail2ban Status ---"
    fail2ban-client status 2>/dev/null || echo "fail2ban not running"
    echo ""
    
    # Check if it's running as a service
    if [ -f /etc/init.d/fail2ban ]; then
        echo "--- Using init.d to manage fail2ban ---"
        /etc/init.d/fail2ban status 2>/dev/null || echo "Service not running"
        echo ""
        echo "To start: /etc/init.d/fail2ban start"
        echo "To enable on boot: update-rc.d fail2ban enable"
    fi
    
    # Check if running as process
    if pgrep -f fail2ban >/dev/null; then
        echo "✅ fail2ban is running"
        ps aux | grep fail2ban | grep -v grep
    else
        echo "⚠️  fail2ban is not running"
        echo ""
        echo "Try to start it:"
        echo "  /etc/init.d/fail2ban start"
        echo "  OR"
        echo "  service fail2ban start"
    fi
else
    echo "❌ fail2ban is not installed"
fi

echo ""
echo "--- fail2ban Configuration ---"
if [ -f /etc/fail2ban/jail.local ]; then
    echo "Custom config: /etc/fail2ban/jail.local"
    cat /etc/fail2ban/jail.local | head -20
elif [ -f /etc/fail2ban/jail.conf ]; then
    echo "Default config: /etc/fail2ban/jail.conf"
    grep -E "^\[sshd\]|^enabled|^bantime|^findtime|^maxretry" /etc/fail2ban/jail.conf | head -10
fi

echo ""
echo "=========================================="
echo "CHECK COMPLETE"
echo "=========================================="

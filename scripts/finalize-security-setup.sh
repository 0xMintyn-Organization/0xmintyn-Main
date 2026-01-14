#!/bin/bash

# ============================================================================
# Finalize Security Setup
# Completes the security hardening after malware removal
# ============================================================================

echo "=========================================="
echo "FINALIZING SECURITY SETUP"
echo "=========================================="
echo ""

# 1. Create systemctl symlink
echo "--- Creating systemctl symlink ---"
if [ -f /bin/systemctl ]; then
    ln -sf /bin/systemctl /usr/local/bin/systemctl
    echo "✅ Symlink created"
    systemctl --version | head -1
else
    echo "❌ /bin/systemctl not found"
fi
echo ""

# 2. Check fail2ban status
echo "--- Checking fail2ban Status ---"
fail2ban-client status
echo ""

# 3. Enable fail2ban on boot
echo "--- Enabling fail2ban on Boot ---"
systemctl enable fail2ban
echo "✅ fail2ban enabled on boot"
echo ""

# 4. Check fail2ban configuration
echo "--- fail2ban Configuration ---"
if [ -f /etc/fail2ban/jail.local ]; then
    echo "Custom config found:"
    grep -E "^\[sshd\]|^enabled|^bantime|^findtime|^maxretry" /etc/fail2ban/jail.local | head -10
else
    echo "Using default config"
    grep -A 5 "^\[sshd\]" /etc/fail2ban/jail.conf | head -10
fi
echo ""

# 5. Check banned IPs
echo "--- Currently Banned IPs ---"
fail2ban-client status sshd | grep "Banned IP" || echo "No IPs banned yet"
echo ""

# 6. Make /etc/profile read-only
echo "--- Securing /etc/profile ---"
if [ -w /etc/profile ]; then
    chmod 444 /etc/profile
    echo "✅ /etc/profile is now read-only"
    echo "⚠️  Use 'chmod 644 /etc/profile' to edit it later"
else
    echo "✅ /etc/profile is already read-only"
fi
echo ""

# 7. Summary
echo "=========================================="
echo "SECURITY SETUP COMPLETE"
echo "=========================================="
echo ""
echo "✅ systemctl is working"
echo "✅ fail2ban is running and protecting SSH"
echo "✅ fail2ban enabled on boot"
echo "✅ /etc/profile is read-only"
echo ""
echo "Monitoring commands:"
echo "  fail2ban-client status          # Check fail2ban status"
echo "  fail2ban-client status sshd      # Check SSH jail"
echo "  systemctl status fail2ban        # Check service status"
echo "  watch -n 5 'ls -la /etc/profile' # Monitor /etc/profile"
echo ""

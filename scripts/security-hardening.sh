#!/bin/bash

# ============================================================================
# Security Hardening Script
# Secures the server after malware removal
# ============================================================================

echo "=========================================="
echo "SECURITY HARDENING"
echo "=========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 1. Check suspicious SSH activity
echo "--- Suspicious SSH Activity ---"
echo "Recent successful logins:"
grep "Accepted password" /var/log/auth.log | tail -10
echo ""

echo -e "${YELLOW}⚠️  SUSPICIOUS: Login from 110.38.248.134 at 11:54:30${NC}"
echo "This IP logged in right before /etc/profile was modified!"
echo ""

# 2. Block suspicious IP
echo "--- Blocking Suspicious IP ---"
read -p "Block IP 110.38.248.134? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    # Check if ufw is installed
    if command -v ufw >/dev/null 2>&1; then
        ufw deny from 110.38.248.134
        echo "✅ Blocked IP with ufw"
    else
        # Use iptables
        iptables -A INPUT -s 110.38.248.134 -j DROP
        echo "✅ Blocked IP with iptables"
        echo "⚠️  Make iptables persistent: apt install iptables-persistent"
    fi
fi
echo ""

# 3. Install fail2ban to prevent brute force
echo "--- Installing fail2ban (Brute Force Protection) ---"
read -p "Install fail2ban? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    apt update
    apt install -y fail2ban
    systemctl enable fail2ban
    systemctl start fail2ban
    echo "✅ fail2ban installed and started"
    echo ""
    echo "fail2ban will automatically ban IPs after failed login attempts"
fi
echo ""

# 4. Secure SSH
echo "--- SSH Security Recommendations ---"
echo "Current SSH config:"
grep -E "^PermitRootLogin|^PasswordAuthentication|^Port" /etc/ssh/sshd_config 2>/dev/null || echo "SSH config not found"
echo ""

echo "Recommended SSH security:"
echo "1. Disable root password login (use SSH keys only)"
echo "2. Change SSH port from default 22"
echo "3. Use strong passwords or disable password auth"
echo ""
read -p "Show SSH hardening commands? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "To harden SSH, edit /etc/ssh/sshd_config:"
    echo "  PermitRootLogin prohibit-password  # Only allow SSH keys"
    echo "  PasswordAuthentication no          # Disable password auth"
    echo "  Port 2222                          # Change from default 22"
    echo ""
    echo "Then restart: systemctl restart sshd"
fi
echo ""

# 5. Check for other persistence mechanisms
echo "--- Checking for Other Persistence Mechanisms ---"

# Check .bashrc and .bash_profile
if grep -qE "while true|sleep.*&|\.update" ~/.bashrc ~/.bash_profile 2>/dev/null; then
    echo -e "${RED}⚠️  Found malicious code in user profile files!${NC}"
    grep -nE "while true|sleep.*&|\.update" ~/.bashrc ~/.bash_profile 2>/dev/null
else
    echo -e "${GREEN}✓ User profile files clean${NC}"
fi

# Check systemd services
echo ""
echo "Checking systemd services for suspicious entries:"
systemctl list-units --type=service --state=running | grep -E "\.update|suspicious" || echo "No suspicious services found"
echo ""

# 6. Make /etc/profile read-only (temporary protection)
echo "--- Protecting /etc/profile ---"
read -p "Make /etc/profile read-only? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    chmod 444 /etc/profile
    echo "✅ /etc/profile is now read-only"
    echo "⚠️  You'll need to chmod 644 /etc/profile to edit it later"
fi
echo ""

# 7. Monitor /etc/profile for changes
echo "--- Setting up Monitoring ---"
echo "To monitor /etc/profile for changes, run:"
echo "  watch -n 5 'ls -la /etc/profile && md5sum /etc/profile'"
echo ""

echo "=========================================="
echo "SECURITY HARDENING COMPLETE"
echo "=========================================="
echo ""
echo -e "${RED}CRITICAL ACTIONS REQUIRED:${NC}"
echo ""
echo "1. ${RED}CHANGE ROOT PASSWORD IMMEDIATELY${NC}"
echo "   passwd root"
echo ""
echo "2. ${RED}Review all SSH keys${NC}"
echo "   cat ~/.ssh/authorized_keys"
echo "   Remove any unauthorized keys"
echo ""
echo "3. ${YELLOW}Consider blocking IP 110.38.248.134${NC}"
echo "   This IP logged in right before malware injection"
echo ""
echo "4. ${YELLOW}Install fail2ban to prevent brute force attacks${NC}"
echo "   apt install fail2ban"
echo ""
echo "5. ${YELLOW}Monitor /etc/profile for changes${NC}"
echo "   Set up file integrity monitoring"
echo ""

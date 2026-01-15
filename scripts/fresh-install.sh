#!/bin/bash

# ============================================================================
# Fresh OS Installation Script
# Automated setup for clean VPS installation
# ============================================================================

set -e

echo "=========================================="
echo "FRESH OS INSTALLATION"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Step 1: Update System
echo -e "${GREEN}Step 1: Updating System${NC}"
apt update && apt upgrade -y
apt install -y curl wget git build-essential software-properties-common ufw
echo "✅ System updated"
echo ""

# Step 2: Configure Firewall
echo -e "${GREEN}Step 2: Configuring Firewall${NC}"
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
echo "✅ Firewall configured"
echo ""

# Step 3: Install NVM and Node.js
echo -e "${GREEN}Step 3: Installing Node.js${NC}"
if [ ! -d "$HOME/.nvm" ]; then
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
    
    # Add to profile
    echo 'export NVM_DIR="$HOME/.nvm"' >> ~/.bashrc
    echo '[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"' >> ~/.bashrc
    echo '[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"' >> ~/.bashrc
    
    # Install Node.js
    nvm install 24
    nvm use 24
    nvm alias default 24
    
    echo "✅ Node.js installed"
else
    echo "⚠️  NVM already installed, skipping"
fi
echo ""

# Step 4: Install PM2
echo -e "${GREEN}Step 4: Installing PM2${NC}"
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
npm install -g pm2
echo "✅ PM2 installed"
echo ""

# Step 5: Install Nginx
echo -e "${GREEN}Step 5: Installing Nginx${NC}"
apt install -y nginx
systemctl start nginx
systemctl enable nginx
echo "✅ Nginx installed"
echo ""

# Step 6: Install Certbot
echo -e "${GREEN}Step 6: Installing Certbot${NC}"
apt install -y certbot python3-certbot-nginx
echo "✅ Certbot installed"
echo ""

# Step 7: Install fail2ban
echo -e "${GREEN}Step 7: Installing fail2ban${NC}"
apt install -y fail2ban
systemctl enable fail2ban
systemctl start fail2ban
echo "✅ fail2ban installed"
echo ""

# Step 8: Add Swap Space
echo -e "${GREEN}Step 8: Adding Swap Space${NC}"
if [ ! -f /swapfile ]; then
    fallocate -l 2G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
    echo "✅ Swap space added (2GB)"
else
    echo "⚠️  Swap file already exists, skipping"
fi
echo ""

# Step 9: Create Project Directory
echo -e "${GREEN}Step 9: Creating Project Directory${NC}"
mkdir -p /var/www
echo "✅ Directory created"
echo ""

echo "=========================================="
echo "INSTALLATION COMPLETE"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Clone repository: cd /var/www && git clone <repo-url>"
echo "2. Install dependencies: cd Backend && npm install && cd ../Frontend && npm install"
echo "3. Configure .env files (Backend/.env and Frontend/.env.local)"
echo "4. Start PM2: pm2 start ecosystem.config.js"
echo "5. Configure Nginx (see FRESH_INSTALL.md)"
echo "6. Setup SSL: certbot --nginx -d app.0xmintyn.com -d appbackend.0xmintyn.com"
echo "7. Setup GitHub Actions deployment (see FRESH_INSTALL.md)"
echo ""

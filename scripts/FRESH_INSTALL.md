# Fresh OS Installation Guide

Complete, streamlined guide for setting up your VPS from scratch.

## Prerequisites

- Fresh Ubuntu 22.04 LTS server
- Root access
- Domain names configured:
  - `app.0xmintyn.com` (Frontend)
  - `appbackend.0xmintyn.com` (Backend)
- DNS A records pointing to your VPS IP

---

## Step 1: Initial Server Setup

```bash
# Update system
apt update && apt upgrade -y

# Install essential tools
apt install -y curl wget git build-essential software-properties-common ufw

# Configure timezone
timedatectl set-timezone UTC

# Setup firewall
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw --force enable
```

---

## Step 2: Install Node.js (via NVM - Recommended)

```bash
# Install NVM
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Load NVM
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Add to profile
echo 'export NVM_DIR="$HOME/.nvm"' >> ~/.bashrc
echo '[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"' >> ~/.bashrc
echo '[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"' >> ~/.bashrc

# Install Node.js 24.x (or 18.x if preferred)
nvm install 24
nvm use 24
nvm alias default 24

# Verify
node --version
npm --version

# Install PM2 globally
npm install -g pm2

# Setup PM2 startup
pm2 startup
# Run the command it outputs (usually: sudo env PATH=... pm2 startup systemd -u root --hp /root)
```

---

## Step 3: Install Nginx

```bash
# Install Nginx
apt install -y nginx

# Start and enable
systemctl start nginx
systemctl enable nginx

# Verify
systemctl status nginx
```

---

## Step 4: Install Certbot (SSL)

```bash
# Install Certbot
apt install -y certbot python3-certbot-nginx

# Get SSL certificates (run after DNS is configured)
certbot --nginx -d app.0xmintyn.com -d appbackend.0xmintyn.com
```

---

## Step 5: Clone Repository

```bash
# Create project directory
mkdir -p /var/www
cd /var/www

# Clone repository (use your method)
# Option 1: HTTPS with token
git clone https://YOUR_TOKEN@github.com/0xMintyn-Organization/0xmintyn-Main.git

# Option 2: SSH (if you have SSH key setup)
# git clone git@github.com:0xMintyn-Organization/0xmintyn-Main.git

cd 0xmintyn-Main

# Configure git safe directory
git config --global --add safe.directory /var/www/0xmintyn-Main

# Checkout your branch
git checkout master
git checkout mukhtiar
```

---

## Step 6: Install Dependencies

```bash
# Backend dependencies
cd /var/www/0xmintyn-Main/Backend
npm install

# Frontend dependencies
cd /var/www/0xmintyn-Main/Frontend
npm install
```

---

## Step 7: Configure Environment Variables

### Backend (.env)

```bash
cd /var/www/0xmintyn-Main/Backend
nano .env
```

Required variables:
```
PORT=8000
NODE_ENV=development
DB_URI=mongodb+srv://username:password@cluster.mongodb.net/0xmintyn
ACCESS_TOKEN=your_access_token_secret
REFRESH_TOKEN=your_refresh_token_secret
ACTIVATION_SECRET=your_activation_secret
# ... other variables
```

### Frontend (.env.local)

```bash
cd /var/www/0xmintyn-Main/Frontend
nano .env.local
```

Required variables:
```
NEXT_PUBLIC_SERVER_URI=https://appbackend.0xmintyn.com/api/v1/
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=https://app.0xmintyn.com
# ... other variables
```

---

## Step 8: Configure PM2

The `ecosystem.config.js` is already configured. Just start it:

```bash
cd /var/www/0xmintyn-Main
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

---

## Step 9: Configure Nginx

**Important:** If `/etc/nginx/sites-available/default` already exists, you should edit it rather than create a new file, especially if SSL certificates are already configured.

### Option A: Automated Fix (Recommended)

If you have an existing config with SSL already set up, use the automated script:

```bash
cd /var/www/0xmintyn-Main/scripts
chmod +x fix-nginx-config.sh
sudo ./fix-nginx-config.sh
```

This script will:
- Backup your existing config
- Update it with proper proxy settings
- Test and reload Nginx
- Preserve SSL certificate paths

### Option B: Manual Edit

```bash
# Backup the existing file
cp /etc/nginx/sites-available/default /etc/nginx/sites-available/default.backup

# Edit the file
nano /etc/nginx/sites-available/default
```

Replace the entire content with:

```nginx
# Backend API - HTTP (redirects to HTTPS)
server {
    listen 80;
    listen [::]:80;
    server_name appbackend.0xmintyn.com;
    return 301 https://$host$request_uri;
}

# Frontend - HTTP (redirects to HTTPS)
server {
    listen 80;
    listen [::]:80;
    server_name app.0xmintyn.com;
    return 301 https://$host$request_uri;
}

# Backend API - HTTPS
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name appbackend.0xmintyn.com;

    # SSL configuration (managed by Certbot)
    # If using a single cert for both domains, use the same path for both
    # If using separate certs, use domain-specific paths
    ssl_certificate /etc/letsencrypt/live/appbackend.0xmintyn.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/appbackend.0xmintyn.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # Proxy to Backend
    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        client_max_body_size 50M;
    }
}

# Frontend - HTTPS
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name app.0xmintyn.com;

    # SSL configuration (managed by Certbot)
    ssl_certificate /etc/letsencrypt/live/app.0xmintyn.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/app.0xmintyn.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # Proxy to Frontend
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Option B: Create New Configuration File (If starting fresh)

Create `/etc/nginx/sites-available/0xmintyn`:

```nginx
# Backend API - HTTP
server {
    listen 80;
    server_name appbackend.0xmintyn.com;
    return 301 https://$host$request_uri;
}

# Frontend - HTTP
server {
    listen 80;
    server_name app.0xmintyn.com;
    return 301 https://$host$request_uri;
}

# Backend API - HTTPS
server {
    listen 443 ssl http2;
    server_name appbackend.0xmintyn.com;

    ssl_certificate /etc/letsencrypt/live/appbackend.0xmintyn.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/appbackend.0xmintyn.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        client_max_body_size 50M;
    }
}

# Frontend - HTTPS
server {
    listen 443 ssl http2;
    server_name app.0xmintyn.com;

    ssl_certificate /etc/letsencrypt/live/app.0xmintyn.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/app.0xmintyn.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Then enable it:

```bash
# Enable site (if using new file)
ln -s /etc/nginx/sites-available/0xmintyn /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
```

### Test and Reload

```bash
# Test configuration
nginx -t

# If test passes, reload Nginx
systemctl reload nginx

# Check status
systemctl status nginx
```

---

## Step 10: Setup SSL

**If SSL certificates already exist**, Certbot has already configured them. The configuration in Step 9 will use them.

**If SSL certificates don't exist yet**, run:

```bash
# Get SSL certificates for both domains
certbot --nginx -d app.0xmintyn.com -d appbackend.0xmintyn.com

# Certbot will automatically modify your nginx config to include SSL settings
# You may need to manually add the proxy_pass configurations after certbot runs

# Verify auto-renewal is configured
certbot renew --dry-run
```

**Important:** After running Certbot, verify the proxy_pass configurations are still present in your nginx config file. Certbot may have modified the server blocks, and you might need to re-add the proxy configurations.

---

## Step 11: Security Hardening

```bash
# Install fail2ban (brute force protection)
apt install -y fail2ban
systemctl enable fail2ban
systemctl start fail2ban

# Add swap space (2GB)
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab

# Secure SSH (optional but recommended)
# Edit /etc/ssh/sshd_config:
# PermitRootLogin prohibit-password
# PasswordAuthentication no
# Then: systemctl restart sshd
```

---

## Step 12: Setup Automated Deployment

The GitHub Actions workflow (`.github/workflows/deploy.yml`) is already configured.

**Setup GitHub Secrets:**
1. Go to GitHub repository → Settings → Secrets and variables → Actions
2. Add:
   - `SSH_HOST`: Your VPS IP
   - `SSH_USER`: root
   - `SSH_PRIVATE_KEY`: Your private SSH key
   - `SSH_PORT`: 22

**Generate SSH key for deployment:**
```bash
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_actions_deploy -N ""
cat ~/.ssh/github_actions_deploy.pub >> ~/.ssh/authorized_keys
cat ~/.ssh/github_actions_deploy  # Copy this to GitHub secret
```

Now every push to `mukhtiar` branch will automatically deploy!

---

## Step 13: Verify Everything

```bash
# Check PM2
pm2 list
pm2 logs

# Check Nginx
systemctl status nginx
nginx -t

# Check services
curl http://localhost:8000/test
curl http://localhost:3000

# Check fail2ban
fail2ban-client status
```

---

## Quick Reference

### PM2 Commands
```bash
pm2 list              # List processes
pm2 logs              # View logs
pm2 restart all       # Restart all
pm2 restart backend   # Restart backend only
pm2 monit             # Monitor resources
```

### Nginx Commands
```bash
nginx -t              # Test config
systemctl reload nginx # Reload config
systemctl restart nginx # Restart nginx
```

### System Commands
```bash
free -h               # Check memory
df -h                 # Check disk
systemctl status      # Check services
```

---

## Troubleshooting

### PM2 not found
```bash
# Add to PATH
export PATH=$PATH:/root/.nvm/versions/node/v24.12.0/bin
echo 'export PATH=$PATH:/root/.nvm/versions/node/v24.12.0/bin' >> ~/.bashrc
```

### Services not starting
```bash
# Check logs
pm2 logs backend --lines 50
pm2 logs frontend --lines 50

# Check environment variables
cd Backend && cat .env
cd Frontend && cat .env.local
```

### Port already in use
```bash
# Find what's using the port
lsof -i :8000
lsof -i :3000

# Kill process if needed
kill -9 <PID>
```

---

## That's It!

Your server is now set up with:
- ✅ Node.js 24.x via NVM
- ✅ PM2 with ecosystem.config.js
- ✅ Nginx reverse proxy
- ✅ SSL certificates
- ✅ fail2ban protection
- ✅ Swap space
- ✅ Automated deployment via GitHub Actions

**No manual SSH needed for deployments** - just push to GitHub!

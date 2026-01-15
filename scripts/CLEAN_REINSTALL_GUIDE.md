# Clean Reinstall from Master Branch

Complete guide to remove existing installation and set up fresh from master branch.

## Quick Start (Automated)

```bash
# On your VPS
cd /var/www/0xmintyn-Main/scripts
chmod +x clean-reinstall-master.sh
sudo ./clean-reinstall-master.sh
```

The script will:
1. ✅ Stop all PM2 processes
2. ✅ Remove existing installation
3. ✅ Clone fresh from master branch
4. ✅ Install all dependencies
5. ✅ Start PM2 processes
6. ✅ Verify everything is running

## Manual Steps

If you prefer to do it manually:

### Step 1: Stop PM2 Processes

```bash
# Load NVM
export NVM_DIR="/root/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Find and stop PM2
PM2_CMD=$(which pm2 2>/dev/null || find /root/.nvm -name pm2 2>/dev/null | head -1)
$PM2_CMD delete all
$PM2_CMD kill
```

### Step 2: Remove Existing Installation

```bash
# Remove the directory
rm -rf /var/www/0xmintyn-Main
```

### Step 3: Create Fresh Directory

```bash
mkdir -p /var/www/0xmintyn-Main
cd /var/www/0xmintyn-Main
```

### Step 4: Clone Repository

```bash
# Clone from GitHub
git clone https://github.com/0xMintyn-Organization/0xmintyn-Main.git .

# Or if using SSH
# git clone git@github.com:0xMintyn-Organization/0xmintyn-Main.git .
```

### Step 5: Checkout Master Branch

```bash
git checkout master
git pull origin master
```

### Step 6: Setup Node.js Environment

```bash
# Load NVM
export NVM_DIR="/root/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"

# Use default Node.js version
nvm use default

# Verify
node --version
npm --version
```

### Step 7: Install Backend Dependencies

```bash
cd /var/www/0xmintyn-Main/Backend
npm install
```

### Step 8: Install Frontend Dependencies

```bash
cd /var/www/0xmintyn-Main/Frontend
npm install
```

### Step 9: Configure Environment Variables

**Backend (.env):**
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
# ... other variables
```

**Frontend (.env.local):**
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

### Step 10: Start PM2 Processes

```bash
cd /var/www/0xmintyn-Main

# Load NVM
export NVM_DIR="/root/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Start using ecosystem.config.js
pm2 start ecosystem.config.js

# Save PM2 state
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Run the command it outputs
```

### Step 11: Verify Services

```bash
# Check PM2 status
pm2 list

# Check logs
pm2 logs

# Monitor resources
pm2 monit
```

### Step 12: Verify Nginx Configuration

```bash
# Test Nginx config
nginx -t

# Reload Nginx
systemctl reload nginx

# Check Nginx status
systemctl status nginx
```

## Troubleshooting

### PM2 Not Found

```bash
# Load NVM
export NVM_DIR="/root/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Install PM2 globally
npm install -g pm2

# Verify
pm2 --version
```

### Services Not Starting

```bash
# Check PM2 logs
pm2 logs backend --lines 50
pm2 logs frontend --lines 50

# Check if environment variables are set
cd Backend && cat .env
cd Frontend && cat .env.local

# Restart services
pm2 restart all
```

### Port Already in Use

```bash
# Find what's using the port
ss -tlnp | grep -E ':(3000|8000)'

# Kill the process if needed
kill -9 <PID>
```

### Git Clone Fails

```bash
# If using HTTPS and need authentication
git config --global credential.helper store

# Or use SSH key
ssh-keygen -t ed25519 -C "your_email@example.com"
cat ~/.ssh/id_ed25519.pub
# Add to GitHub → Settings → SSH Keys
```

## What Gets Removed

The clean reinstall removes:
- ❌ All code files
- ❌ All node_modules
- ❌ All PM2 processes
- ❌ All local git changes
- ❌ All untracked files

**Preserved:**
- ✅ Nginx configuration (in `/etc/nginx/`)
- ✅ SSL certificates (in `/etc/letsencrypt/`)
- ✅ System packages (Node.js, PM2, etc.)
- ✅ Environment files (if you back them up)

## Backup Before Reinstall

If you want to backup your current setup:

```bash
# Backup environment files
mkdir -p ~/backup-$(date +%Y%m%d)
cp /var/www/0xmintyn-Main/Backend/.env ~/backup-$(date +%Y%m%d)/ 2>/dev/null || true
cp /var/www/0xmintyn-Main/Frontend/.env.local ~/backup-$(date +%Y%m%d)/ 2>/dev/null || true

# Backup PM2 config
cp /var/www/0xmintyn-Main/ecosystem.config.js ~/backup-$(date +%Y%m%d)/ 2>/dev/null || true
```

## After Reinstall

1. **Restore environment files** (if backed up):
   ```bash
   cp ~/backup-YYYYMMDD/.env /var/www/0xmintyn-Main/Backend/
   cp ~/backup-YYYYMMDD/.env.local /var/www/0xmintyn-Main/Frontend/
   ```

2. **Restart services**:
   ```bash
   pm2 restart all
   ```

3. **Verify everything works**:
   ```bash
   pm2 list
   curl http://localhost:8000
   curl http://localhost:3000
   ```

## Summary

The automated script (`clean-reinstall-master.sh`) handles everything automatically. Just run it and follow the prompts!

**Time estimate:** 5-10 minutes depending on npm install speed.

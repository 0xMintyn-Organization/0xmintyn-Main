#!/bin/bash

# ============================================================================
# Fix PM2 PATH Issue
# Makes PM2 accessible without full path
# ============================================================================

echo "=========================================="
echo "FIXING PM2 PATH ISSUE"
echo "=========================================="
echo ""

# Check if NVM is installed
if [ ! -d "/root/.nvm" ]; then
    echo "❌ NVM not found at /root/.nvm"
    exit 1
fi

# Option 1: Source NVM in profile (Recommended)
echo "--- Option 1: Adding NVM to Profile ---"
if ! grep -q "NVM_DIR" /root/.bashrc; then
    echo "" >> /root/.bashrc
    echo "# NVM Configuration" >> /root/.bashrc
    echo 'export NVM_DIR="$HOME/.nvm"' >> /root/.bashrc
    echo '[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"' >> /root/.bashrc
    echo '[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"' >> /root/.bashrc
    echo "✅ Added NVM to /root/.bashrc"
else
    echo "⚠️  NVM already in /root/.bashrc"
fi

# Also add to .profile for non-interactive shells
if ! grep -q "NVM_DIR" /root/.profile; then
    echo "" >> /root/.profile
    echo "# NVM Configuration" >> /root/.profile
    echo 'export NVM_DIR="$HOME/.nvm"' >> /root/.profile
    echo '[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"' >> /root/.profile
    echo "✅ Added NVM to /root/.profile"
else
    echo "⚠️  NVM already in /root/.profile"
fi

# Option 2: Create symlinks in /usr/local/bin (Alternative)
echo ""
echo "--- Option 2: Creating Symlinks ---"
read -p "Create symlinks in /usr/local/bin? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    NVM_BIN="/root/.nvm/versions/node/v24.12.0/bin"
    
    # Create symlinks for common commands
    for cmd in node npm pm2 npx; do
        if [ -f "$NVM_BIN/$cmd" ]; then
            ln -sf "$NVM_BIN/$cmd" /usr/local/bin/$cmd
            echo "✅ Created symlink: /usr/local/bin/$cmd"
        fi
    done
fi

# Option 3: Add to system PATH (Alternative)
echo ""
echo "--- Option 3: Adding to System PATH ---"
if ! grep -q "/root/.nvm/versions/node/v24.12.0/bin" /etc/environment; then
    read -p "Add NVM to system PATH in /etc/environment? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        # Backup first
        cp /etc/environment /etc/environment.backup
        # Add to PATH
        sed -i 's|PATH="\(.*\)"|PATH="\1:/root/.nvm/versions/node/v24.12.0/bin"|' /etc/environment || \
        echo 'PATH="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/root/.nvm/versions/node/v24.12.0/bin"' >> /etc/environment
        echo "✅ Added NVM to /etc/environment"
        echo "⚠️  You may need to log out and back in for this to take effect"
    fi
fi

echo ""
echo "=========================================="
echo "FIX COMPLETE"
echo "=========================================="
echo ""
echo "To use PM2 without full path:"
echo ""
echo "Option A: Source NVM in current session (temporary):"
echo "  source /root/.nvm/nvm.sh"
echo "  pm2 list"
echo ""
echo "Option B: Start a new shell session:"
echo "  # NVM will auto-load from .bashrc"
echo "  pm2 list"
echo ""
echo "Option C: Use symlinks (if created):"
echo "  pm2 list  # Works immediately"
echo ""

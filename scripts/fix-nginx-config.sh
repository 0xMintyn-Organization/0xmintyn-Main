#!/bin/bash

# ============================================================================
# Fix Nginx Configuration
# Updates existing default config to add proxy settings for Node.js apps
# ============================================================================

set -e

NGINX_CONFIG="/etc/nginx/sites-available/default"
BACKUP_FILE="/etc/nginx/sites-available/default.backup.$(date +%Y%m%d-%H%M%S)"

echo "=========================================="
echo "FIXING NGINX CONFIGURATION"
echo "=========================================="
echo ""

# Backup existing config
if [ -f "$NGINX_CONFIG" ]; then
    echo "📦 Creating backup: $BACKUP_FILE"
    cp "$NGINX_CONFIG" "$BACKUP_FILE"
    echo "✅ Backup created"
else
    echo "❌ Config file not found: $NGINX_CONFIG"
    exit 1
fi

echo ""
echo "⚠️  This script will update your Nginx configuration."
echo "⚠️  Make sure SSL certificates already exist for both domains."
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 1
fi

# Create new config
echo ""
echo "🔍 Detecting SSL certificates..."

# Check for SSL certificates - use shared cert by default
FRONTEND_CERT="/etc/letsencrypt/live/app.0xmintyn.com/fullchain.pem"
BACKEND_CERT="/etc/letsencrypt/live/appbackend.0xmintyn.com/fullchain.pem"

if [ -f "$BACKEND_CERT" ]; then
    BACKEND_CERT_PATH="/etc/letsencrypt/live/appbackend.0xmintyn.com"
    echo "✅ Found separate backend cert"
else
    BACKEND_CERT_PATH="/etc/letsencrypt/live/app.0xmintyn.com"
    echo "✅ Using shared cert for backend"
fi

if [ -f "$FRONTEND_CERT" ]; then
    FRONTEND_CERT_PATH="/etc/letsencrypt/live/app.0xmintyn.com"
    echo "✅ Found frontend cert"
else
    echo "❌ No SSL certificate found!"
    echo "   Run: certbot --nginx -d app.0xmintyn.com -d appbackend.0xmintyn.com"
    exit 1
fi

echo ""
echo "🔧 Creating new configuration..."

# Create the config file using printf to properly handle variables
cat > "$NGINX_CONFIG" << 'NGINX_EOF'
# Backend API - HTTP (redirects to HTTPS)
server {
    listen 80;
    listen [::]:80;
    server_name appbackend.0xmintyn.com;
    return 301 https://\$host\$request_uri;
}

# Frontend - HTTP (redirects to HTTPS)
server {
    listen 80;
    listen [::]:80;
    server_name app.0xmintyn.com;
    return 301 https://\$host\$request_uri;
}

# Backend API - HTTPS
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name appbackend.0xmintyn.com;

    # SSL configuration (managed by Certbot)
NGINX_EOF

# Insert certificate paths (variables expanded here)
echo "    ssl_certificate $BACKEND_CERT_PATH/fullchain.pem;" >> "$NGINX_CONFIG"
echo "    ssl_certificate_key $BACKEND_CERT_PATH/privkey.pem;" >> "$NGINX_CONFIG"

cat >> "$NGINX_CONFIG" << 'NGINX_EOF'
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # Proxy to Backend (Port 8000)
    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        client_max_body_size 50M;
    }
}

# Frontend - HTTPS
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name app.0xmintyn.com;

    # SSL configuration (managed by Certbot)
NGINX_EOF

# Insert certificate paths (variables expanded here)
echo "    ssl_certificate $FRONTEND_CERT_PATH/fullchain.pem;" >> "$NGINX_CONFIG"
echo "    ssl_certificate_key $FRONTEND_CERT_PATH/privkey.pem;" >> "$NGINX_CONFIG"

cat >> "$NGINX_CONFIG" << 'NGINX_EOF'
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # Proxy to Frontend (Port 3000)
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
NGINX_EOF

echo "✅ Configuration updated"
echo ""

# Test configuration
echo "🧪 Testing Nginx configuration..."
if nginx -t; then
    echo "✅ Configuration test passed"
    echo ""
    echo "🔄 Reloading Nginx..."
    systemctl reload nginx
    echo "✅ Nginx reloaded successfully"
    echo ""
    echo "=========================================="
    echo "CONFIGURATION UPDATED"
    echo "=========================================="
    echo ""
    echo "Your Nginx is now configured to:"
    echo "  ✅ Proxy appbackend.0xmintyn.com → http://127.0.0.1:8000"
    echo "  ✅ Proxy app.0xmintyn.com → http://127.0.0.1:3000"
    echo "  ✅ Redirect HTTP → HTTPS"
    echo ""
    echo "⚠️  If you see SSL certificate errors, run:"
    echo "   certbot --nginx -d app.0xmintyn.com -d appbackend.0xmintyn.com"
    echo ""
    echo "Backup saved at: $BACKUP_FILE"
else
    echo "❌ Configuration test failed!"
    echo ""
    echo "⚠️  Restoring backup..."
    cp "$BACKUP_FILE" "$NGINX_CONFIG"
    echo "✅ Backup restored"
    echo ""
    echo "Please check the error above and fix manually."
    exit 1
fi

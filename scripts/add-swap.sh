#!/bin/bash

# ============================================================================
# Add Swap Space
# Creates swap file to prevent OOM kills
# ============================================================================

echo "=========================================="
echo "ADDING SWAP SPACE"
echo "=========================================="
echo ""

# Check if swap already exists
if swapon --show | grep -q .; then
    echo "Swap already exists:"
    swapon --show
    echo ""
    read -p "Do you want to add additional swap? (y/n) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Exiting..."
        exit 0
    fi
fi

# Check available disk space
AVAILABLE_SPACE=$(df / | tail -1 | awk '{print $4}')
REQUIRED_SPACE=2097152  # 2GB in KB

if [ $AVAILABLE_SPACE -lt $REQUIRED_SPACE ]; then
    echo "⚠️  Warning: Less than 2GB disk space available"
    echo "Available: $(($AVAILABLE_SPACE / 1024))MB"
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Create swap file (2GB)
SWAP_SIZE=${1:-2}  # Default 2GB, can be overridden
SWAP_FILE="/swapfile"

echo "Creating ${SWAP_SIZE}GB swap file at $SWAP_FILE..."
fallocate -l ${SWAP_SIZE}G $SWAP_FILE || dd if=/dev/zero of=$SWAP_FILE bs=1G count=$SWAP_SIZE

# Set correct permissions
chmod 600 $SWAP_FILE

# Format as swap
mkswap $SWAP_FILE

# Enable swap
swapon $SWAP_FILE

# Verify
echo ""
echo "✅ Swap created and enabled:"
swapon --show
free -h

# Make it permanent
if ! grep -q "$SWAP_FILE" /etc/fstab; then
    echo "$SWAP_FILE none swap sw 0 0" >> /etc/fstab
    echo "✅ Added to /etc/fstab for persistence"
else
    echo "⚠️  Swap file already in /etc/fstab"
fi

echo ""
echo "=========================================="
echo "SWAP ADDED SUCCESSFULLY"
echo "=========================================="
echo ""
echo "Note: Swap is slower than RAM but prevents OOM kills"
echo "Consider increasing server RAM for better performance"

#!/bin/bash

# ============================================================================
# Fix Git Pull Issue
# Resolves conflicts with untracked files that would be overwritten
# ============================================================================

echo "=========================================="
echo "FIXING GIT PULL ISSUE"
echo "=========================================="
echo ""

cd /var/www/0xmintyn-Main || exit 1

# Files that are causing conflicts
CONFLICT_FILES=(
    "ecosystem.config.js"
    "scripts/add-swap.sh"
    "scripts/check-profile-issue.sh"
    "scripts/fix-oom-issue.sh"
    "scripts/remove-malicious-code.sh"
    "scripts/security-scan.sh"
)

echo "--- Checking which files exist locally ---"
for file in "${CONFLICT_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "✓ Found: $file"
    else
        echo "✗ Not found: $file"
    fi
done
echo ""

# Option 1: Backup and remove (recommended if files are same)
echo "--- Option 1: Backup and Remove (Recommended) ---"
read -p "Backup and remove local files to allow git pull? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    BACKUP_DIR="backup-$(date +%Y%m%d-%H%M%S)"
    mkdir -p "$BACKUP_DIR"
    
    for file in "${CONFLICT_FILES[@]}"; do
        if [ -f "$file" ]; then
            echo "Backing up $file to $BACKUP_DIR/"
            cp "$file" "$BACKUP_DIR/" 2>/dev/null || mkdir -p "$BACKUP_DIR/$(dirname "$file")" && cp "$file" "$BACKUP_DIR/$file"
            rm -f "$file"
            echo "  ✓ Removed $file"
        fi
    done
    
    echo ""
    echo "✅ Files backed up to $BACKUP_DIR/"
    echo "Now you can run: git pull origin mukhtiar"
fi

echo ""
echo "--- Option 2: Add files to git (if you want to keep local versions) ---"
echo "If you want to keep your local versions and commit them:"
echo "  git add ${CONFLICT_FILES[*]}"
echo "  git commit -m 'Add server configuration files'"
echo "  git pull origin mukhtiar"
echo ""

echo "=========================================="
echo "RECOMMENDATION"
echo "=========================================="
echo ""
echo "Since these files are already in the repository, the safest approach is:"
echo "1. Backup local files (if you made changes)"
echo "2. Remove local files"
echo "3. Pull from repository"
echo ""
echo "Run this script with 'y' to backup and remove, then:"
echo "  git pull origin mukhtiar"
echo ""

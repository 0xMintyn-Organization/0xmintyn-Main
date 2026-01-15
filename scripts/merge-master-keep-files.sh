#!/bin/bash

# ============================================================================
# Merge Master into Mukhtiar - Keep Specific Files
# 
# This script will:
# 1. Backup files we want to keep from mukhtiar
# 2. Replace everything with master branch
# 3. Restore the kept files
# ============================================================================

set -e

CURRENT_BRANCH=$(git branch --show-current)
KEEP_FILES=(".github" "scripts" "ecosystem.config.js")
BACKUP_DIR=".merge-backup-$(date +%Y%m%d-%H%M%S)"

echo "=========================================="
echo "MERGE MASTER INTO MUKHTIAR"
echo "Keep: .github/, scripts/, ecosystem.config.js"
echo "=========================================="
echo ""
echo "Current branch: $CURRENT_BRANCH"
echo ""

# Safety check
if [ "$CURRENT_BRANCH" != "mukhtiar" ]; then
    echo "⚠️  You are not on 'mukhtiar' branch!"
    echo "Current branch: $CURRENT_BRANCH"
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Aborted."
        exit 1
    fi
fi

# Check for uncommitted changes
if ! git diff-index --quiet HEAD --; then
    echo "⚠️  You have uncommitted changes!"
    git status --short
    echo ""
    read -p "Continue? Uncommitted changes will be lost. (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Aborted. Commit or stash your changes first."
        exit 1
    fi
fi

echo ""
echo "Step 1: Creating backup of files to keep..."
mkdir -p "$BACKUP_DIR"

for item in "${KEEP_FILES[@]}"; do
    if [ -e "$item" ]; then
        echo "  Backing up: $item"
        cp -r "$item" "$BACKUP_DIR/"
    else
        echo "  ⚠️  Not found: $item (will skip)"
    fi
done

echo "✅ Backup created: $BACKUP_DIR"
echo ""

echo "Step 2: Fetching latest from origin..."
git fetch origin
echo ""

echo "Step 3: Checking out all files from master..."
git checkout origin/master -- .
echo "✅ Files from master checked out"
echo ""

echo "Step 4: Restoring kept files from mukhtiar..."
for item in "${KEEP_FILES[@]}"; do
    if [ -e "$BACKUP_DIR/$item" ]; then
        echo "  Restoring: $item"
        rm -rf "$item"
        cp -r "$BACKUP_DIR/$item" .
    fi
done
echo "✅ Files restored"
echo ""

echo "Step 5: Cleaning up backup..."
rm -rf "$BACKUP_DIR"
echo "✅ Backup removed"
echo ""

echo "=========================================="
echo "MERGE COMPLETE"
echo "=========================================="
echo ""
echo "Changes made:"
echo "  ✅ All files replaced with master branch"
echo "  ✅ Kept from mukhtiar:"
for item in "${KEEP_FILES[@]}"; do
    echo "     - $item"
done
echo ""
echo "Next steps:"
echo "  1. Review changes: git status"
echo "  2. Review diff: git diff"
echo "  3. Commit the merge: git commit -m 'Merge master: keep mukhtiar configs'"
echo "  4. Push: git push origin mukhtiar"
echo ""

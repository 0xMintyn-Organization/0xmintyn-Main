# ============================================================================
# Merge Master into Mukhtiar - Keep Specific Files (PowerShell)
# 
# This script will:
# 1. Backup files we want to keep from mukhtiar
# 2. Replace everything with master branch
# 3. Restore the kept files
# ============================================================================

$ErrorActionPreference = "Stop"

$CURRENT_BRANCH = git branch --show-current
$KEEP_FILES = @(".github", "scripts", "ecosystem.config.js")
$BACKUP_DIR = ".merge-backup-$(Get-Date -Format 'yyyyMMdd-HHmmss')"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "MERGE MASTER INTO MUKHTIAR" -ForegroundColor Cyan
Write-Host "Keep: .github/, scripts/, ecosystem.config.js" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Current branch: $CURRENT_BRANCH" -ForegroundColor Yellow
Write-Host ""

# Safety check
if ($CURRENT_BRANCH -ne "mukhtiar") {
    Write-Host "⚠️  You are not on 'mukhtiar' branch!" -ForegroundColor Red
    Write-Host "Current branch: $CURRENT_BRANCH" -ForegroundColor Yellow
    $continue = Read-Host "Continue anyway? (y/n)"
    if ($continue -ne "y" -and $continue -ne "Y") {
        Write-Host "Aborted." -ForegroundColor Red
        exit 1
    }
}

# Check for uncommitted changes
$status = git status --porcelain
if ($status) {
    Write-Host "⚠️  You have uncommitted changes!" -ForegroundColor Yellow
    git status --short
    Write-Host ""
    $continue = Read-Host "Continue? Uncommitted changes will be lost. (y/n)"
    if ($continue -ne "y" -and $continue -ne "Y") {
        Write-Host "Aborted. Commit or stash your changes first." -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "Step 1: Creating backup of files to keep..." -ForegroundColor Cyan
New-Item -ItemType Directory -Force -Path $BACKUP_DIR | Out-Null

foreach ($item in $KEEP_FILES) {
    if (Test-Path $item) {
        Write-Host "  Backing up: $item" -ForegroundColor Green
        if (Test-Path $item -PathType Container) {
            Copy-Item -Recurse -Force "$item" "$BACKUP_DIR\" -ErrorAction SilentlyContinue
        } else {
            Copy-Item -Force "$item" "$BACKUP_DIR\" -ErrorAction SilentlyContinue
        }
    } else {
        Write-Host "  ⚠️  Not found: $item (will skip)" -ForegroundColor Yellow
    }
}

Write-Host "✅ Backup created: $BACKUP_DIR" -ForegroundColor Green
Write-Host ""

Write-Host "Step 2: Fetching latest from origin..." -ForegroundColor Cyan
git fetch origin
Write-Host ""

Write-Host "Step 3: Checking out all files from master..." -ForegroundColor Cyan
git checkout origin/master -- .
Write-Host "✅ Files from master checked out" -ForegroundColor Green
Write-Host ""

Write-Host "Step 4: Restoring kept files from mukhtiar..." -ForegroundColor Cyan
foreach ($item in $KEEP_FILES) {
    $backupPath = Join-Path $BACKUP_DIR $item
    if (Test-Path $backupPath) {
        Write-Host "  Restoring: $item" -ForegroundColor Green
        if (Test-Path $item) {
            Remove-Item -Recurse -Force $item -ErrorAction SilentlyContinue
        }
        if (Test-Path $backupPath -PathType Container) {
            Copy-Item -Recurse -Force $backupPath $item -ErrorAction SilentlyContinue
        } else {
            Copy-Item -Force $backupPath $item -ErrorAction SilentlyContinue
        }
    }
}
Write-Host "✅ Files restored" -ForegroundColor Green
Write-Host ""

Write-Host "Step 5: Cleaning up backup..." -ForegroundColor Cyan
Remove-Item -Recurse -Force $BACKUP_DIR -ErrorAction SilentlyContinue
Write-Host "✅ Backup removed" -ForegroundColor Green
Write-Host ""

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "MERGE COMPLETE" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Changes made:" -ForegroundColor Yellow
Write-Host "  ✅ All files replaced with master branch" -ForegroundColor Green
Write-Host "  ✅ Kept from mukhtiar:" -ForegroundColor Green
foreach ($item in $KEEP_FILES) {
    Write-Host "     - $item" -ForegroundColor Green
}
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Review changes: git status" -ForegroundColor White
Write-Host "  2. Review diff: git diff" -ForegroundColor White
Write-Host "  3. Commit the merge: git commit -m 'Merge master: keep mukhtiar configs'" -ForegroundColor White
Write-Host "  4. Push: git push origin mukhtiar" -ForegroundColor White
Write-Host ""

# Merge Master into Mukhtiar - Keep Specific Files

This guide shows you how to replace all files from `master` branch into `mukhtiar` while keeping specific files (`.github/`, `scripts/`, `ecosystem.config.js`) from `mukhtiar`.

## Option 1: Automated Script (Recommended)

### For Windows PowerShell:

```powershell
# Navigate to project directory
cd "F:\PROJECTS\REMOTE\0xMintyn\from github\0xmintyn-Main"

# Make sure you're on mukhtiar branch
git checkout mukhtiar

# Run the PowerShell script
.\scripts\merge-master-keep-files.ps1
```

### For Linux/Mac/Git Bash:

```bash
cd /path/to/0xmintyn-Main

# Make sure you're on mukhtiar branch
git checkout mukhtiar

# Make script executable
chmod +x scripts/merge-master-keep-files.sh

# Run the script
./scripts/merge-master-keep-files.sh
```

The script will:
1. ✅ Backup files you want to keep
2. ✅ Replace everything with `master` branch
3. ✅ Restore the backed-up files
4. ✅ Show you what to do next

## Option 2: Manual Git Commands

### PowerShell Version (Windows):

```powershell
# Step 1: Switch to mukhtiar branch
git checkout mukhtiar

# Step 2: Backup files you want to keep
New-Item -ItemType Directory -Force -Path .temp-backup | Out-Null
Copy-Item -Recurse -Force .github .temp-backup\ -ErrorAction SilentlyContinue
Copy-Item -Recurse -Force scripts .temp-backup\ -ErrorAction SilentlyContinue
Copy-Item -Force ecosystem.config.js .temp-backup\ -ErrorAction SilentlyContinue

# Step 3: Fetch latest from origin
git fetch origin

# Step 4: Replace everything with master
git checkout origin/master -- .

# Step 5: Remove master's versions of kept files
Remove-Item -Recurse -Force .github -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force scripts -ErrorAction SilentlyContinue
Remove-Item -Force ecosystem.config.js -ErrorAction SilentlyContinue

# Step 6: Restore kept files from mukhtiar
Copy-Item -Recurse -Force .temp-backup\.github .
Copy-Item -Recurse -Force .temp-backup\scripts .
Copy-Item -Force .temp-backup\ecosystem.config.js .

# Step 7: Clean up backup
Remove-Item -Recurse -Force .temp-backup

# Step 8: Review and commit
git status
git diff
git add .
git commit -m "Merge master: keep mukhtiar configs (.github, scripts, ecosystem.config.js)"
git push origin mukhtiar
```

### Bash/Linux/Mac Version:

```bash
# Step 1: Make sure you're on mukhtiar branch
git checkout mukhtiar

# Step 2: Backup files you want to keep
mkdir -p .temp-backup
cp -r .github .temp-backup/
cp -r scripts .temp-backup/
cp ecosystem.config.js .temp-backup/ 2>/dev/null || true

# Step 3: Fetch latest from origin
git fetch origin

# Step 4: Replace everything with master
git checkout origin/master -- .

# Step 5: Remove master's versions of kept files
rm -rf .github scripts ecosystem.config.js

# Step 6: Restore kept files from mukhtiar
cp -r .temp-backup/.github .
cp -r .temp-backup/scripts .
cp .temp-backup/ecosystem.config.js . 2>/dev/null || true

# Step 7: Clean up backup
rm -rf .temp-backup

# Step 8: Review and commit
git status
git diff
git add .
git commit -m "Merge master: keep mukhtiar configs (.github, scripts, ecosystem.config.js)"
git push origin mukhtiar
```

## Option 3: Using Git Checkout Selectively

```bash
# Checkout mukhtiar
git checkout mukhtiar

# Fetch latest
git fetch origin

# Backup files to keep
mkdir -p .keep-backup
cp -r .github .keep-backup/
cp -r scripts .keep-backup/
cp ecosystem.config.js .keep-backup/ 2>/dev/null || true

# Remove everything
git rm -rf --ignore-unmatch .

# Checkout everything from master
git checkout origin/master -- .

# Remove the kept files from master
rm -rf .github scripts ecosystem.config.js

# Restore from mukhtiar backup
cp -r .keep-backup/.github .
cp -r .keep-backup/scripts .
cp .keep-backup/ecosystem.config.js . 2>/dev/null || true

# Clean up
rm -rf .keep-backup

# Review and commit
git status
git add .
git commit -m "Merge master: keep mukhtiar configs"
git push origin mukhtiar
```

## What Gets Kept vs Replaced

### Kept from mukhtiar:
- ✅ `.github/` directory (workflows, deployment configs)
- ✅ `scripts/` directory (all setup scripts)
- ✅ `ecosystem.config.js` (PM2 config)

### Replaced with master:
- 🔄 All other files and directories
- 🔄 Backend code
- 🔄 Frontend code
- 🔄 Package files
- 🔄 Documentation
- 🔄 Everything else

## Important Notes

⚠️ **Before running:**
- Make sure you're on `mukhtiar` branch
- Commit or stash any uncommitted changes
- Have a backup (just in case)

⚠️ **After merging:**
- Review all changes with `git status` and `git diff`
- Test your application before pushing
- The commit will create a merge commit

⚠️ **If something goes wrong:**
```bash
# Reset to before merge
git reset --hard HEAD@{1}

# Or reset to origin
git reset --hard origin/mukhtiar
```

## Verification

After merging, verify the kept files are correct:

```bash
# Check .github exists and has workflows
ls -la .github/workflows/

# Check scripts directory
ls -la scripts/

# Check ecosystem.config.js
cat ecosystem.config.js | head -20
```

## Troubleshooting

### Issue: "fatal: pathspec did not match any files"
This means master doesn't have that file. It's okay, just continue.

### Issue: Merge conflicts
If you get conflicts, resolve them:
```bash
# See conflicts
git status

# Accept their version (master) for conflicted files
git checkout --theirs <file>

# Or keep ours (mukhtiar)
git checkout --ours <file>
```

### Issue: Want to keep more files
Edit the script and add to `KEEP_FILES` array, or add more `cp` commands in manual steps.

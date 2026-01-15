# Smart Deployment Workflow Guide

## Overview
The new deployment workflow is **intelligent, fast, and nuclear-proof**. It automatically detects what changed and only performs necessary actions.

## Key Features

### 🧠 Intelligent Change Detection
- **Auto-detects** which services changed (Backend, Frontend, or both)
- **Only installs** dependencies if `package.json` or `package-lock.json` changed
- **Only restarts** affected services
- **Skips** unchanged services entirely

### ⚡ Fast & Efficient
- **No unnecessary builds** - Uses `npm run dev` (ts-node-dev for backend, Next.js dev for frontend)
- **No redundant installs** - Only installs when dependencies change
- **Parallel-ready** - Can be extended for parallel deployments
- **10-minute timeout** - Fails fast if something goes wrong

### 🛡️ Nuclear-Proof Reliability
- **Health checks** - Verifies services are online after deployment
- **Error handling** - Graceful failures with detailed logs
- **PM2 integration** - Uses `ecosystem.config.js` properly
- **Edge case handling** - Handles first commits, missing commits, etc.

## How It Works

### Change Detection Logic

```yaml
Backend changes detected if:
  - Any file in Backend/ changed
  - ecosystem.config.js changed
  - Scripts in scripts/ changed

Frontend changes detected if:
  - Any file in Frontend/ changed
  - ecosystem.config.js changed
  - Scripts in scripts/ changed

Dependencies install if:
  - Backend/package.json or package-lock.json changed
  - Frontend/package.json or package-lock.json changed
```

### Deployment Flow

1. **Detect Changes** - Compares current commit with previous
2. **Pull Code** - Updates repository on server
3. **Install Dependencies** - Only if package files changed
4. **Restart Services** - Only affected services via PM2
5. **Verify Health** - Confirms services are online
6. **Report Status** - Shows deployment summary

## What Gets Deployed

### Backend Changes
- Code changes in `Backend/` → Restart backend
- `package.json` changes → Install + Restart
- `ecosystem.config.js` changes → Reload PM2 config

### Frontend Changes
- Code changes in `Frontend/` → Restart frontend
- `package.json` changes → Install + Restart
- `ecosystem.config.js` changes → Reload PM2 config

### Root Changes
- `ecosystem.config.js` → Reloads both services
- `scripts/` changes → Restarts both services (safety)

## No Build Step

Since you're using:
- **Backend**: `ts-node-dev` (transpiles on-the-fly)
- **Frontend**: `next dev` (development mode)

The workflow **doesn't build** anything. It just:
1. Pulls code
2. Installs dependencies (if needed)
3. Restarts PM2 processes

This makes deployments **much faster**.

## When Server Reboots

The workflow **never reboots the server**. It only:
- Restarts PM2 processes
- Reloads PM2 config if `ecosystem.config.js` changed

Server reboots should be done manually only when:
- System updates require it
- Memory issues persist
- Security patches need kernel updates

## Manual Deployment

You can trigger manual deployment:
1. Go to GitHub → Actions → Smart Deploy
2. Click "Run workflow"
3. Select branch (mukhtiar, master, or dev)
4. Click "Run workflow"

Manual triggers deploy **everything** (safety measure).

## Monitoring

After deployment, check:
```bash
# On server
pm2 list
pm2 logs backend --lines 20
pm2 logs frontend --lines 20

# Or via GitHub Actions
# Check the workflow run logs
```

## Troubleshooting

### Services Not Starting
- Check PM2 logs: `pm2 logs backend --lines 50`
- Verify ecosystem.config.js syntax
- Check Node.js version matches
- Verify npm dependencies installed

### Deployment Fails
- Check GitHub Actions logs
- Verify SSH key is correct
- Check server has enough disk space
- Verify PM2 is accessible

### Changes Not Applied
- Check if files are actually in the commit
- Verify branch name matches
- Check git pull succeeded
- Verify PM2 restarted (check uptime)

## Security

- Uses SSH keys (no passwords)
- Only deploys on push to protected branches
- No manual server access needed
- All actions logged in GitHub

## Performance

**Typical deployment times:**
- Code-only change: ~30 seconds
- With dependency install: ~2-3 minutes
- Full deployment (both services): ~3-4 minutes

**Old workflow:** ~10-15 minutes (with unnecessary builds)
**New workflow:** ~30 seconds - 4 minutes (depending on changes)

## Best Practices

1. **Commit often** - Smaller changes = faster deployments
2. **Separate commits** - Backend and Frontend changes separately = only one restarts
3. **Test locally** - Catch issues before pushing
4. **Monitor logs** - Check PM2 logs after deployment
5. **Use branches** - Deploy to dev branch first, then master

## Configuration

Required GitHub Secrets:
- `SSH_HOST`: Your VPS IP (209.74.89.249)
- `SSH_USER`: SSH username (root)
- `SSH_PRIVATE_KEY`: Private SSH key for deployment
- `SSH_PORT`: SSH port (22, or your custom port)

## Example Scenarios

### Scenario 1: Backend Code Change
```
Changed: Backend/routes/user.route.ts
Result: 
  ✅ Pull code
  ⏭️  Skip install (package.json unchanged)
  🔄 Restart backend only
  ⏭️  Skip frontend (unchanged)
Time: ~30 seconds
```

### Scenario 2: Frontend Dependency Update
```
Changed: Frontend/package.json
Result:
  ✅ Pull code
  📥 Install frontend dependencies
  🔄 Restart frontend only
  ⏭️  Skip backend (unchanged)
Time: ~2-3 minutes
```

### Scenario 3: Both Changed
```
Changed: Backend/app.ts, Frontend/components/Header.tsx
Result:
  ✅ Pull code
  ⏭️  Skip installs (no package.json changes)
  🔄 Restart both services
Time: ~1 minute
```

### Scenario 4: ecosystem.config.js Changed
```
Changed: ecosystem.config.js
Result:
  ✅ Pull code
  ⏭️  Skip installs
  ⚙️  Reload PM2 config (restarts both)
Time: ~1 minute
```

## Summary

This workflow is:
- ✅ **Smart** - Only does what's needed
- ✅ **Fast** - 30 seconds to 4 minutes
- ✅ **Reliable** - Health checks and error handling
- ✅ **Secure** - No manual SSH needed
- ✅ **Efficient** - No unnecessary builds or installs

/**
 * PM2 Ecosystem Configuration
 * 
 * This config automatically detects Node.js and npm paths, making it work
 * with any Node.js installation (NVM, system-wide, etc.)
 * 
 * Detection order:
 * 1. NVM default/current version
 * 2. Latest installed version in NVM
 * 3. Common system paths
 * 4. Falls back to 'node'/'npm' (rely on PATH)
 */

const fs = require('fs');
const path = require('path');

// Helper function to find Node.js path
function findNodePath() {
  // 1. Check NVM environment variable
  const nvmDir = process.env.NVM_DIR || path.join(process.env.HOME || '/root', '.nvm');
  
  // 2. Try to find default/current version in NVM
  const nvmNodePath = path.join(nvmDir, 'versions/node');
  
  if (fs.existsSync(nvmNodePath)) {
    try {
      // Find the latest installed version
      const versions = fs.readdirSync(nvmNodePath)
        .filter(v => v.startsWith('v'))
        .sort((a, b) => {
          // Simple version comparison
          const aNum = parseInt(a.replace('v', '').split('.')[0]);
          const bNum = parseInt(b.replace('v', '').split('.')[0]);
          return bNum - aNum;
        });
      
      if (versions.length > 0) {
        const latestVersion = versions[0];
        const nodePath = path.join(nvmNodePath, latestVersion, 'bin/node');
        if (fs.existsSync(nodePath)) {
          return nodePath;
        }
      }
      
      // Try default alias
      const defaultPath = path.join(nvmDir, 'alias/default');
      if (fs.existsSync(defaultPath)) {
        const version = fs.readFileSync(defaultPath, 'utf8').trim();
        const nodePath = path.join(nvmNodePath, version, 'bin/node');
        if (fs.existsSync(nodePath)) {
          return nodePath;
        }
      }
    } catch (e) {
      // Continue to fallbacks
    }
  }
  
  // 3. Check common system paths
  const commonPaths = [
    '/usr/local/bin/node',
    '/usr/bin/node',
    '/opt/node/bin/node'
  ];
  
  for (const commonPath of commonPaths) {
    if (fs.existsSync(commonPath)) {
      return commonPath;
    }
  }
  
  // 4. Fallback: use 'node' (rely on PATH)
  return 'node';
}

// Helper function to find npm path
function findNpmPath() {
  // Try to derive from node path
  const nodePath = findNodePath();
  
  if (nodePath !== 'node' && nodePath.includes('/bin/node')) {
    const npmPath = nodePath.replace('/bin/node', '/bin/npm');
    if (fs.existsSync(npmPath)) {
      return npmPath;
    }
  }
  
  // Check common system paths
  const commonPaths = [
    '/usr/local/bin/npm',
    '/usr/bin/npm',
    '/opt/node/bin/npm'
  ];
  
  for (const commonPath of commonPaths) {
    if (fs.existsSync(commonPath)) {
      return commonPath;
    }
  }
  
  // Fallback: use 'npm' (rely on PATH)
  return 'npm';
}

// Get paths
const nodePath = findNodePath();
const npmPath = findNpmPath();
const nodeDir = nodePath !== 'node' ? path.dirname(nodePath) : null;

// Build PATH environment variable
const systemPath = '/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin';
const pathEnv = nodeDir ? `${nodeDir}:${systemPath}` : systemPath;

// Log detected paths (for debugging)
if (process.env.PM2_DISPLAY_ENV !== 'false') {
  console.log(`[PM2 Config] Node.js: ${nodePath}`);
  console.log(`[PM2 Config] npm: ${npmPath}`);
  console.log(`[PM2 Config] PATH: ${pathEnv}`);
}

module.exports = {
  apps: [
    {
      name: 'backend',
      script: npmPath,
      args: 'run dev',
      cwd: '/var/www/0xmintyn-Main/Backend',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      interpreter: nodePath,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'development',
        PORT: 8000,
        PATH: pathEnv
      },
      error_file: '/var/www/0xmintyn-Main/logs/backend-error.log',
      out_file: '/var/www/0xmintyn-Main/logs/backend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      restart_delay: 4000
    },
    {
      name: 'frontend',
      script: npmPath,
      args: 'run dev',
      cwd: '/var/www/0xmintyn-Main/Frontend',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      interpreter: nodePath,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'development',
        PORT: 3000,
        PATH: pathEnv
      },
      error_file: '/var/www/0xmintyn-Main/logs/frontend-error.log',
      out_file: '/var/www/0xmintyn-Main/logs/frontend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      restart_delay: 4000
    }
  ]
};

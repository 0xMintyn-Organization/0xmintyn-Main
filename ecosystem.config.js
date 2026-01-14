module.exports = {
  apps: [
    {
      name: 'backend',
      script: 'npm',
      args: 'run dev',
      cwd: '/var/www/0xmintyn-Main/Backend',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      interpreter: '/root/.nvm/versions/node/v24.12.0/bin/node',
      max_memory_restart: '500M', // Restart if memory exceeds 500MB
      env: {
        NODE_ENV: 'development',
        PORT: 8000,
        PATH: '/root/.nvm/versions/node/v24.12.0/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin'
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
      script: 'npm',
      args: 'run dev',
      cwd: '/var/www/0xmintyn-Main/Frontend',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      interpreter: '/root/.nvm/versions/node/v24.12.0/bin/node',
      max_memory_restart: '500M', // Restart if memory exceeds 500MB
      env: {
        NODE_ENV: 'development',
        PORT: 3000,
        PATH: '/root/.nvm/versions/node/v24.12.0/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin'
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

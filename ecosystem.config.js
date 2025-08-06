module.exports = {
  apps: [
    {
      name: 'crm-system',
      script: 'npm',
      args: 'start',
      cwd: '/root/crm1',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: '/root/crm1/logs/pm2-error.log',
      out_file: '/root/crm1/logs/pm2-out.log',
      log_file: '/root/crm1/logs/pm2-combined.log',
      time: true,
      // 重启策略
      min_uptime: '10s',
      max_restarts: 10,
      restart_delay: 4000,
      // 健康检查
      health_check_grace_period: 10000,
      // 优雅关闭
      kill_timeout: 5000
    }
  ]
}; 
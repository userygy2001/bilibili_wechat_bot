module.exports = {
  apps: [
    {
      name: 'bilibili-wechat-bot',
      script: 'dist/index.js',
      instances: 1,
      exec_mode: 'fork',
      
      // 重启配置
      autorestart: true,
      watch: false,
      max_memory_restart: '200M',
      
      // 日志配置
      log_file: './logs/combined.log',
      out_file: './logs/out.log',
      error_file: './logs/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      
      // 环境变量
      env: {
        NODE_ENV: 'production',
        TZ: 'Asia/Shanghai'
      },
      
      // 开发环境配置
      env_development: {
        NODE_ENV: 'development',
        TZ: 'Asia/Shanghai'
      },
      
      // 崩溃重启配置
      min_uptime: '10s',
      max_restarts: 10,
      restart_delay: 4000,
      
      // cron重启 (可选，每天凌晨2点重启)
      // cron_restart: '0 2 * * *',
      
      // 忽略监听文件变化
      ignore_watch: [
        'node_modules',
        'logs',
        '.git'
      ]
    }
  ]
};
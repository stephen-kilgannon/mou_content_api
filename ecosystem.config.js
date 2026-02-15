module.exports = {
  apps: [
    {
      name: "mou-service-content-api",
      script: "dist/index.js",
      cwd: "/var/www/mou-service-content-api/current",
      instances: 1,
      exec_mode: "fork",

      // Memory management for 2GB server
      node_args: "--max-old-space-size=256",
      max_memory_restart: "300M",

      // Environment
      env: {
        NODE_ENV: "production",
        PORT: 5000,
      },

      // Logging
      error_file: "/var/log/pm2/mou-service-content-api-error.log",
      out_file: "/var/log/pm2/mou-service-content-api-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true,

      // Reliability
      autorestart: true,
      watch: false,
      max_restarts: 10,
      min_uptime: "10s",
      restart_delay: 4000,

      // Graceful shutdown
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,
    },
  ],
};

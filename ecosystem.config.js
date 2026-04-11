module.exports = {
  apps: [
    {
      name: "tempgenpro-server",
      script: "./server/dist/index.js",
      instances: 1,          // Single instance (Socket.io requires sticky sessions for multi-instance)
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        PORT: 5002,
        // ⚡ V8 heap tuning: allocate sufficient memory
        NODE_OPTIONS: "--max-old-space-size=512",
      },
      watch: false,
      // ⚡ Restart policy: prevent crash loops from consuming all resources
      max_memory_restart: "512M",
      max_restarts: 10,
      min_uptime: "10s",
      restart_delay: 3000,    // 3s between restarts
      // ⚡ Log configuration
      error_file: "./logs/err.log",
      out_file: "./logs/out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true,
    }
  ]
};

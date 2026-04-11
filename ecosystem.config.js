module.exports = {
  apps: [
    {
      name: "tempgenpro-server",
      script: "./server/dist/index.js",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        PORT: 5002
      },
      watch: false,
      max_memory_restart: "1G",
      error_file: "./logs/err.log",
      out_file: "./logs/out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss"
    }
  ]
};

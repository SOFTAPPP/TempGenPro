module.exports = {
  apps: [
    {
      name: "tgp-backend",
      script: "./venv/bin/python",
      args: "-m uvicorn main:app --host 0.0.0.0 --port 5002",
      cwd: "./server",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
      },
      watch: false,
      max_memory_restart: "1G",
      max_restarts: 10,
      min_uptime: "10s",
      restart_delay: 3000,
      error_file: "./logs/err.log",
      out_file: "./logs/out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true,
    },
    {
      name: "tgp-ai",
      script: "./venv/bin/python",
      args: "main.py",
      cwd: "./ai_service",
      instances: 1,
      exec_mode: "fork",
      env: {
        PORT: 5005,
      },
      watch: false,
      error_file: "./logs/ai-err.log",
      out_file: "./logs/ai-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
    },
    {
      name: "tgp-frontend",
      script: "npm",
      args: "run preview -- --host 0.0.0.0 --port 8082",
      cwd: "./client",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
      },
      watch: false,
      error_file: "./logs/frontend-err.log",
      out_file: "./logs/frontend-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
    }
  ]
};

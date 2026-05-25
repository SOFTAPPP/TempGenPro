import subprocess
import os
import sys
import time

def run_service(name, cmd, cwd):
    print(f"[{name}] Starting: {cmd} in {cwd}")
    
    # Use shell=True for windows to handle npm correctly
    process = subprocess.Popen(
        cmd, 
        cwd=cwd, 
        shell=True,
        stdout=sys.stdout, 
        stderr=sys.stderr
    )
    return process

if __name__ == "__main__":
    project_root = os.path.dirname(os.path.abspath(__file__))
    
    client_dir = os.path.join(project_root, "client")
    server_dir = os.path.join(project_root, "server")
    ai_service_dir = os.path.join(project_root, "ai_service")

    # Extract port from server/.env if it exists
    server_port = "5000"
    env_path = os.path.join(server_dir, ".env")
    if os.path.exists(env_path):
        with open(env_path, "r") as f:
            for line in f:
                if line.strip().startswith("PORT="):
                    server_port = line.strip().split("=")[1].strip()
                    break

    # Determine executable paths
    # Using relative pathing for venv on Windows
    server_cmd = f".\\venv\\Scripts\\python -m uvicorn main:app --host 0.0.0.0 --port {server_port}"
    ai_service_cmd = ".\\venv\\Scripts\\python main.py"
    client_cmd = "npm run dev"

    processes = []
    
    try:
        # Start AI Service
        p_ai = run_service("AI Service", ai_service_cmd, ai_service_dir)
        processes.append(p_ai)
        
        # Start Backend
        p_server = run_service("Backend", server_cmd, server_dir)
        processes.append(p_server)
        
        # Start Frontend
        p_client = run_service("Frontend", client_cmd, client_dir)
        processes.append(p_client)

        print("\nAll services started! Press Ctrl+C to stop all.\n")
        
        # Keep main thread alive
        while True:
            time.sleep(1)
            
    except KeyboardInterrupt:
        print("\nStopping all services...")
        for p in processes:
            p.terminate()
        
        # Wait a moment for graceful shutdown
        time.sleep(1)
        print("All services stopped. Goodbye!")
        sys.exit(0)

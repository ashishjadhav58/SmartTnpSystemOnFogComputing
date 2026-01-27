"""
Unified AI Services Launcher
Starts all AI microservices (Resume AI, Placement Prediction, Skill Match) concurrently
"""

import subprocess
import sys
import os
import time
import signal
from pathlib import Path

# Service configurations
# Unified service (all on one port 8000) - RECOMMENDED
# This starts all three services and makes them accessible on port 8000 via route prefixes
SERVICES = [
    {
        "name": "Unified AI Services",
        "path": "unified-service/main.py",
        "port": 8000,
        "description": "All AI services on single port 8000 (Resume AI, Placement Prediction, Skill Match)"
    }
]

# Store process references
processes = []


def check_port_available(port):
    """Check if a port is available"""
    import socket
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    result = sock.connect_ex(('localhost', port))
    sock.close()
    return result != 0


def start_service(service_config):
    """Start a single AI service"""
    service_name = service_config["name"]
    service_path = service_config["path"]
    port = service_config["port"]
    
    # Get the directory of this main.py file
    base_dir = Path(__file__).parent.absolute()
    service_full_path = base_dir / service_path
    
    if not service_full_path.exists():
        print(f"[ERROR] Service file not found: {service_full_path}")
        return None
    
    # Check if port is available
    if not check_port_available(port):
        print(f"[WARN] Port {port} is already in use. Service {service_name} may already be running.")
    
    print(f"[INFO] Starting {service_name} on port {port}...")
    print(f"       {service_config['description']}")
    
    try:
        # Change to service directory for proper imports
        service_dir = service_full_path.parent
        
        # Start the service as a subprocess
        # Use unbuffered output for real-time logs
        process = subprocess.Popen(
            [sys.executable, "-u", str(service_full_path)],
            cwd=str(service_dir),
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,  # Combine stderr with stdout
            text=True,
            bufsize=1,
            universal_newlines=True
        )
        
        # Wait a moment to check if it started successfully
        time.sleep(3)
        
        if process.poll() is None:  # Process is still running
            print(f"[OK] {service_name} started successfully (PID: {process.pid})")
            return process
        else:
            # Process exited immediately - there was an error
            try:
                stdout, _ = process.communicate(timeout=1)
                if stdout:
                    # Print last few lines of output
                    lines = stdout.strip().split('\n')
                    error_lines = lines[-5:] if len(lines) > 5 else lines
                    print(f"[ERROR] {service_name} failed to start:")
                    for line in error_lines:
                        print(f"       {line}")
            except:
                print(f"[ERROR] {service_name} failed to start (process exited immediately)")
            return None
            
    except Exception as e:
        print(f"[ERROR] Failed to start {service_name}: {e}")
        import traceback
        traceback.print_exc()
        return None


def stop_all_services():
    """Stop all running services"""
    print("\n[INFO] Stopping all AI services...")
    for process in processes:
        if process and process.poll() is None:
            try:
                process.terminate()
                process.wait(timeout=5)
                print(f"[OK] Service stopped (PID: {process.pid})")
            except subprocess.TimeoutExpired:
                process.kill()
                print(f"[WARN] Service force killed (PID: {process.pid})")
            except Exception as e:
                print(f"[ERROR] Error stopping service: {e}")
    processes.clear()
    print("[OK] All services stopped.")


def signal_handler(sig, frame):
    """Handle Ctrl+C gracefully"""
    print("\n[INFO] Received interrupt signal...")
    stop_all_services()
    sys.exit(0)


def check_services_health():
    """Check if all services are responding"""
    try:
        import requests
        import time
        
        print("\n[INFO] Waiting for services to initialize (10 seconds)...")
        time.sleep(10)  # Wait longer for services to fully initialize
        
        print("[INFO] Checking service health...")
        all_healthy = True
        for service in SERVICES:
            port = service["port"]
            try:
                response = requests.get(f"http://localhost:{port}/health", timeout=5)
                if response.status_code == 200:
                    health_data = response.json()
                    status = health_data.get('status', 'unknown')
                    print(f"[OK] {service['name']} is {status}")
                    if 'services' in health_data:
                        # Unified service - show internal service status
                        for svc_name, svc_status in health_data.get('services', {}).items():
                            if 'healthy' in str(svc_status):
                                print(f"       - {svc_name}: {svc_status}")
                            else:
                                print(f"       - {svc_name}: {svc_status} (may still be starting)")
                else:
                    print(f"[WARN] {service['name']} returned status {response.status_code}")
                    all_healthy = False
            except requests.exceptions.Timeout:
                print(f"[WARN] {service['name']} health check timed out (service may still be starting)")
                print(f"       This is normal - services can take 10-15 seconds to fully initialize")
            except requests.exceptions.ConnectionError:
                print(f"[WARN] {service['name']} connection refused (service may still be starting)")
                print(f"       Wait a few more seconds and check http://localhost:{port}/health manually")
            except requests.exceptions.RequestException as e:
                print(f"[WARN] {service['name']} health check failed: {str(e)[:100]}")
                all_healthy = False
        
        return all_healthy
    except ImportError:
        print("[INFO] 'requests' library not available. Skipping health check.")
        return True


def main():
    """Main function to start all services"""
    print("=" * 60)
    print("AI Services Unified Launcher")
    print("=" * 60)
    print("\nStarting all AI microservices...\n")
    
    # Register signal handler for graceful shutdown
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    # Start all services
    for service_config in SERVICES:
        process = start_service(service_config)
        if process:
            processes.append(process)
        else:
            print(f"[WARN] Continuing without {service_config['name']}...")
        time.sleep(1)  # Small delay between service starts
    
    if not processes:
        print("\n[ERROR] No services started successfully. Exiting.")
        sys.exit(1)
    
    print(f"\n[OK] Started {len(processes)} out of {len(SERVICES)} services")
    print("\n" + "=" * 60)
    print("Services are running. Press Ctrl+C to stop all services.")
    print("=" * 60)
    print("\nService URLs:")
    for service in SERVICES:
        print(f"  - {service['name']}: http://localhost:{service['port']}")
    print("\nHealth Check Endpoints:")
    for service in SERVICES:
        print(f"  - {service['name']}: http://localhost:{service['port']}/health")
    print()
    
    # Optional: Check service health (requires requests library)
    try:
        import requests
        check_services_health()
    except ImportError:
        print("[INFO] 'requests' library not available. Skipping health check.")
        print("       Install with: pip install requests")
    except Exception as e:
        print(f"[WARN] Health check failed: {e}")
    
    # Monitor processes and restart if they crash
    try:
        while True:
            time.sleep(5)
            for i, process in enumerate(processes):
                if process and process.poll() is not None:
                    # Process has died
                    service_config = SERVICES[i]
                    print(f"\n[WARN] {service_config['name']} crashed. Restarting...")
                    new_process = start_service(service_config)
                    if new_process:
                        processes[i] = new_process
                    else:
                        print(f"[ERROR] Failed to restart {service_config['name']}")
    except KeyboardInterrupt:
        pass
    finally:
        stop_all_services()


if __name__ == "__main__":
    main()

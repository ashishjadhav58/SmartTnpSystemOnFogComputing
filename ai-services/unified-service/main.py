"""
Unified AI Services - FastAPI
All AI services accessible on single port 8000 via route prefixes:
- /resume/* - Resume AI Service
- /predict/* - Placement Prediction Service  
- /match/* - Skill Match Service

This service starts the individual services as subprocesses and proxies requests to them.
Externally, everything appears on port 8000.
"""

import sys
import os
from pathlib import Path
import subprocess
import time
import signal
import atexit

# Add service directories to path
base_dir = Path(__file__).parent.parent.absolute()
resume_dir = base_dir / "resume-ai-service"
placement_dir = base_dir / "placement-prediction-service"
skill_dir = base_dir / "skill-match-service"

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import httpx

# Create unified FastAPI app
app = FastAPI(
    title="Unified AI Services",
    version="1.0.0",
    description="All AI services on single port 8000"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Internal service URLs (services run on these ports internally, but proxied through 8000)
INTERNAL_SERVICES = {
    "resume": "http://localhost:8001",
    "placement": "http://localhost:8002",
    "skill": "http://localhost:8003"
}

# Store subprocess references
processes = []

def check_service_ready(url, timeout=5):
    """Check if a service is ready by hitting its health endpoint"""
    import socket
    try:
        # Parse URL to get host and port
        from urllib.parse import urlparse
        parsed = urlparse(url)
        host = parsed.hostname or "localhost"
        port = parsed.port or 80
        
        # Check if port is open
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(timeout)
        result = sock.connect_ex((host, port))
        sock.close()
        return result == 0
    except Exception as e:
        return False

def check_service_health(url, timeout=3):
    """Check if a service health endpoint responds"""
    try:
        import urllib.request
        req = urllib.request.Request(url, method="GET")
        with urllib.request.urlopen(req, timeout=timeout) as response:
            return response.status == 200
    except:
        return False

def start_internal_service(name, port, script_path):
    """Start an internal service on a specific port"""
    try:
        # Check if port is already in use
        if not check_service_ready(f"http://localhost:{port}", timeout=1):
            process = subprocess.Popen(
                [sys.executable, "-u", str(script_path)],
                cwd=str(script_path.parent),
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                text=True,
                bufsize=1
            )
            processes.append((name, process, port))
            
            # Wait a bit and check if process is still running
            time.sleep(1)
            if process.poll() is None:
                # Process is running, wait for service to be ready
                max_wait = 10
                waited = 0
                while waited < max_wait:
                    if check_service_ready(f"http://localhost:{port}", timeout=1):
                        print(f"[OK] {name} started and ready on port {port} (PID: {process.pid})")
                        return process
                    time.sleep(1)
                    waited += 1
                
                # Service started but not ready yet
                print(f"[WARN] {name} started on port {port} but not ready yet (PID: {process.pid})")
                return process
            else:
                # Process exited immediately
                stdout, _ = process.communicate(timeout=1)
                error_msg = stdout[-200:] if stdout else "Unknown error"
                print(f"[ERROR] {name} failed to start. Error: {error_msg}")
                return None
        else:
            print(f"[WARN] Port {port} already in use. {name} may already be running.")
            return None
    except Exception as e:
        print(f"[ERROR] Failed to start {name}: {e}")
        import traceback
        traceback.print_exc()
        return None

def cleanup_processes():
    """Cleanup all subprocesses on shutdown"""
    print("\n[INFO] Stopping internal services...")
    for name, process, port in processes:
        if process and process.poll() is None:
            try:
                process.terminate()
                process.wait(timeout=5)
                print(f"[OK] Stopped {name}")
            except subprocess.TimeoutExpired:
                process.kill()
                print(f"[WARN] Force killed {name}")
            except Exception as e:
                print(f"[ERROR] Error stopping {name}: {e}")

# Register cleanup
atexit.register(cleanup_processes)

# Start all internal services
print("[INFO] Starting internal AI services...")
resume_process = start_internal_service("Resume AI", 8001, resume_dir / "main.py")
time.sleep(2)
placement_process = start_internal_service("Placement Prediction", 8002, placement_dir / "main.py")
time.sleep(2)
skill_process = start_internal_service("Skill Match", 8003, skill_dir / "main.py")
time.sleep(3)  # Wait for services to initialize

# Verify services are running (non-blocking - services can start in background)
print("\n[INFO] Services are starting in background...")
print("[INFO] They will be ready in 5-10 seconds.")
print("[INFO] The unified service is ready to accept requests.\n")

# ============================================================================
# PROXY ROUTES - Forward requests to internal services
# ============================================================================

@app.api_route("/resume/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH"])
async def proxy_resume(path: str, request: Request):
    """Proxy requests to Resume AI Service"""
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            # Map unified routes to internal service routes
            # External: /resume/score -> Internal: /resume/score
            url = f"{INTERNAL_SERVICES['resume']}/resume/{path}"
            body = await request.body()
            headers = {k: v for k, v in request.headers.items() if k.lower() != "host"}
            
            response = await client.request(
                method=request.method,
                url=url,
                headers=headers,
                content=body,
                params=dict(request.query_params)
            )
            content_type = response.headers.get("content-type", "")
            if "application/json" in content_type:
                return JSONResponse(
                    content=response.json(),
                    status_code=response.status_code
                )
            else:
                return JSONResponse(
                    content={"text": response.text},
                    status_code=response.status_code
                )
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="Resume AI Service timeout - service may be overloaded")
    except httpx.ConnectError:
        raise HTTPException(status_code=503, detail="Resume AI Service not available - service may not be running")
    except httpx.RequestError as e:
        raise HTTPException(status_code=503, detail=f"Resume AI Service error: {str(e)}")

@app.api_route("/predict/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH"])
async def proxy_placement(path: str, request: Request):
    """Proxy requests to Placement Prediction Service"""
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            # Map unified routes to internal service routes
            # External: /predict/placement -> Internal: /predict/placement
            url = f"{INTERNAL_SERVICES['placement']}/predict/{path}"
            body = await request.body()
            headers = {k: v for k, v in request.headers.items() if k.lower() != "host"}
            
            response = await client.request(
                method=request.method,
                url=url,
                headers=headers,
                content=body,
                params=dict(request.query_params)
            )
            content_type = response.headers.get("content-type", "")
            if "application/json" in content_type:
                return JSONResponse(
                    content=response.json(),
                    status_code=response.status_code
                )
            else:
                return JSONResponse(
                    content={"text": response.text},
                    status_code=response.status_code
                )
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="Placement Prediction Service timeout - service may be overloaded")
    except httpx.ConnectError:
        raise HTTPException(status_code=503, detail="Placement Prediction Service not available - service may not be running")
    except httpx.RequestError as e:
        raise HTTPException(status_code=503, detail=f"Placement Prediction Service error: {str(e)}")

@app.api_route("/match/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH"])
async def proxy_skill(path: str, request: Request):
    """Proxy requests to Skill Match Service"""
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            # Map unified routes to internal service routes
            # External: /match/skills -> Internal: /match/skills
            url = f"{INTERNAL_SERVICES['skill']}/match/{path}"
            body = await request.body()
            headers = {k: v for k, v in request.headers.items() if k.lower() != "host"}
            
            print(f"[DEBUG] Proxying to Skill Match: {url}")  # Debug logging
            
            response = await client.request(
                method=request.method,
                url=url,
                headers=headers,
                content=body,
                params=dict(request.query_params)
            )
            content_type = response.headers.get("content-type", "")
            if "application/json" in content_type:
                return JSONResponse(
                    content=response.json(),
                    status_code=response.status_code
                )
            else:
                return JSONResponse(
                    content={"text": response.text},
                    status_code=response.status_code
                )
    except httpx.TimeoutException as e:
        print(f"[ERROR] Skill Match Service timeout: {e}")
        raise HTTPException(status_code=504, detail="Skill Match Service timeout - service may be overloaded or not responding")
    except httpx.ConnectError as e:
        print(f"[ERROR] Skill Match Service connection error: {e}")
        print(f"[ERROR] Attempted URL: {INTERNAL_SERVICES['skill']}/match/{path}")
        raise HTTPException(status_code=503, detail="Skill Match Service not available - service may not be running on port 8003")
    except httpx.RequestError as e:
        print(f"[ERROR] Skill Match Service request error: {e}")
        raise HTTPException(status_code=503, detail=f"Skill Match Service error: {str(e)}")

# ============================================================================
# HEALTH CHECK
# ============================================================================
@app.get("/health")
async def health_check():
    """Health check for all services"""
    service_status = {}
    async with httpx.AsyncClient(timeout=5.0) as client:
        for name, base_url in INTERNAL_SERVICES.items():
            try:
                response = await client.get(f"{base_url}/health", timeout=3.0)
                if response.status_code == 200:
                    service_status[name] = "healthy"
                else:
                    service_status[name] = f"unhealthy (status {response.status_code})"
            except httpx.TimeoutException:
                service_status[name] = "timeout (service may be starting - wait 10-15 seconds)"
            except httpx.ConnectError:
                service_status[name] = "connection refused (service not running on internal port)"
            except Exception as e:
                service_status[name] = f"unavailable ({str(e)[:50]})"
    
    all_healthy = all("healthy" in str(status) for status in service_status.values())
    any_healthy = any("healthy" in str(status) for status in service_status.values())
    
    return {
        "status": "healthy" if all_healthy else "degraded" if any_healthy else "unavailable",
        "service": "unified-ai-services",
        "port": 8000,
        "services": service_status,
        "internal_ports": {
            "resume": 8001,
            "placement": 8002,
            "skill": 8003
        },
        "endpoints": {
            "resume": "/resume/*",
            "placement": "/predict/*",
            "skill_match": "/match/*"
        },
        "note": "All services accessible on port 8000 via route prefixes. Internal services run on ports 8001, 8002, 8003."
    }

# Signal handlers
def signal_handler(sig, frame):
    """Handle shutdown signals"""
    print("\n[INFO] Received shutdown signal...")
    cleanup_processes()
    sys.exit(0)

signal.signal(signal.SIGINT, signal_handler)
signal.signal(signal.SIGTERM, signal_handler)

# Startup endpoint (doesn't require internal services)
@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "unified-ai-services",
        "port": 8000,
        "status": "running",
        "endpoints": {
            "resume": "/resume/*",
            "placement": "/predict/*",
            "skill_match": "/match/*",
            "health": "/health"
        }
    }

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("AI_SERVICE_PORT", "8000"))
    print(f"\n{'='*60}")
    print(f"Unified AI Services - All services on port {port}")
    print(f"{'='*60}")
    print(f"Resume AI: /resume/*")
    print(f"Placement Prediction: /predict/*")
    print(f"Skill Match: /match/*")
    print(f"{'='*60}")
    print(f"\nInternal services running on ports 8001, 8002, 8003")
    print(f"External access: All on port {port}")
    print(f"\nNote: Services may take a few seconds to fully initialize.")
    print(f"      If you see connection errors, wait 10-15 seconds and try again.\n")
    
    try:
        uvicorn.run(app, host="0.0.0.0", port=port)
    finally:
        cleanup_processes()

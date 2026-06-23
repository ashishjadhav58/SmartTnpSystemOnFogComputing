# Quick Start - Unified AI Services

## One Command to Start All Services

Instead of starting each service separately, use the unified launcher:

### Windows

```bash
# Option 1: Double-click
start-main.bat

# Option 2: PowerShell
.\start-main.ps1

# Option 3: Python directly
python main.py
```

### Linux/Mac

```bash
# Option 1: Bash script
./start-main.sh

# Option 2: Python directly
python3 main.py
```

## What It Does

The `main.py` launcher will:
1. ✅ Start Resume AI Service on port 8001
2. ✅ Start Placement Prediction Service (ML/DL) on port 8002
3. ✅ Start Skill Match Service on port 8003
4. ✅ Monitor all services
5. ✅ Auto-restart if any service crashes
6. ✅ Graceful shutdown with Ctrl+C

## Prerequisites

Make sure all dependencies are installed:

```bash
# Install dependencies for each service
pip install -r resume-ai-service/requirements.txt
pip install -r placement-prediction-service/requirements.txt
pip install -r skill-match-service/requirements.txt
```

## Output Example

```
============================================================
AI Services Unified Launcher
============================================================

Starting all AI microservices...

[INFO] Starting Resume AI Service on port 8001...
       Resume scoring and improvement with LLM (Groq/OpenAI)
[OK] Resume AI Service started successfully (PID: 12345)

[INFO] Starting Placement Prediction Service on port 8002...
       ML/DL placement probability prediction
[OK] Placement Prediction Service started successfully (PID: 12346)

[INFO] Starting Skill Match Service on port 8003...
       Skill matching between students and drives
[OK] Skill Match Service started successfully (PID: 12347)

[OK] Started 3 out of 3 services
============================================================
Services are running. Press Ctrl+C to stop all services.
============================================================

Service URLs:
  - Resume AI Service: http://localhost:8001
  - Placement Prediction Service: http://localhost:8002
  - Skill Match Service: http://localhost:8003

Health Check Endpoints:
  - Resume AI Service: http://localhost:8001/health
  - Placement Prediction Service: http://localhost:8002/health
  - Skill Match Service: http://localhost:8003/health
```

## Stop All Services

Press `Ctrl+C` to gracefully stop all services.

## Troubleshooting

### Port Already in Use
If you see "Port X is already in use", stop any existing services on those ports first.

### Service Fails to Start
Check the error messages. Common issues:
- Missing Python packages (install requirements.txt)
- Missing .env file (for Resume AI Service with Groq)
- Port conflicts

### Need to Start Services Separately?

If you prefer individual control, you can still start each service manually:

```bash
# Terminal 1
cd resume-ai-service
python main.py

# Terminal 2
cd placement-prediction-service
python main.py

# Terminal 3
cd skill-match-service
python main.py
```

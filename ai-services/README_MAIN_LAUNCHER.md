# Unified AI Services Launcher

This `main.py` file starts all AI microservices concurrently with a single command.

## Quick Start

```bash
# From the ai-services directory
python main.py
```

This will start all three services:
- **Resume AI Service** on port 8001
- **Placement Prediction Service (ML/DL)** on port 8002
- **Skill Match Service** on port 8003

## Features

- ✅ Starts all services concurrently
- ✅ Monitors service health
- ✅ Auto-restarts crashed services
- ✅ Graceful shutdown with Ctrl+C
- ✅ Port availability checking
- ✅ Real-time status updates

## Requirements

All service dependencies must be installed. Install them with:

```bash
# Install dependencies for all services
pip install -r resume-ai-service/requirements.txt
pip install -r placement-prediction-service/requirements.txt
pip install -r skill-match-service/requirements.txt

# Optional: For health checks
pip install requests
```

## Usage

### Start All Services

```bash
python main.py
```

### Stop All Services

Press `Ctrl+C` to gracefully stop all services.

## Service URLs

Once started, services are available at:

- Resume AI Service: http://localhost:8001
- Placement Prediction Service: http://localhost:8002
- Skill Match Service: http://localhost:8003

## Health Checks

Each service has a health endpoint:

- http://localhost:8001/health
- http://localhost:8002/health
- http://localhost:8003/health

## Troubleshooting

### Port Already in Use

If a port is already in use, the launcher will warn you but continue. Make sure to stop any existing services first.

### Service Fails to Start

Check the error messages in the console. Common issues:
- Missing dependencies (install requirements.txt for each service)
- Missing environment variables (check .env files)
- Port conflicts

### Service Crashes

The launcher will automatically attempt to restart crashed services. Check the console output for error details.

## Alternative: Start Services Individually

If you prefer to start services separately:

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

## Integration with Backend

The backend server (Node.js) expects these services to be running on:
- Port 8001: Resume AI Service
- Port 8002: Placement Prediction Service
- Port 8003: Skill Match Service

Make sure to start `main.py` before starting the backend server.

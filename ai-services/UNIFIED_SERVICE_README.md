# Unified AI Services - Single Port (8000)

All AI services are now accessible on **one port (8000)** instead of separate ports (8001, 8002, 8003).

## Quick Start

```bash
# From ai-services directory
python main.py
```

This will start the unified service on port 8000.

## How It Works

The unified service:
- Runs on **port 8000** (external)
- Starts internal services on ports 8001, 8002, 8003 (hidden from user)
- Proxies requests to internal services via route prefixes
- **Externally, everything appears on port 8000**

## Route Mapping

| External (Port 8000) | Internal Service | Original Port |
|---------------------|------------------|---------------|
| `/resume/*` | Resume AI Service | 8001 |
| `/predict/*` | Placement Prediction Service | 8002 |
| `/match/*` | Skill Match Service | 8003 |

## API Endpoints

All endpoints are accessible on port 8000:

### Resume AI Service
- `POST http://localhost:8000/resume/score`
- `POST http://localhost:8000/resume/improve`
- `POST http://localhost:8000/resume/generate-latex`
- `POST http://localhost:8000/resume/modify`
- `POST http://localhost:8000/resume/generate-project`
- `POST http://localhost:8000/resume/generate-internship`
- `POST http://localhost:8000/resume/generate-cv-summary`
- `POST http://localhost:8000/resume/generate-suggestions`

### Placement Prediction Service
- `POST http://localhost:8000/predict/placement`

### Skill Match Service
- `POST http://localhost:8000/match/skills`

### Health Check
- `GET http://localhost:8000/health`

## Backend Configuration

The backend is already configured to use the unified service:

```javascript
// backend/config/constants.js
const AI_SERVICE_BASE_URL = "http://localhost:8000";
const AI_SERVICES = {
  RESUME_AI: `${AI_SERVICE_BASE_URL}/resume`,
  PLACEMENT_PREDICTION: `${AI_SERVICE_BASE_URL}/predict`,
  SKILL_MATCH: `${AI_SERVICE_BASE_URL}/match`
};
```

## Benefits

✅ **Single Port**: Everything on port 8000  
✅ **Simpler Setup**: One service to start  
✅ **Same Functionality**: All features work the same  
✅ **Backward Compatible**: Backend routes updated automatically  

## Start the Service

```bash
# Option 1: Use main.py launcher (recommended)
cd ai-services
python main.py

# Option 2: Start unified service directly
cd ai-services/unified-service
python main.py
```

## Notes

- Internal services still run on ports 8001, 8002, 8003, but this is hidden from users
- The unified service acts as a reverse proxy
- All requests go through port 8000 externally
- No changes needed to frontend code

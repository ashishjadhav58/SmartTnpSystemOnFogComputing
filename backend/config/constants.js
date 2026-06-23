// API Configuration
const FOG_API = "https://c504-2409-40c2-3145-65c6-5109-bd59-afdc-5443.ngrok-free.app";
const PORT = 5000;

// AI Service URLs - All services on single port 8000 (localhost, NOT FOG_API)
// Unified service combines all three services on one port with route prefixes
// IMPORTANT: All AI services use localhost:8000, NOT FOG_API
const AI_SERVICE_BASE_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";
const AI_SERVICES = {
  RESUME_AI: `${AI_SERVICE_BASE_URL}/resume`,  // Routes: /resume/* (e.g., /resume/score, /resume/improve)
  PLACEMENT_PREDICTION: `${AI_SERVICE_BASE_URL}/predict`,  // Routes: /predict/* (e.g., /predict/placement)
  SKILL_MATCH: `${AI_SERVICE_BASE_URL}/match`  // Routes: /match/* (e.g., /match/skills)
};

// AWS Lambda API Gateway
const AWS_API_GATEWAY = "https://8aw0vy096i.execute-api.ap-south-1.amazonaws.com/prod";

// Sync API endpoint
const SYNC_API_ENDPOINT = `${AWS_API_GATEWAY}/syncdata`;

module.exports = {
  FOG_API,
  PORT,
  AI_SERVICES,
  AWS_API_GATEWAY,
  SYNC_API_ENDPOINT
};

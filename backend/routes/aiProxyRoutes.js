const express = require("express");
const router = express.Router();
const axios = require("axios");
const { handleJob } = require("../middleware/handleJob");

/**
 * Unified AI Service Proxy - All requests use POST method
 * This endpoint proxies all AI service requests, converting any GET to POST
 * 
 * Routes:
 * POST /api/ai-proxy/* - Proxies to AI services
 * 
 * Example:
 * POST /api/ai-proxy/resume/score -> POST http://localhost:8000/resume/score
 * POST /api/ai-proxy/predict/placement -> POST http://localhost:8000/predict/placement
 * POST /api/ai-proxy/match/skills -> POST http://localhost:8000/match/skills
 * POST /api/ai-proxy/resume/chat -> POST http://localhost:8000/resume/chat
 */
router.post("/ai-proxy/*", async (req, res) => {
  try {
    handleJob();
    
    // Get AI service base URL from request or use default
    // This allows dynamic AI service URL from signin response
    const aiServiceBaseUrl = req.headers['x-ai-service-url'] || 
                             req.body._aiServiceUrl || 
                             process.env.AI_SERVICE_URL || 
                             'http://localhost:8000';
    
    // Remove _aiServiceUrl from body if present (internal use only)
    const { _aiServiceUrl, ...requestBody } = req.body;
    
    // Extract the path after /api/ai-proxy/
    const originalPath = req.path.replace('/ai-proxy', '');
    
    // Construct full AI service URL
    const aiServiceUrl = `${aiServiceBaseUrl}${originalPath}`;
    
    console.log(`[AI Proxy] Proxying POST request to: ${aiServiceUrl}`);
    console.log(`[AI Proxy] Request body:`, JSON.stringify(requestBody, null, 2));
    
    try {
      // Always use POST method for AI service calls
      const response = await axios.post(aiServiceUrl, requestBody, {
        timeout: 60000, // 60 second timeout for AI services
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        validateStatus: (status) => status < 500 // Don't throw on 4xx errors
      });
      
      console.log(`[AI Proxy] Response status: ${response.status}`);
      console.log(`[AI Proxy] Response data:`, JSON.stringify(response.data, null, 2));
      
      // Return the response from AI service
      res.status(response.status).json(response.data);
    } catch (aiErr) {
      console.error(`[AI Proxy] Error calling AI service ${aiServiceUrl}:`, aiErr.message);
      console.error(`[AI Proxy] Error details:`, aiErr.response?.data || aiErr.message);
      
      // Return error response
      const statusCode = aiErr.response?.status || 503;
      const errorMessage = aiErr.response?.data?.error || 
                          aiErr.response?.data?.detail || 
                          aiErr.message || 
                          'AI service unavailable';
      
      res.status(statusCode).json({
        error: errorMessage,
        details: aiErr.response?.data || aiErr.message,
        service: aiServiceUrl,
        suggestion: 'Please ensure AI services are running and accessible'
      });
    }
  } catch (err) {
    console.error("[AI Proxy] Unexpected error:", err);
    res.status(500).json({
      error: "Internal proxy error",
      details: err.message
    });
  }
});

/**
 * Health check endpoint for AI proxy
 */
router.get("/ai-proxy/health", async (req, res) => {
  try {
    const aiServiceBaseUrl = req.headers['x-ai-service-url'] || 
                             process.env.AI_SERVICE_URL || 
                             'http://localhost:8000';
    
    // Check if AI service is accessible
    try {
      const response = await axios.get(`${aiServiceBaseUrl}/health`, {
        timeout: 5000
      });
      
      res.json({
        status: 'healthy',
        proxy: 'operational',
        aiService: response.data,
        baseUrl: aiServiceBaseUrl
      });
    } catch (healthErr) {
      res.status(503).json({
        status: 'unhealthy',
        proxy: 'operational',
        aiService: 'unavailable',
        baseUrl: aiServiceBaseUrl,
        error: healthErr.message
      });
    }
  } catch (err) {
    res.status(500).json({
      status: 'error',
      error: err.message
    });
  }
});

module.exports = router;

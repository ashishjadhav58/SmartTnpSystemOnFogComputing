/**
 * Utility to get AI service URL from various sources
 * Priority:
 * 1. Request header (x-ai-service-url)
 * 2. Request body (_aiServiceUrl)
 * 3. Environment variable (AI_SERVICE_URL)
 * 4. Default (http://localhost:8000)
 */
function getAiServiceUrl(req = null) {
  // Try to get from request header
  if (req && req.headers && req.headers['x-ai-service-url']) {
    return req.headers['x-ai-service-url'];
  }
  
  // Try to get from request body (internal use only)
  if (req && req.body && req.body._aiServiceUrl) {
    return req.body._aiServiceUrl;
  }
  
  // Try environment variable
  if (process.env.AI_SERVICE_URL) {
    return process.env.AI_SERVICE_URL;
  }
  
  // Default fallback
  return 'http://localhost:8000';
}

/**
 * Get AI service URL from localStorage (for frontend)
 * This is a helper function that can be used in frontend code
 */
function getAiServiceUrlFromStorage() {
  try {
    const aiServices = localStorage.getItem('aiServices');
    if (aiServices) {
      const parsed = JSON.parse(aiServices);
      return parsed.baseUrl || 'http://localhost:8000';
    }
  } catch (err) {
    console.error('Error reading AI services from localStorage:', err);
  }
  return 'http://localhost:8000';
}

module.exports = {
  getAiServiceUrl,
  getAiServiceUrlFromStorage
};

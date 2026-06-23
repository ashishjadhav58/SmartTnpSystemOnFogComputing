/**
 * Network utility functions for detecting IP vs domain and handling offline mode
 */

/**
 * Check if the current URL is an IP address (local network)
 * @returns {boolean} True if accessing via IP address
 */
export function isIPAddress() {
  const hostname = window.location.hostname;
  
  // Check if hostname is an IP address (IPv4 or IPv6)
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
  const localhostRegex = /^localhost$|^127\.0\.0\.1$/;
  
  return ipv4Regex.test(hostname) || ipv6Regex.test(hostname) || localhostRegex.test(hostname);
}

/**
 * Check if the current URL is the Vercel domain
 * @returns {boolean} True if accessing via Vercel domain
 */
export function isVercelDomain() {
  const hostname = window.location.hostname;
  return hostname === 'smartevolvetnp.vercel.app' || hostname.includes('vercel.app');
}

/**
 * Get the current host IP address (for local network access)
 * @returns {string} IP address with protocol
 */
export function getCurrentHostIP() {
  const protocol = window.location.protocol;
  const hostname = window.location.hostname;
  const port = window.location.port;
  
  // If accessing via IP, return the IP with protocol
  if (isIPAddress()) {
    return `${protocol}//${hostname}${port ? `:${port}` : ''}`;
  }
  
  // Otherwise return null (use default)
  return null;
}

/**
 * Try AWS signin/signup with fallback to local fog server
 * @param {Function} awsRequest - Function that makes AWS request (returns Promise)
 * @param {string} localEndpoint - Local endpoint path (e.g., '/api/user/signin')
 * @param {Object} requestData - Data to send in request
 * @returns {Promise} Response from either AWS or local server
 */
export async function tryAWSWithLocalFallback(awsRequest, localEndpoint, requestData) {
  // If accessing via Vercel domain, only use AWS
  if (isVercelDomain()) {
    console.log('[Network] Vercel domain detected - using AWS only');
    return await awsRequest();
  }
  
  // If accessing via IP, try AWS first, then fallback to local
  if (isIPAddress()) {
    const currentIP = getCurrentHostIP();
    console.log('[Network] IP address detected:', currentIP);
    
    try {
      // Try AWS first
      console.log('[Network] Attempting AWS request...');
      const awsResponse = await Promise.race([
        awsRequest(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('AWS timeout')), 5000)
        )
      ]);
      
      console.log('[Network] AWS request successful');
      return awsResponse;
    } catch (awsError) {
      console.warn('[Network] AWS request failed, falling back to local server:', awsError.message);
      
      // AWS failed, try local fog server
      const localBackendUrl = `${currentIP?.replace(/:\d+$/, '') || 'http://' + window.location.hostname}:5000`;
      const localUrl = `${localBackendUrl}${localEndpoint}`;
      
      console.log('[Network] Attempting local request to:', localUrl);
      
      try {
        const localResponse = await axios.post(localUrl, requestData, {
          timeout: 10000,
          headers: { 'Content-Type': 'application/json' }
        });
        
        console.log('[Network] Local request successful');
        
        // Return response in same format as AWS
        return {
          data: {
            data: localResponse.data.user || localResponse.data,
            ip: localBackendUrl,
            aiServices: {
              baseUrl: `${currentIP?.replace(/:\d+$/, '') || 'http://' + window.location.hostname}:8000`,
              resume: `${currentIP?.replace(/:\d+$/, '') || 'http://' + window.location.hostname}:8000/resume`,
              predict: `${currentIP?.replace(/:\d+$/, '') || 'http://' + window.location.hostname}:8000/predict`,
              match: `${currentIP?.replace(/:\d+$/, '') || 'http://' + window.location.hostname}:8000/match`,
              chat: `${currentIP?.replace(/:\d+$/, '') || 'http://' + window.location.hostname}:8000/resume/chat`
            },
            message: "Login Successful (Local Mode)"
          }
        };
      } catch (localError) {
        console.error('[Network] Local request also failed:', localError);
        throw new Error('Both AWS and local server are unavailable. Please check your network connection.');
      }
    }
  }
  
  // Default: try AWS only
  console.log('[Network] Using AWS (default)');
  return await awsRequest();
}

/**
 * Get AI service URL based on network mode
 * @returns {string} AI service base URL
 */
export function getAIServiceUrl() {
  if (isIPAddress()) {
    const hostname = window.location.hostname;
    return `http://${hostname}:8000`;
  }
  return 'http://localhost:8000';
}

/**
 * Get backend URL based on network mode
 * @returns {string} Backend base URL
 */
export function getBackendUrl() {
  if (isIPAddress()) {
    const hostname = window.location.hostname;
    return `http://${hostname}:5000`;
  }
  return 'http://localhost:5000';
}

/**
 * Get AI service URL from localStorage (for frontend)
 * When online: Uses AI service URL from AWS signin response
 * When offline: Uses local IP:8000
 * @returns {string} AI service base URL
 */
export function getAiServiceUrlFromStorage() {
  try {
    const aiServices = localStorage.getItem('aiServices');
    if (aiServices) {
      const parsed = JSON.parse(aiServices);
      const baseUrl = parsed.baseUrl || 'http://localhost:8000';
      console.log('[Network] AI Service URL from storage:', baseUrl);
      return baseUrl;
    }
  } catch (err) {
    console.error('[Network] Error reading AI services from localStorage:', err);
  }
  
  // Fallback: Use local IP if on IP address, otherwise localhost
  const fallbackUrl = isIPAddress() ? getAIServiceUrl() : 'http://localhost:8000';
  console.log('[Network] Using fallback AI Service URL:', fallbackUrl);
  return fallbackUrl;
}

/**
 * Get AI service URLs object from localStorage
 * Returns full aiServices object with all endpoints
 * When online: Uses AI service URLs from AWS signin response
 * When offline: Uses local IP:8000
 * @returns {Object} AI services object with baseUrl, resume, predict, match, chat
 */
export function getAiServicesFromStorage() {
  try {
    const aiServices = localStorage.getItem('aiServices');
    if (aiServices) {
      const parsed = JSON.parse(aiServices);
      console.log('[Network] AI Services from storage:', parsed);
      return parsed;
    }
  } catch (err) {
    console.error('[Network] Error reading AI services from localStorage:', err);
  }
  
  // Fallback: Create default AI services object
  const fallbackBaseUrl = isIPAddress() ? getAIServiceUrl() : 'http://localhost:8000';
  const fallbackServices = {
    baseUrl: fallbackBaseUrl,
    resume: `${fallbackBaseUrl}/resume`,
    predict: `${fallbackBaseUrl}/predict`,
    match: `${fallbackBaseUrl}/match`,
    chat: `${fallbackBaseUrl}/resume/chat`
  };
  console.log('[Network] Using fallback AI Services:', fallbackServices);
  return fallbackServices;
}

/**
 * Authentication and Session Management Utility
 */

/**
 * Get current user from session
 * @returns {Object|null} User object or null if not logged in
 */
export const getCurrentUser = () => {
  try {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    const user = JSON.parse(userStr);
    return user;
  } catch (error) {
    console.error('Error parsing user from localStorage:', error);
    return null;
  }
};

/**
 * Get current recruiter from session
 * @returns {Object|null} Recruiter object or null if not logged in
 */
export const getCurrentRecruiter = () => {
  try {
    const recruiterStr = localStorage.getItem('recruiter');
    if (!recruiterStr) return null;
    const recruiter = JSON.parse(recruiterStr);
    return recruiter;
  } catch (error) {
    console.error('Error parsing recruiter from localStorage:', error);
    return null;
  }
};

/**
 * Check if user is authenticated
 * @returns {boolean} True if user is logged in with valid data
 */
export const isAuthenticated = () => {
  const user = getCurrentUser();
  // Validate that user exists and has required fields
  if (!user || !user.email || !user.accesstype) {
    // Clear invalid data
    if (user && (!user.email || !user.accesstype)) {
      localStorage.removeItem('user');
      localStorage.removeItem('fogIp');
    }
    return false;
  }
  return true;
};

/**
 * Check if recruiter is authenticated
 * @returns {boolean} True if recruiter is logged in
 */
export const isRecruiterAuthenticated = () => {
  const recruiter = getCurrentRecruiter();
  return recruiter !== null && recruiter !== undefined;
};

/**
 * Check if user has specific access type
 * @param {string} accessType - Access type to check (e.g., "Student", "Training and placement officer")
 * @returns {boolean} True if user has the specified access type
 */
export const hasAccessType = (accessType) => {
  const user = getCurrentUser();
  return user && user.accesstype === accessType;
};

/**
 * Clear all session data and logout
 */
export const clearSession = () => {
  localStorage.removeItem('user');
  localStorage.removeItem('recruiter');
  localStorage.removeItem('fogIp');
  localStorage.removeItem('rememberedEmail');
};

/**
 * Set user session
 * @param {Object} user - User object to store
 */
export const setUserSession = (user) => {
  localStorage.setItem('user', JSON.stringify(user));
};

/**
 * Set recruiter session
 * @param {Object} recruiter - Recruiter object to store
 */
export const setRecruiterSession = (recruiter) => {
  localStorage.setItem('recruiter', JSON.stringify(recruiter));
};

/**
 * Get user role for chatbot
 * @returns {string} User role
 */
export const getUserRole = () => {
  const user = getCurrentUser();
  const recruiter = getCurrentRecruiter();
  
  if (user) return user.accesstype || 'Student';
  if (recruiter) return 'Recruiter';
  return 'Student';
};

/**
 * Check if admin is authenticated
 * @returns {boolean} True if admin is logged in
 */
export const isAdminAuthenticated = () => {
  try {
    const adminSessionStr = localStorage.getItem('adminSession');
    if (!adminSessionStr) return false;
    const adminSession = JSON.parse(adminSessionStr);
    return adminSession.isAdmin && adminSession.expiresAt > Date.now();
  } catch (error) {
    console.error('Error parsing admin session:', error);
    return false;
  }
};

/**
 * Set admin session
 * @param {Object} adminData - Admin session data
 */
export const setAdminSession = (adminData) => {
  localStorage.setItem('adminSession', JSON.stringify(adminData));
};

/**
 * Get current admin from session
 * @returns {Object|null} Admin object or null if not logged in
 */
export const getCurrentAdmin = () => {
  try {
    const adminSessionStr = localStorage.getItem('adminSession');
    if (!adminSessionStr) return null;
    const adminSession = JSON.parse(adminSessionStr);
    if (adminSession.expiresAt <= Date.now()) {
      localStorage.removeItem('adminSession');
      return null;
    }
    return adminSession;
  } catch (error) {
    console.error('Error parsing admin session:', error);
    return null;
  }
};

/**
 * Clear admin session
 */
export const clearAdminSession = () => {
  localStorage.removeItem('adminSession');
};

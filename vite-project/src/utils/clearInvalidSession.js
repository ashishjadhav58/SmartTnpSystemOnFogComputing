/**
 * Utility to clear invalid session data
 * Call this on app startup to clean up stale localStorage
 */

export const clearInvalidSession = () => {
  try {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      // Check if user data is valid
      if (!user || !user.email || !user.accesstype) {
        console.log('Clearing invalid user session');
        localStorage.removeItem('user');
        localStorage.removeItem('fogIp');
      }
    }
  } catch (error) {
    console.error('Error checking session:', error);
    // If parsing fails, clear everything
    localStorage.removeItem('user');
    localStorage.removeItem('fogIp');
  }
};

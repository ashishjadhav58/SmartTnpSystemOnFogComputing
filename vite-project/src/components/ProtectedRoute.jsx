import React from 'react';
import { Navigate } from 'react-router-dom';
import { isAuthenticated, isRecruiterAuthenticated, hasAccessType, isAdminAuthenticated } from '../utils/auth';

/**
 * Protected Route Component
 * Redirects to login if user is not authenticated
 */
export const ProtectedRoute = ({ children, requiredAccessType = null, requireRecruiter = false, requireAdmin = false }) => {
  // Check admin authentication if required
  if (requireAdmin) {
    if (!isAdminAuthenticated()) {
      return <Navigate to="/admin/login" replace />;
    }
    return children;
  }

  // Check recruiter authentication if required
  if (requireRecruiter) {
    if (!isRecruiterAuthenticated()) {
      return <Navigate to="/" replace />; // Use main login page
    }
    return children;
  }

  // Check regular user authentication
  if (!isAuthenticated()) {
    return <Navigate to="/" replace />;
  }

  // Check specific access type if required
  if (requiredAccessType) {
    if (!hasAccessType(requiredAccessType)) {
      // Redirect based on user's actual access type
      const user = JSON.parse(localStorage.getItem('user'));
      if (user) {
        switch (user.accesstype) {
          case 'Student':
            return <Navigate to="/student" replace />;
          case 'Training and placement officer':
            return <Navigate to="/tpo" replace />;
          case 'Class Teacher':
            return <Navigate to="/classteacher" replace />;
          default:
            return <Navigate to="/" replace />;
        }
      }
      return <Navigate to="/" replace />;
    }
  }

  return children;
};

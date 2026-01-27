import React from 'react'
import Loginpage from './Loginpage'
import Register from './Register'
import HPstudent from './HPstudent'
import { Route, Routes } from "react-router-dom";
import StTNPEvent from './StTNPEvent';
import StSelfattendence from './StSelfattendence';
import Stplacementdrive from './Stplacementdrive';
import StINTERVIEWINFORMATIONGROUPS from './StINTERVIEWINFORMATIONGROUPS';
import Stddashboard from './Stddashboard';
import HPTPO from './HPTPO'
import HPclassteacher from './HPclassteacher'
import MessageInterface from './MessageInterface';
// RecruiterLogin removed - using main login page for all users
import RecruiterDashboard from './RecruiterDashboard';
import ResumeBuilder from './ResumeBuilder';
import AIChatbot from './AIChatbot';
import { ProtectedRoute } from './components/ProtectedRoute';
import { getUserRole } from './utils/auth';
import ErrorBoundary from './components/ErrorBoundary';

export default function App() {
  return (
    <ErrorBoundary>
      <div>
        <Routes>
        <Route path="/" element={<Loginpage/>} />
        <Route path="/signup" element={<Register />} />
        
        {/* Protected Routes */}
        <Route 
          path="/student" 
          element={
            <ProtectedRoute requiredAccessType="Student">
              <HPstudent />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/message" 
          element={
            <ProtectedRoute>
              <MessageInterface/>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/tpo" 
          element={
            <ProtectedRoute requiredAccessType="Training and placement officer">
              <HPTPO />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/classteacher" 
          element={
            <ProtectedRoute requiredAccessType="Class Teacher">
              <HPclassteacher />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/resume/builder" 
          element={
            <ProtectedRoute requiredAccessType="Student">
              <ResumeBuilder />
            </ProtectedRoute>
          } 
        />
        
        {/* Recruiter Routes - using main login page */}
        <Route 
          path="/recruiter/dashboard" 
          element={
            <ProtectedRoute requireRecruiter={true}>
              <RecruiterDashboard />
            </ProtectedRoute>
          } 
        />
        </Routes>
        {/* Global AI Chatbot - available on all pages */}
        <AIChatbot userRole={getUserRole()} />
      </div>
    </ErrorBoundary>
  )
}
